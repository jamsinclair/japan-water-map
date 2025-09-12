import { useState, useEffect, useRef } from "preact/hooks";
import { Map } from "./components/Map";
import { MapDescriptionCard } from "./components/MapDescriptionCard";
import {
  parseLocationFromURL,
  updateURLWithLocation,
  getDefaultLocation,
} from "./utils/urlParams";

export function App() {
  const [locale] = useState<"en" | "ja">(() => {
    return window.location.pathname.startsWith("/ja") ? "ja" : "en";
  });
  const defaultLoc = getDefaultLocation();
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    defaultLoc.lat,
    defaultLoc.lng,
  ]);
  const [mapZoom, setMapZoom] = useState(defaultLoc.zoom || 14);
  const mapInstanceRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  // Parse initial location from URL or use default (only on first load)
  useEffect(() => {
    if (!hasInitialized.current) {
      const urlLocation = parseLocationFromURL();
      if (urlLocation) {
        setMapCenter([urlLocation.lat, urlLocation.lng]);
        if (urlLocation.zoom) {
          setMapZoom(urlLocation.zoom);
        }
      }
      hasInitialized.current = true;
    }
  }, []);

  const handleLocaleChange = (value: "en" | "ja") => {
    // For this simple app, we just reload to the appropriate path
    const newPath = value === "ja" ? "/ja/" : "/";
    window.location.pathname = newPath;
  };

  const handleMapReady = (map: any) => {
    mapInstanceRef.current = map;
  };

  const handleCitySelect = (lat: number, lng: number, _cityName: string) => {
    const newCenter: [number, number] = [lat, lng];
    const newZoom = 13; // Good zoom level for city viewing

    setMapCenter(newCenter);
    setMapZoom(newZoom);

    // Update URL with new location
    updateURLWithLocation(lat, lng, newZoom);

    // If map instance is available, fly to the new location
    if (mapInstanceRef.current && mapInstanceRef.current.flyTo) {
      mapInstanceRef.current.flyTo(newCenter, newZoom, {
        animate: true,
        duration: 1.5,
      });
    }
  };

  return (
    <div class="h-screen w-screen relative">
      <Map
        locale={locale}
        center={mapCenter}
        zoom={mapZoom}
        onMapReady={handleMapReady}
      />
      <MapDescriptionCard
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onCitySelect={handleCitySelect}
      />
    </div>
  );
}
