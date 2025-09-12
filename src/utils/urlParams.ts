// Utility functions for parsing URL parameters

export interface LocationParams {
  lat: number;
  lng: number;
  zoom?: number;
}

// Parse lat/lng from query string parameters
export function parseLocationFromURL(): LocationParams | null {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get("lat");
  const lng = urlParams.get("lng");
  const zoom = urlParams.get("zoom");

  if (lat && lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedZoom = zoom ? parseFloat(zoom) : undefined;

    // Validate coordinates are within reasonable bounds for Japan
    if (isValidLatLng(parsedLat, parsedLng)) {
      return {
        lat: parsedLat,
        lng: parsedLng,
        zoom: parsedZoom,
      };
    }
  }

  return null;
}

// Update URL with new coordinates
export function updateURLWithLocation(lat: number, lng: number, zoom?: number) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.set("lat", lat.toFixed(6));
  url.searchParams.set("lng", lng.toFixed(6));

  if (zoom !== undefined) {
    url.searchParams.set("zoom", zoom.toString());
  }

  // Update URL without refreshing the page
  window.history.replaceState({}, "", url.toString());
}

// Debounced version for automatic map updates
let updateTimeout: NodeJS.Timeout | null = null;

export function updateURLWithLocationDebounced(
  lat: number,
  lng: number,
  zoom?: number,
  delay: number = 1000,
) {
  if (typeof window === "undefined") return;

  // Clear existing timeout
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  // Set new timeout
  updateTimeout = setTimeout(() => {
    updateURLWithLocation(lat, lng, zoom);
    updateTimeout = null;
  }, delay);
}

// Validate that coordinates are reasonable for Japan
function isValidLatLng(lat: number, lng: number): boolean {
  // Japan bounds (approximate): lat 24-46, lng 123-146
  return lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146;
}

// Get default location (Tokyo Imperial Palace)
export function getDefaultLocation(): LocationParams {
  return {
    lat: 35.6852,
    lng: 139.753,
    zoom: 14,
  };
}
