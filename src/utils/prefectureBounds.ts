import maplibregl from "maplibre-gl";

// Approximate bounding boxes for Japanese prefectures [south, west, north, east]
export const PREFECTURE_BOUNDS: Record<
  string,
  [number, number, number, number]
> = {
  hokkaido: [41.4, 139.4, 45.6, 146.0],
  aomori: [40.2, 139.5, 41.6, 141.7],
  iwate: [38.7, 140.7, 40.4, 142.1],
  miyagi: [37.8, 140.3, 39.0, 141.7],
  akita: [38.9, 139.7, 40.4, 141.0],
  yamagata: [37.7, 139.5, 39.0, 140.6],
  fukushima: [36.8, 139.2, 37.9, 141.1],
  ibaraki: [35.7, 140.0, 36.9, 140.9],
  tochigi: [36.2, 139.4, 37.0, 140.3],
  gunma: [36.0, 138.4, 37.0, 139.9],
  saitama: [35.7, 138.7, 36.3, 139.9],
  chiba: [34.9, 139.7, 36.1, 140.9],
  tokyo: [35.5, 139.5, 35.9, 139.9],
  kanagawa: [35.1, 139.0, 35.6, 139.8],
  niigata: [36.8, 137.6, 38.6, 139.9],
  toyama: [36.3, 136.8, 36.9, 137.9],
  ishikawa: [36.0, 136.3, 37.9, 137.4],
  fukui: [35.3, 135.9, 36.4, 136.9],
  yamanashi: [35.1, 138.2, 35.9, 139.2],
  nagano: [35.2, 137.3, 37.0, 138.9],
  gifu: [35.3, 136.2, 36.5, 137.9],
  shizuoka: [34.6, 137.5, 35.7, 139.1],
  aichi: [34.6, 136.7, 35.4, 137.5],
  mie: [33.7, 135.9, 35.2, 136.9],
  shiga: [34.7, 135.8, 35.7, 136.4],
  kyoto: [34.8, 135.4, 35.8, 136.0],
  osaka: [34.3, 135.1, 34.8, 135.7],
  hyogo: [34.3, 134.3, 35.7, 135.5],
  nara: [33.9, 135.6, 34.8, 136.1],
  wakayama: [33.4, 135.1, 34.4, 135.8],
  tottori: [35.1, 133.3, 35.7, 134.3],
  shimane: [34.0, 131.7, 36.0, 133.4],
  okayama: [34.2, 133.2, 35.4, 134.7],
  hiroshima: [34.0, 132.2, 34.9, 133.3],
  yamaguchi: [33.7, 130.8, 34.5, 132.2],
  tokushima: [33.6, 134.0, 34.4, 134.8],
  kagawa: [34.1, 133.4, 34.5, 134.5],
  ehime: [33.0, 132.3, 34.4, 133.6],
  kochi: [32.7, 132.5, 33.8, 134.3],
  fukuoka: [33.0, 130.2, 34.0, 131.3],
  saga: [33.0, 129.8, 33.5, 130.4],
  nagasaki: [32.6, 128.9, 33.5, 130.4],
  kumamoto: [32.2, 130.2, 33.3, 131.1],
  oita: [32.8, 130.8, 33.8, 132.0],
  miyazaki: [31.4, 130.7, 32.8, 131.9],
  kagoshima: [26.0, 128.2, 32.1, 131.0],
  okinawa: [24.0, 122.9, 26.9, 131.3],
};

// Function to check if a point is within a bounding box
function isPointInBounds(
  lat: number,
  lng: number,
  bounds: [number, number, number, number],
): boolean {
  const [south, west, north, east] = bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

// Function to get prefectures that intersect with the current viewport
export function getPrefecturesInViewport(
  bounds: maplibregl.LngLatBounds,
): string[] {
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();

  const visiblePrefectures: string[] = [];

  for (const [prefecture, prefBounds] of Object.entries(PREFECTURE_BOUNDS)) {
    const [prefSouth, prefWest, prefNorth, prefEast] = prefBounds;

    // Check if prefecture bounds intersect with viewport bounds
    if (
      !(
        prefEast < west ||
        prefWest > east ||
        prefNorth < south ||
        prefSouth > north
      )
    ) {
      visiblePrefectures.push(prefecture);
    }
  }

  return visiblePrefectures;
}

// Function to get the main prefecture for a given center point (for initial loading)
export function getPrefectureForPoint(lat: number, lng: number): string | null {
  for (const [prefecture, bounds] of Object.entries(PREFECTURE_BOUNDS)) {
    if (isPointInBounds(lat, lng, bounds)) {
      return prefecture;
    }
  }
  return null;
}
