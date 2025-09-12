export interface DrinkingWaterPoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: number;
    amenity: "drinking_water";
    // Common additional properties
    name?: string;
    "name:ja"?: string;
    "name:en"?: string;
    operator?: string;
    wheelchair?: "yes" | "no" | "limited";
    fee?: "yes" | "no";
    bottle?: "yes" | "no";
    fountain?: string; // e.g., "bubbler"
    access?: string; // e.g., "yes", "private", "customers"
    check_date?: string;
    indoor?: "yes" | "no";
    covered?: "yes" | "no";
    cold_water?: "yes" | "no";
    hot_water?: "yes" | "no";
    description?: string;
  };
}

export interface DrinkingWaterCollection {
  type: "FeatureCollection";
  features: DrinkingWaterPoint[];
}

// Prefecture mapping for data loading
const PREFECTURE_FILES = {
  hokkaido: "hokkaido-drinking-water.json",
  aomori: "aomori-drinking-water.json",
  iwate: "iwate-drinking-water.json",
  miyagi: "miyagi-drinking-water.json",
  akita: "akita-drinking-water.json",
  yamagata: "yamagata-drinking-water.json",
  fukushima: "fukushima-drinking-water.json",
  ibaraki: "ibaraki-drinking-water.json",
  tochigi: "tochigi-drinking-water.json",
  gunma: "gunma-drinking-water.json",
  saitama: "saitama-drinking-water.json",
  chiba: "chiba-drinking-water.json",
  tokyo: "tokyo-drinking-water.json",
  kanagawa: "kanagawa-drinking-water.json",
  niigata: "niigata-drinking-water.json",
  toyama: "toyama-drinking-water.json",
  ishikawa: "ishikawa-drinking-water.json",
  fukui: "fukui-drinking-water.json",
  yamanashi: "yamanashi-drinking-water.json",
  nagano: "nagano-drinking-water.json",
  gifu: "gifu-drinking-water.json",
  shizuoka: "shizuoka-drinking-water.json",
  aichi: "aichi-drinking-water.json",
  mie: "mie-drinking-water.json",
  shiga: "shiga-drinking-water.json",
  kyoto: "kyoto-drinking-water.json",
  osaka: "osaka-drinking-water.json",
  hyogo: "hyogo-drinking-water.json",
  nara: "nara-drinking-water.json",
  wakayama: "wakayama-drinking-water.json",
  tottori: "tottori-drinking-water.json",
  shimane: "shimane-drinking-water.json",
  okayama: "okayama-drinking-water.json",
  hiroshima: "hiroshima-drinking-water.json",
  yamaguchi: "yamaguchi-drinking-water.json",
  tokushima: "tokushima-drinking-water.json",
  kagawa: "kagawa-drinking-water.json",
  ehime: "ehime-drinking-water.json",
  kochi: "kochi-drinking-water.json",
  fukuoka: "fukuoka-drinking-water.json",
  saga: "saga-drinking-water.json",
  nagasaki: "nagasaki-drinking-water.json",
  kumamoto: "kumamoto-drinking-water.json",
  oita: "oita-drinking-water.json",
  miyazaki: "miyazaki-drinking-water.json",
  kagoshima: "kagoshima-drinking-water.json",
  okinawa: "okinawa-drinking-water.json",
};

// Cache for loaded data
const dataCache = new Map<string, DrinkingWaterCollection>();

export async function loadPrefectureData(
  prefecture: string,
): Promise<DrinkingWaterCollection | null> {
  // Check cache first
  if (dataCache.has(prefecture)) {
    return dataCache.get(prefecture)!;
  }

  const filename =
    PREFECTURE_FILES[prefecture as keyof typeof PREFECTURE_FILES];
  if (!filename) {
    console.warn(`No data file found for prefecture: ${prefecture}`);
    return null;
  }

  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.status}`);
    }

    const data: DrinkingWaterCollection = await response.json();

    // Cache the data
    dataCache.set(prefecture, data);

    console.log(
      `Loaded ${data.features.length} drinking water points for ${prefecture}`,
    );
    return data;
  } catch (error) {
    console.error(`Error loading data for ${prefecture}:`, error);
    return null;
  }
}

// Load multiple prefectures at once
export async function loadMultiplePrefectures(
  prefectures: string[],
): Promise<DrinkingWaterPoint[]> {
  const promises = prefectures.map((prefecture) =>
    loadPrefectureData(prefecture),
  );
  const results = await Promise.all(promises);

  // Combine all features from successful loads
  const allFeatures: DrinkingWaterPoint[] = [];
  results.forEach((data) => {
    if (data) {
      allFeatures.push(...data.features);
    }
  });

  return allFeatures;
}

// Get list of available prefectures
export function getAvailablePrefectures(): string[] {
  return Object.keys(PREFECTURE_FILES);
}
