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

export interface ToiletPoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: number;
    amenity: "toilets";
    // Common additional properties
    name?: string;
    "name:ja"?: string;
    "name:en"?: string;
    operator?: string;
    wheelchair?: "yes" | "no" | "limited";
    fee?: "yes" | "no";
    access?: string; // e.g., "yes", "private", "customers"
    check_date?: string;
    indoor?: "yes" | "no";
    baby_changing?: "yes" | "no";
    unisex?: "yes" | "no";
    male?: "yes" | "no";
    female?: "yes" | "no";
    description?: string;
  };
}

export type AmenityPoint = DrinkingWaterPoint | ToiletPoint;

export interface DrinkingWaterCollection {
  type: "FeatureCollection";
  features: DrinkingWaterPoint[];
}

export interface ToiletCollection {
  type: "FeatureCollection";
  features: ToiletPoint[];
}

// Prefecture mapping for data loading
const DRINKING_WATER_FILES = {
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

const TOILET_FILES = {
  hokkaido: "hokkaido-toilets.json",
  aomori: "aomori-toilets.json",
  iwate: "iwate-toilets.json",
  miyagi: "miyagi-toilets.json",
  akita: "akita-toilets.json",
  yamagata: "yamagata-toilets.json",
  fukushima: "fukushima-toilets.json",
  ibaraki: "ibaraki-toilets.json",
  tochigi: "tochigi-toilets.json",
  gunma: "gunma-toilets.json",
  saitama: "saitama-toilets.json",
  chiba: "chiba-toilets.json",
  tokyo: "tokyo-toilets.json",
  kanagawa: "kanagawa-toilets.json",
  niigata: "niigata-toilets.json",
  toyama: "toyama-toilets.json",
  ishikawa: "ishikawa-toilets.json",
  fukui: "fukui-toilets.json",
  yamanashi: "yamanashi-toilets.json",
  nagano: "nagano-toilets.json",
  gifu: "gifu-toilets.json",
  shizuoka: "shizuoka-toilets.json",
  aichi: "aichi-toilets.json",
  mie: "mie-toilets.json",
  shiga: "shiga-toilets.json",
  kyoto: "kyoto-toilets.json",
  osaka: "osaka-toilets.json",
  hyogo: "hyogo-toilets.json",
  nara: "nara-toilets.json",
  wakayama: "wakayama-toilets.json",
  tottori: "tottori-toilets.json",
  shimane: "shimane-toilets.json",
  okayama: "okayama-toilets.json",
  hiroshima: "hiroshima-toilets.json",
  yamaguchi: "yamaguchi-toilets.json",
  tokushima: "tokushima-toilets.json",
  kagawa: "kagawa-toilets.json",
  ehime: "ehime-toilets.json",
  kochi: "kochi-toilets.json",
  fukuoka: "fukuoka-toilets.json",
  saga: "saga-toilets.json",
  nagasaki: "nagasaki-toilets.json",
  kumamoto: "kumamoto-toilets.json",
  oita: "oita-toilets.json",
  miyazaki: "miyazaki-toilets.json",
  kagoshima: "kagoshima-toilets.json",
  okinawa: "okinawa-toilets.json",
};

// Cache for loaded data
const drinkingWaterCache = new Map<string, DrinkingWaterCollection>();
const toiletCache = new Map<string, ToiletCollection>();

export async function loadPrefectureData(
  prefecture: string,
): Promise<DrinkingWaterCollection | null> {
  // Check cache first
  if (drinkingWaterCache.has(prefecture)) {
    return drinkingWaterCache.get(prefecture)!;
  }

  const filename =
    DRINKING_WATER_FILES[prefecture as keyof typeof DRINKING_WATER_FILES];
  if (!filename) {
    console.warn(`No drinking water data file found for prefecture: ${prefecture}`);
    return null;
  }

  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.status}`);
    }

    const data: DrinkingWaterCollection = await response.json();

    // Cache the data
    drinkingWaterCache.set(prefecture, data);

    console.log(
      `Loaded ${data.features.length} drinking water points for ${prefecture}`,
    );
    return data;
  } catch (error) {
    console.error(`Error loading drinking water data for ${prefecture}:`, error);
    return null;
  }
}

export async function loadToiletData(
  prefecture: string,
): Promise<ToiletCollection | null> {
  // Check cache first
  if (toiletCache.has(prefecture)) {
    return toiletCache.get(prefecture)!;
  }

  const filename =
    TOILET_FILES[prefecture as keyof typeof TOILET_FILES];
  if (!filename) {
    console.warn(`No toilet data file found for prefecture: ${prefecture}`);
    return null;
  }

  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.status}`);
    }

    const data: ToiletCollection = await response.json();

    // Cache the data
    toiletCache.set(prefecture, data);

    console.log(
      `Loaded ${data.features.length} toilet points for ${prefecture}`,
    );
    return data;
  } catch (error) {
    console.error(`Error loading toilet data for ${prefecture}:`, error);
    return null;
  }
}

// Load multiple prefectures at once for drinking water
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

// Load multiple prefectures at once for toilets
export async function loadMultipleToilets(
  prefectures: string[],
): Promise<ToiletPoint[]> {
  const promises = prefectures.map((prefecture) =>
    loadToiletData(prefecture),
  );
  const results = await Promise.all(promises);

  // Combine all features from successful loads
  const allFeatures: ToiletPoint[] = [];
  results.forEach((data) => {
    if (data) {
      allFeatures.push(...data.features);
    }
  });

  return allFeatures;
}

// Load both amenity types for multiple prefectures
export async function loadMultipleAmenities(
  prefectures: string[],
): Promise<{ drinkingWater: DrinkingWaterPoint[]; toilets: ToiletPoint[] }> {
  const [drinkingWater, toilets] = await Promise.all([
    loadMultiplePrefectures(prefectures),
    loadMultipleToilets(prefectures),
  ]);

  return { drinkingWater, toilets };
}

// Get list of available prefectures
export function getAvailablePrefectures(): string[] {
  return Object.keys(DRINKING_WATER_FILES);
}
