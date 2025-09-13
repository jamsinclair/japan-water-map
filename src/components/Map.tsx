import { useEffect, useRef, useState } from "preact/hooks";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  loadMultiplePrefectures,
  loadMultipleToilets,
  DrinkingWaterPoint,
  ToiletPoint,
} from "../utils/dataLoader";
import { getPrefecturesInViewport } from "../utils/prefectureBounds";
import { updateURLWithLocationDebounced } from "../utils/urlParams";

const WATER_PROPERTIES_TO_SHOW = [
  "operator",
  "wheelchair",
  "fee",
  "bottle",
  "fountain",
  "access",
  "indoor",
  "covered",
  "cold_water",
  "hot_water",
  "check_date",
  "description",
];

const TOILET_PROPERTIES_TO_SHOW = [
  "operator",
  "wheelchair",
  "fee",
  "access",
  "indoor",
  "baby_changing",
  "unisex",
  "male",
  "female",
  "check_date",
  "description",
];

interface MapProps {
  center: [number, number];
  zoom: number;
  onMapReady?: (map: maplibregl.Map) => void;
  locale?: "en" | "ja";
  showDrinkingWater?: boolean;
  showToilets?: boolean;
}

export function Map({
  center,
  zoom,
  onMapReady,
  locale = "en",
  showDrinkingWater = true,
  showToilets = true,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loadedWaterPrefectures, setLoadedWaterPrefectures] = useState<
    Set<string>
  >(new Set());
  const [loadedToiletPrefectures, setLoadedToiletPrefectures] = useState<
    Set<string>
  >(new Set());

  // Refs to track currently loading prefectures to prevent duplicate loads
  const loadingWaterPrefectures = useRef<Set<string>>(new Set());
  const loadingToiletPrefectures = useRef<Set<string>>(new Set());
  const [drinkingWaterData, setDrinkingWaterData] = useState<
    DrinkingWaterPoint[]
  >([]);
  const [toiletData, setToiletData] = useState<ToiletPoint[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Translations for UI elements
  const translations = {
    en: {
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      myLocation: "My Location",
      openInMaps: "Open in Maps",
      location: "Location",
      drinkingWater: "Drinking Water",
      toilet: "Toilet",
      geolocationNotSupported: "Geolocation is not supported by this browser.",
      locationError:
        "Unable to get your location. Please check your location settings.",
      fieldLabels: {
        operator: "Operator",
        wheelchair: "Wheelchair Access",
        fee: "Fee Required",
        bottle: "Bottle Filling",
        fountain: "Fountain Type",
        access: "Access",
        indoor: "Indoor",
        covered: "Covered",
        cold_water: "Cold Water",
        hot_water: "Hot Water",
        check_date: "Last Checked",
        description: "Description",
        baby_changing: "Baby Changing",
        unisex: "Unisex",
        male: "Male",
        female: "Female",
      },
    },
    ja: {
      zoomIn: "ズームイン",
      zoomOut: "ズームアウト",
      myLocation: "現在位置",
      openInMaps: "マップで開く",
      location: "位置",
      drinkingWater: "飲料水",
      toilet: "トイレ",
      geolocationNotSupported: "このブラウザは位置情報をサポートしていません。",
      locationError:
        "あなたの位置を取得できません。位置情報設定を確認してください。",
      fieldLabels: {
        operator: "運営者",
        wheelchair: "車椅子アクセス",
        fee: "料金",
        bottle: "ボトル補充",
        fountain: "噴水タイプ",
        access: "アクセス",
        indoor: "屋内",
        covered: "屋根付き",
        cold_water: "冷水",
        hot_water: "温水",
        check_date: "最終確認日",
        description: "説明",
        baby_changing: "おむつ交換台",
        unisex: "男女共用",
        male: "男性用",
        female: "女性用",
      },
    },
  };

  const t = translations[locale];

  // Close existing popup and update click handlers when locale changes
  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Update click handlers for existing map
    if (mapRef.current) {
      const map = mapRef.current;

      // Remove existing click handlers - MapLibre doesn't support removing specific layer handlers
      // so we'll let the new handler override the old one

      // Add new click handler with current locale
      map.on("click", "drinking-water-points", (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0] as any;
          const coordinates = feature.geometry.coordinates.slice();
          const properties = feature.properties;

          // Close existing popup
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Create popup content with current locale
          const popupContent = createPopupContent(properties, coordinates);

          // Create and show popup with mobile-friendly options
          const popup = new maplibregl.Popup({
            offset: 15,
            className: "custom-popup",
            closeButton: true,
            closeOnClick: false,
            maxWidth: "300px",
          })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);

          popupRef.current = popup;
        }
      });
    }
  }, [locale]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize the map
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth.json", // Stadia Maps Alidade Smooth style
      center: [center[1], center[0]], // MapLibre uses [lng, lat] format
      zoom: zoom,
    });

    mapRef.current = map;

    // Add custom popup styles for mobile accessibility
    const popupStyleElement = document.createElement("style");
    popupStyleElement.textContent = `
      .custom-popup .maplibregl-popup-content {
        padding: 16px !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        max-width: 280px !important;
      }
      
      .custom-popup .maplibregl-popup-close-button {
        font-size: 20px !important;
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(0, 0, 0, 0.1) !important;
        border-radius: 4px !important;
        margin: 4px !important;
        color: #666 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        line-height: 1 !important;
        text-align: center !important;
        font-family: Arial, sans-serif !important;
      }
      
      .custom-popup .maplibregl-popup-close-button:hover {
        background: rgba(0, 0, 0, 0.2) !important;
        color: #333 !important;
      }
      
      .custom-popup .maplibregl-popup-tip {
        border-top-color: white !important;
      }
      
      @media (max-width: 480px) {
        .custom-popup .maplibregl-popup-content {
          max-width: 90vw !important;
          font-size: 16px !important;
        }
        
        .custom-popup .maplibregl-popup-close-button {
          font-size: 24px !important;
          width: 36px !important;
          height: 36px !important;
        }
      }
    `;
    document.head.appendChild(popupStyleElement);

    // Add global function for opening maps
    (window as any).openInMaps = (lat: number, lng: number) => {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      // Check if we're on mobile using modern detection methods
      const isMobile =
        "ontouchstart" in window &&
        window.matchMedia("(pointer: coarse)").matches;

      if (isMobile) {
        // On mobile, always use geo deep link
        const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}`;
        window.location.href = geoUrl;
      } else {
        // On desktop, directly open Google Maps
        window.open(googleMapsUrl, "_blank");
      }
    };

    // Call onMapReady callback when map is loaded
    map.on("load", () => {
      // Load PNG icons
      map
        .loadImage("/droplet.png")
        .then((response) => {
          if (response.data) {
            map.addImage("droplet-icon", response.data);
          }
        })
        .catch((error) => {
          console.error("Error loading droplet icon:", error);
        });

      map
        .loadImage("/toilet.png")
        .then((response) => {
          if (response.data) {
            map.addImage("toilet-icon", response.data);
          }
        })
        .catch((error) => {
          console.error("Error loading toilet icon:", error);
        });
      // Add drinking water data source with clustering enabled
      map.addSource("drinking-water", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 12, // Max zoom to cluster points on
        clusterRadius: 60, // Radius of each cluster when clustering points (reduced for better readability)
      });

      // Add toilet data source with clustering enabled
      map.addSource("toilets", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 12, // Max zoom to cluster points on
        clusterRadius: 60, // Radius of each cluster when clustering points (reduced for better readability)
      });

      // Add cluster circles layer
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "drinking-water",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#3b82f6",
            10,
            "#1e40af",
            30,
            "#1e3a8a",
          ],
          "circle-radius": ["step", ["get", "point_count"], 15, 8, 16, 22, 22],
        },
      });

      // Add cluster count labels
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "drinking-water",
        filter: ["has", "point_count"],
        layout: {
          "text-field":
            locale === "ja"
              ? [
                  "case",
                  [">=", ["get", "point_count"], 10000],
                  [
                    "concat",
                    [
                      "to-string",
                      ["round", ["/", ["get", "point_count"], 10000]],
                    ],
                    "万",
                  ],
                  ["to-string", ["get", "point_count"]],
                ]
              : "{point_count_abbreviated}",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add drinking water points layer (only unclustered points) with icon
      map.addLayer({
        id: "drinking-water-points",
        type: "symbol",
        source: "drinking-water",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "droplet-icon",
          "icon-size": 0.5, // Scale down the 64px icon
          "icon-allow-overlap": true,
        },
      });

      // Add toilet cluster circles layer
      map.addLayer({
        id: "toilet-clusters",
        type: "circle",
        source: "toilets",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#6b7280", // Gray-500
            10,
            "#4b5563", // Gray-600
            30,
            "#374151", // Gray-700
          ],
          "circle-radius": ["step", ["get", "point_count"], 15, 8, 16, 22, 22],
        },
      });

      // Add toilet cluster count labels
      map.addLayer({
        id: "toilet-cluster-count",
        type: "symbol",
        source: "toilets",
        filter: ["has", "point_count"],
        layout: {
          "text-field":
            locale === "ja"
              ? [
                  "case",
                  [">=", ["get", "point_count"], 10000],
                  [
                    "concat",
                    [
                      "to-string",
                      ["round", ["/", ["get", "point_count"], 10000]],
                    ],
                    "万",
                  ],
                  ["to-string", ["get", "point_count"]],
                ]
              : "{point_count_abbreviated}",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add toilet points layer (only unclustered points) with icon
      map.addLayer({
        id: "toilet-points",
        type: "symbol",
        source: "toilets",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "toilet-icon",
          "icon-size": 0.5, // Scale down the 64px icon
          "icon-allow-overlap": true,
        },
      });

      // Add click handler for drinking water points
      map.on("click", "drinking-water-points", (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0] as any;
          const coordinates = feature.geometry.coordinates.slice();
          const properties = feature.properties;

          // Close existing popup
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Create popup content
          const popupContent = createPopupContent(properties, coordinates);

          // Create and show popup with mobile-friendly options
          const popup = new maplibregl.Popup({
            offset: 15,
            className: "custom-popup",
            closeButton: true,
            closeOnClick: false,
            maxWidth: "300px",
          })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);

          popupRef.current = popup;
        }
      });

      // Add click handler for clusters
      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });

        if (features.length > 0) {
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource(
            "drinking-water",
          ) as maplibregl.GeoJSONSource;

          try {
            // Get the cluster expansion zoom level
            const expansionZoom =
              await source.getClusterExpansionZoom(clusterId);

            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: expansionZoom + 1,
            });
          } catch (error) {
            console.error("Error getting cluster expansion zoom:", error);
          }
        }
      });

      // Change cursor on hover for clusters
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Change cursor on hover
      map.on("mouseenter", "drinking-water-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "drinking-water-points", () => {
        map.getCanvas().style.cursor = "";
      });

      // Add click handler for toilet points
      map.on("click", "toilet-points", (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0] as any;
          const coordinates = feature.geometry.coordinates.slice();
          const properties = feature.properties;

          // Close existing popup
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Create popup content
          const popupContent = createPopupContent(properties, coordinates);

          // Create and show popup with mobile-friendly options
          const popup = new maplibregl.Popup({
            offset: 15,
            className: "custom-popup",
            closeButton: true,
            closeOnClick: false,
            maxWidth: "300px",
          })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);

          popupRef.current = popup;
        }
      });

      // Add click handler for toilet clusters
      map.on("click", "toilet-clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["toilet-clusters"],
        });

        if (features.length > 0) {
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource("toilets") as maplibregl.GeoJSONSource;

          try {
            // Get the cluster expansion zoom level
            const expansionZoom =
              await source.getClusterExpansionZoom(clusterId);

            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: expansionZoom + 1,
            });
          } catch (error) {
            console.error(
              "Error getting toilet cluster expansion zoom:",
              error,
            );
          }
        }
      });

      // Change cursor on hover for toilet clusters
      map.on("mouseenter", "toilet-clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "toilet-clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Change cursor on hover for toilet points
      map.on("mouseenter", "toilet-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "toilet-points", () => {
        map.getCanvas().style.cursor = "";
      });

      // Load data for current viewport
      loadDataForViewport();

      // Debounced data loading to prevent race conditions on rapid pan/zoom
      const debouncedLoadDataForViewport = () => {
        if (loadDataTimeoutRef.current) {
          clearTimeout(loadDataTimeoutRef.current);
        }
        loadDataTimeoutRef.current = setTimeout(loadDataForViewport, 300); // 300ms debounce
      };

      // Load data when map moves (debounced)
      map.on("moveend", debouncedLoadDataForViewport);

      // Update URL when map moves (debounced)
      map.on("moveend", () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        updateURLWithLocationDebounced(center.lat, center.lng, zoom, 1000);
      });

      if (onMapReady) {
        onMapReady(map);
      }
    });

    // Data loading function
    const loadDataForViewport = async () => {
      if (!mapRef.current) return;

      const bounds = mapRef.current.getBounds();
      const visiblePrefectures = getPrefecturesInViewport(bounds);

      // Find prefectures we haven't loaded yet for each amenity type (excluding currently loading ones)
      const newWaterPrefectures = showDrinkingWater
        ? visiblePrefectures.filter(
            (prefecture) =>
              !loadedWaterPrefectures.has(prefecture) &&
              !loadingWaterPrefectures.current.has(prefecture),
          )
        : [];
      const newToiletPrefectures = showToilets
        ? visiblePrefectures.filter(
            (prefecture) =>
              !loadedToiletPrefectures.has(prefecture) &&
              !loadingToiletPrefectures.current.has(prefecture),
          )
        : [];

      // Mark prefectures as loading immediately
      newWaterPrefectures.forEach((p) =>
        loadingWaterPrefectures.current.add(p),
      );
      newToiletPrefectures.forEach((p) =>
        loadingToiletPrefectures.current.add(p),
      );

      if (newWaterPrefectures.length === 0 && newToiletPrefectures.length === 0)
        return;

      try {
        // Load data only for prefectures that need it for each amenity type
        const waterPromise =
          newWaterPrefectures.length > 0
            ? loadMultiplePrefectures(newWaterPrefectures)
            : Promise.resolve([]);
        const toiletPromise =
          newToiletPrefectures.length > 0
            ? loadMultipleToilets(newToiletPrefectures)
            : Promise.resolve([]);

        const [newWaterData, newToiletData] = await Promise.all([
          waterPromise,
          toiletPromise,
        ]);

        // Update loaded prefectures and clear loading flags for each amenity type
        if (newWaterPrefectures.length > 0) {
          setLoadedWaterPrefectures((prev) => {
            const updated = new Set(prev);
            newWaterPrefectures.forEach((p) => {
              updated.add(p);
              loadingWaterPrefectures.current.delete(p); // Clear loading flag
            });
            return updated;
          });
        }

        if (newToiletPrefectures.length > 0) {
          setLoadedToiletPrefectures((prev) => {
            const updated = new Set(prev);
            newToiletPrefectures.forEach((p) => {
              updated.add(p);
              loadingToiletPrefectures.current.delete(p); // Clear loading flag
            });
            return updated;
          });
        }

        // Add new drinking water data to existing data (only if enabled)
        if (showDrinkingWater && newWaterData.length > 0) {
          setDrinkingWaterData((prev) => {
            // Create a Set of existing IDs for fast lookup - handle missing IDs gracefully
            const existingIds = new Set(
              prev
                .map((point) => point.properties?.id)
                .filter((id) => id !== undefined),
            );

            // Filter out points that already exist - only dedupe if ID exists
            const uniqueNewData = newWaterData.filter((point) => {
              const id = point.properties?.id;
              return id === undefined || !existingIds.has(id);
            });

            const updatedData = [...prev, ...uniqueNewData];

            // Update drinking water map source with the correct updated data
            const waterSource = mapRef.current!.getSource(
              "drinking-water",
            ) as maplibregl.GeoJSONSource;
            if (waterSource) {
              waterSource.setData({
                type: "FeatureCollection",
                features: updatedData,
              });
            }

            return updatedData;
          });
        }

        // Add new toilet data to existing data (only if enabled)
        if (showToilets && newToiletData.length > 0) {
          setToiletData((prev) => {
            // Create a Set of existing IDs for fast lookup - handle missing IDs gracefully
            const existingIds = new Set(
              prev
                .map((point) => point.properties?.id)
                .filter((id) => id !== undefined),
            );

            // Filter out points that already exist - only dedupe if ID exists
            const uniqueNewData = newToiletData.filter((point) => {
              const id = point.properties?.id;
              return id === undefined || !existingIds.has(id);
            });

            const updatedData = [...prev, ...uniqueNewData];

            // Update toilet map source with the correct updated data
            const toiletSource = mapRef.current!.getSource(
              "toilets",
            ) as maplibregl.GeoJSONSource;
            if (toiletSource) {
              toiletSource.setData({
                type: "FeatureCollection",
                features: updatedData,
              });
            }

            return updatedData;
          });
        }
      } catch (error) {
        console.error("Error loading prefecture data:", error);
        // Clear loading flags on error
        newWaterPrefectures.forEach((p) =>
          loadingWaterPrefectures.current.delete(p),
        );
        newToiletPrefectures.forEach((p) =>
          loadingToiletPrefectures.current.delete(p),
        );
      }
    };

    // Cleanup on unmount
    return () => {
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
      if (popupRef.current) {
        popupRef.current.remove();
      }
      // Clean up global function
      delete (window as any).openInMaps;
      // Clean up styles
      if (popupStyleElement.parentNode) {
        popupStyleElement.parentNode.removeChild(popupStyleElement);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter([center[1], center[0]]);
      mapRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Update layer visibility and clear data when props change
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      // Drinking water layers
      const waterLayers = [
        "clusters",
        "cluster-count",
        "drinking-water-points",
      ];
      waterLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            showDrinkingWater ? "visible" : "none",
          );
        }
      });

      // Clear drinking water data and reset source when disabled
      if (!showDrinkingWater) {
        setDrinkingWaterData([]);
        const waterSource = map.getSource(
          "drinking-water",
        ) as maplibregl.GeoJSONSource;
        if (waterSource) {
          waterSource.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
        // Reset loaded water prefectures so data can be reloaded when re-enabled
        setLoadedWaterPrefectures(new Set());
        loadingWaterPrefectures.current.clear();
      }

      // Toilet layers
      const toiletLayers = [
        "toilet-clusters",
        "toilet-cluster-count",
        "toilet-points",
      ];
      toiletLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            showToilets ? "visible" : "none",
          );
        }
      });

      // Clear toilet data and reset source when disabled
      if (!showToilets) {
        setToiletData([]);
        const toiletSource = map.getSource(
          "toilets",
        ) as maplibregl.GeoJSONSource;
        if (toiletSource) {
          toiletSource.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
        // Reset loaded toilet prefectures so data can be reloaded when re-enabled
        setLoadedToiletPrefectures(new Set());
        loadingToiletPrefectures.current.clear();
      }
    }
  }, [showDrinkingWater, showToilets]);

  // Create popup content from properties
  const createPopupContent = (
    properties: any,
    coordinates: [number, number],
  ): string => {
    const currentTranslations = translations[locale];
    const isToilet = properties.amenity === "toilets";

    const defaultName = isToilet
      ? currentTranslations.toilet
      : currentTranslations.drinkingWater;

    const name =
      properties["name:en"] ||
      properties["name:ja"] ||
      properties.name ||
      defaultName;

    // Format coordinates to 4 decimal places, removing trailing zeros
    const formatCoord = (coord: number): string => {
      return coord.toFixed(4).replace(/\.?0+$/, "");
    };

    const [lng, lat] = coordinates;
    const formattedLocation = `${formatCoord(lat)}, ${formatCoord(lng)}`;

    // Choose appropriate button color based on amenity type
    const buttonColor = isToilet ? "#4b5563" : "#3b82f6"; // Gray-600 for toilet, blue for water
    const buttonHoverColor = isToilet ? "#374151" : "#2563eb"; // Gray-700 on hover for toilet

    let content = `<div class="popup-content">`;
    content += `<h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">${name}</h3>`;
    content += `<div style="margin-bottom: 12px; color: #6b7280; font-size: 14px;">`;
    content += `<strong style="color: #374151;">${currentTranslations.location}:</strong> ${formattedLocation}`;
    content += `<br><button 
      onclick="openInMaps(${lat}, ${lng})" 
      style="
        margin-top: 8px; 
        padding: 8px 12px; 
        background: ${buttonColor}; 
        color: white; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer; 
        font-size: 14px; 
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        min-height: 36px;
        touch-action: manipulation;
      "
      onmouseover="this.style.background='${buttonHoverColor}'; this.style.transform='translateY(-1px)'" 
      onmouseout="this.style.background='${buttonColor}'; this.style.transform='translateY(0)'">
      📍 ${currentTranslations.openInMaps}
    </button>`;
    content += `</div>`;

    const fieldLabels = currentTranslations.fieldLabels;

    // Choose appropriate properties to show based on amenity type
    const propertiesToShow = isToilet
      ? TOILET_PROPERTIES_TO_SHOW
      : WATER_PROPERTIES_TO_SHOW;

    for (const property of propertiesToShow) {
      const value = properties[property];
      if (value && value !== "unknown") {
        const label = (fieldLabels as any)[property] || property;
        content += `<div style="
          margin-bottom: 8px; 
          padding: 4px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          line-height: 1.4;
        ">
          <strong style="color: #374151; display: inline-block; min-width: 80px;">${label}:</strong> 
          <span style="color: #6b7280;">${value}</span>
        </div>`;
      }
    }

    content += `</div>`;
    return content;
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert(t.geolocationNotSupported);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 16,
          });
          // Update URL immediately for location button usage
          updateURLWithLocationDebounced(latitude, longitude, 16, 100);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(t.locationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute bottom-16 right-4 sm:top-4 sm:left-4 sm:bottom-auto sm:right-auto flex flex-col gap-2 z-10">
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          <button
            onClick={handleZoomIn}
            aria-label={t.zoomIn}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200 cursor-pointer"
            title={t.zoomIn}
          >
            +
          </button>
          <button
            aria-label={t.zoomOut}
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            title={t.zoomOut}
          >
            −
          </button>
        </div>
        <button
          aria-label={t.myLocation}
          onClick={handleMyLocation}
          className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
          title={t.myLocation}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="12"
              y1="2"
              x2="12"
              y2="6"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="18"
              x2="12"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="22"
              y1="12"
              x2="18"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="6"
              y1="12"
              x2="2"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
