import fs from "fs/promises";
import path from "path";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// All 47 Japanese prefectures using Japanese names (as found in OSM)
const PREFECTURE_MAP = {
  北海道: "hokkaido",
  青森県: "aomori",
  岩手県: "iwate",
  宮城県: "miyagi",
  秋田県: "akita",
  山形県: "yamagata",
  福島県: "fukushima",
  茨城県: "ibaraki",
  栃木県: "tochigi",
  群馬県: "gunma",
  埼玉県: "saitama",
  千葉県: "chiba",
  東京都: "tokyo",
  神奈川県: "kanagawa",
  新潟県: "niigata",
  富山県: "toyama",
  石川県: "ishikawa",
  福井県: "fukui",
  山梨県: "yamanashi",
  長野県: "nagano",
  岐阜県: "gifu",
  静岡県: "shizuoka",
  愛知県: "aichi",
  三重県: "mie",
  滋賀県: "shiga",
  京都府: "kyoto",
  大阪府: "osaka",
  兵庫県: "hyogo",
  奈良県: "nara",
  和歌山県: "wakayama",
  鳥取県: "tottori",
  島根県: "shimane",
  岡山県: "okayama",
  広島県: "hiroshima",
  山口県: "yamaguchi",
  徳島県: "tokushima",
  香川県: "kagawa",
  愛媛県: "ehime",
  高知県: "kochi",
  福岡県: "fukuoka",
  佐賀県: "saga",
  長崎県: "nagasaki",
  熊本県: "kumamoto",
  大分県: "oita",
  宮崎県: "miyazaki",
  鹿児島県: "kagoshima",
  沖縄県: "okinawa",
};

const PREFECTURES = Object.keys(PREFECTURE_MAP);

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Handle 429 Too Many Requests specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        let delay;

        if (retryAfter) {
          // Retry-After can be in seconds or HTTP date
          const retryAfterSeconds = parseInt(retryAfter, 10);
          if (!isNaN(retryAfterSeconds)) {
            // It's a number of seconds
            delay = retryAfterSeconds * 1000;
          } else {
            // It's an HTTP date, calculate the difference
            const retryDate = new Date(retryAfter);
            delay = Math.max(0, retryDate.getTime() - Date.now());
          }
        } else {
          // No Retry-After header, use exponential backoff with longer delays for 429
          delay = Math.pow(2, attempt - 1) * 10000; // Start at 10s, then 20s, 40s
        }

        console.log(
          `Rate limited (429). Retrying in ${Math.round(delay / 1000)}s...`,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay + 1000)); // Add 1s buffer
          continue;
        }
      }

      // For other HTTP errors, throw immediately
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // For non-HTTP errors (network issues, etc.), use standard exponential backoff
      const delay = Math.pow(2, attempt - 1) * 10000; // Start at 10s, then 20s, 40s
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function fetchDrinkingWaterForPrefecture(prefecture) {
  const query = `
    [out:json][timeout:60];
    (
      area["name"="${prefecture}"]["admin_level"="4"];
    )->.searchArea;
    (
      node["amenity"="drinking_water"](area.searchArea);
    );
    out geom;
  `;

  try {
    console.log(`Fetching drinking water data for ${prefecture}...`);

    const response = await fetchWithRetry(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    const data = await response.json();

    // Convert to GeoJSON
    const geoJson = {
      type: "FeatureCollection",
      features: data.elements.map((element) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [element.lon, element.lat],
        },
        properties: {
          id: element.id,
          ...element.tags,
        },
      })),
    };

    console.log(
      `Found ${geoJson.features.length} drinking water points in ${prefecture}`,
    );
    return geoJson;
  } catch (error) {
    console.error(`Error fetching data for ${prefecture}:`, error);
    return null;
  }
}

async function fetchToiletsForPrefecture(prefecture) {
  const query = `
    [out:json][timeout:60];
    (
      area["name"="${prefecture}"]["admin_level"="4"];
    )->.searchArea;
    (
      nwr["amenity"="toilets"](area.searchArea);
    );
    out geom;
  `;

  try {
    console.log(`Fetching toilet data for ${prefecture}...`);

    const response = await fetchWithRetry(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    const data = await response.json();

    // Convert to GeoJSON, handling different geometry types
    const geoJson = {
      type: "FeatureCollection",
      features: data.elements
        .map((element) => {
          let coordinates;

          if (element.type === "node" && element.lat && element.lon) {
            // Node with direct coordinates
            coordinates = [element.lon, element.lat];
          } else if (element.type === "way" && element.geometry) {
            // Way - calculate centroid from nodes
            const lons = element.geometry.map((node) => node.lon);
            const lats = element.geometry.map((node) => node.lat);
            const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
            const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            coordinates = [avgLon, avgLat];
          } else if (element.center) {
            // Some elements have a center property
            coordinates = [element.center.lon, element.center.lat];
          } else {
            // Skip elements without usable coordinates
            return null;
          }

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            properties: {
              id: element.id,
              element_type: element.type,
              ...element.tags,
            },
          };
        })
        .filter((feature) => feature !== null), // Remove null entries
    };

    console.log(`Found ${geoJson.features.length} toilets in ${prefecture}`);
    return geoJson;
  } catch (error) {
    console.error(`Error fetching toilet data for ${prefecture}:`, error);
    return null;
  }
}

async function main() {
  // Create data directory
  const dataDir = path.join(process.cwd(), "public/data");
  await fs.mkdir(dataDir, { recursive: true });

  // Track failed prefectures
  const failedWaterPrefectures = [];
  const failedToiletPrefectures = [];

  // Process each prefecture
  for (const prefecture of PREFECTURES) {
    // Fetch drinking water data
    const drinkingWaterData = await fetchDrinkingWaterForPrefecture(prefecture);

    if (drinkingWaterData) {
      const filename = `${PREFECTURE_MAP[prefecture]}-drinking-water.json`;
      const filepath = path.join(dataDir, filename);

      await fs.writeFile(
        filepath,
        JSON.stringify(drinkingWaterData, null, 2) + "\n",
      );
      console.log(`Saved ${filename}`);
    } else {
      failedWaterPrefectures.push(prefecture);
    }

    // Rate limiting - wait 2 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch toilet data
    const toiletData = await fetchToiletsForPrefecture(prefecture);

    if (toiletData) {
      const filename = `${PREFECTURE_MAP[prefecture]}-toilets.json`;
      const filepath = path.join(dataDir, filename);

      await fs.writeFile(filepath, JSON.stringify(toiletData, null, 2) + "\n");
      console.log(`Saved ${filename}`);
    } else {
      failedToiletPrefectures.push(prefecture);
    }

    // Rate limiting - wait 2 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("All prefectures processed!");

  // Log failed prefectures
  if (failedWaterPrefectures.length > 0) {
    console.log(
      `\nFailed to fetch drinking water data for ${failedWaterPrefectures.length} prefectures:`,
    );
    console.log(failedWaterPrefectures.join(", "));
  }

  if (failedToiletPrefectures.length > 0) {
    console.log(
      `\nFailed to fetch toilet data for ${failedToiletPrefectures.length} prefectures:`,
    );
    console.log(failedToiletPrefectures.join(", "));
  }

  if (
    failedWaterPrefectures.length === 0 &&
    failedToiletPrefectures.length === 0
  ) {
    console.log("\nAll data fetched successfully!");
  }
}

main().catch(console.error);
