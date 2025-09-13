import { useState, useEffect } from "preact/hooks";

interface MapDescriptionCardProps {
  locale: "en" | "ja";
  onLocaleChange?: (locale: "en" | "ja") => void;
  onCitySelect?: (lat: number, lng: number, cityName: string) => void;
  showDrinkingWater?: boolean;
  showToilets?: boolean;
  onToggleDrinkingWater?: (show: boolean) => void;
  onToggleToilets?: (show: boolean) => void;
}

export function MapDescriptionCard({
  locale,
  onLocaleChange,
  onCitySelect,
  showDrinkingWater = true,
  showToilets = true,
  onToggleDrinkingWater,
  onToggleToilets,
}: MapDescriptionCardProps) {
  const currentLocale = locale || "en";
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Apply locale to document for global access
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  const handleLocaleChange = (locale: "en" | "ja") => {
    onLocaleChange?.(locale);
  };

  // Top 10 Japanese cities with coordinates
  const topCities = [
    { en: "Tokyo", ja: "東京", lat: 35.6852, lng: 139.753 },
    { en: "Osaka", ja: "大阪", lat: 34.6937, lng: 135.5023 },
    { en: "Nagoya", ja: "名古屋", lat: 35.1815, lng: 136.9066 },
    { en: "Sapporo", ja: "札幌", lat: 43.0642, lng: 141.3469 },
    { en: "Fukuoka", ja: "福岡", lat: 33.5904, lng: 130.4017 },
    { en: "Kobe", ja: "神戸", lat: 34.6901, lng: 135.1956 },
    { en: "Kyoto", ja: "京都", lat: 35.0116, lng: 135.7681 },
    { en: "Yokohama", ja: "横浜", lat: 35.4437, lng: 139.638 },
    { en: "Hiroshima", ja: "広島", lat: 34.3853, lng: 132.4553 },
    { en: "Sendai", ja: "仙台", lat: 38.2682, lng: 140.8694 },
  ];

  const handleCityClick = (city: (typeof topCities)[0]) => {
    const cityName = currentLocale === "ja" ? city.ja : city.en;
    onCitySelect?.(city.lat, city.lng, cityName);
  };

  const content = {
    en: {
      title: "Japan Water Map",
      description:
        "Interactive map showing drinking water sources and public toilets across Japan. Perfect for planning running routes, cycling, hiking, and outdoor activities. Data sourced from OpenStreetMap contributors.",
      disclaimer:
        "Note: Data reliability may vary and some fountains or toilets may be inaccessible.",
      localeLabel: "Language:",
      collapse: "Minimize",
      expand: "Show Details",
      quickCities: "Quick Jump to Cities:",
      layerControls: "Map Layers:",
      drinkingWater: "Drinking Water",
      toilets: "Public Toilets",
      madeBy: "Made by Jamie Sinclair",
      sourceLink: "Source on GitHub",
    },
    ja: {
      title: "日本飲用水マップ",
      description:
        "日本全国の飲用水源と公衆トイレを表示するインタラクティブマップ。ランニングルート、サイクリング、ハイキング、アウトドア活動の計画に最適。OpenStreetMapコントリビューターからのデータ。",
      disclaimer:
        "注意：データの信頼性は様々で、一部の水飲み場やトイレはアクセスできない場合があります。",
      localeLabel: "言語：",
      collapse: "最小化",
      expand: "詳細を表示",
      quickCities: "都市への素早いジャンプ：",
      layerControls: "マップレイヤー：",
      drinkingWater: "飲用水",
      toilets: "公衆トイレ",
      madeBy: "制作者：ジェイミー・シンクレア",
      sourceLink: "GitHubでソースコード",
    },
  };

  const currentContent = content[currentLocale];

  return (
    <div
      class={`absolute top-4 z-[1000] transition-all duration-300 ${
        isCollapsed
          ? "right-4"
          : "left-0 right-0 flex justify-center px-4 sm:right-4 sm:left-auto sm:justify-start sm:px-0"
      }`}
    >
      <div
        class={`bg-white rounded-lg shadow-lg ${
          isCollapsed ? "w-auto" : "w-full max-w-sm"
        }`}
      >
        {/* Always visible header */}
        <div class="flex items-center justify-between p-4 ${!isCollapsed ? 'border-b border-gray-200' : ''}">
          <h2
            class={`font-bold text-blue-900 ${
              isCollapsed ? "text-sm" : "text-base sm:text-lg"
            }`}
          >
            {currentContent.title} 🌏💦
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2"
            title={
              isCollapsed ? currentContent.expand : currentContent.collapse
            }
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={isCollapsed ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
              />
            </svg>
          </button>
        </div>

        {/* Collapsible content */}
        {!isCollapsed && (
          <div class="p-4 pt-0 space-y-3">
            {/* Description */}
            <p class="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {currentContent.description}
            </p>

            {/* Disclaimer */}
            <p class="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              {currentContent.disclaimer}
            </p>

            {/* Quick Cities */}
            <div class="border-t border-gray-200 pt-3">
              <div class="text-xs text-gray-600 mb-2">
                {currentContent.quickCities}
              </div>
              <div class="grid grid-cols-2 gap-1">
                {topCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCityClick(city)}
                    class="text-xs px-2 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors text-left cursor-pointer"
                  >
                    {currentLocale === "ja" ? city.ja : city.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Controls */}
            <div class="border-t border-gray-200 pt-3">
              <div class="text-xs text-gray-600 mb-2">
                {currentContent.layerControls}
              </div>
              <div class="space-y-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDrinkingWater}
                    onChange={(e) => onToggleDrinkingWater?.(e.currentTarget.checked)}
                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span class="text-xs text-gray-700">
                    💧 {currentContent.drinkingWater}
                  </span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showToilets}
                    onChange={(e) => onToggleToilets?.(e.currentTarget.checked)}
                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span class="text-xs text-gray-700">
                    🚻 {currentContent.toilets}
                  </span>
                </label>
              </div>
            </div>

            {/* Language Selector */}
            <div class="border-t border-gray-200 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600">
                  {currentContent.localeLabel}
                </span>
                <div class="flex space-x-1">
                  <button
                    onClick={() => handleLocaleChange("en")}
                    class={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                      currentLocale === "en"
                        ? "bg-blue-100 text-blue-800 font-medium"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => handleLocaleChange("ja")}
                    class={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                      currentLocale === "ja"
                        ? "bg-blue-100 text-blue-800 font-medium"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    日本
                  </button>
                </div>
              </div>
            </div>
            <footer class="text-xs text-gray-400 text-center p-2 border-t border-gray-200">
              {currentContent.madeBy} •{" "}
              <a
                href="https://github.com/jamsinclair/japan-water-map"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:text-blue-700"
              >
                {currentContent.sourceLink}
              </a>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
