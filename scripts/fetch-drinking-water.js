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

    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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

async function main() {
  // Create data directory
  const dataDir = path.join(process.cwd(), "public/data");
  await fs.mkdir(dataDir, { recursive: true });

  // Process each prefecture
  for (const prefecture of PREFECTURES) {
    const geoJsonData = await fetchDrinkingWaterForPrefecture(prefecture);

    if (geoJsonData) {
      const filename = `${PREFECTURE_MAP[prefecture]}-drinking-water.json`;
      const filepath = path.join(dataDir, filename);

      await fs.writeFile(filepath, JSON.stringify(geoJsonData));
      console.log(`Saved ${filename}`);
    }

    // Rate limiting - wait 2 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("All prefectures processed!");
}

main().catch(console.error);
