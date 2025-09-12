import { DrinkingWaterPoint } from "./dataLoader";

// Get current locale from document or navigator
function getCurrentLocale(): string {
  return document.documentElement.lang || navigator.language || "en-US";
}

// Get localized name with fallback logic
export function getLocalizedName(point: DrinkingWaterPoint): string {
  const locale = getCurrentLocale();
  const isJapanese = locale.startsWith("ja");

  // Priority: locale-specific -> general name -> default
  if (isJapanese && point.properties["name:ja"]) {
    return point.properties["name:ja"];
  }

  if (point.properties["name:en"]) {
    return point.properties["name:en"];
  }

  if (point.properties.name) {
    return point.properties.name;
  }

  // Default names based on locale
  return isJapanese ? "飲用水" : "Drinking Water";
}

// Get localized labels for properties
export function getLocalizedLabels() {
  const locale = getCurrentLocale();
  const isJapanese = locale.startsWith("ja");

  return {
    name: isJapanese ? "名前" : "Name",
    operator: isJapanese ? "運営者" : "Operator",
    wheelchair: isJapanese ? "車椅子対応" : "Wheelchair Access",
    fee: isJapanese ? "料金" : "Fee",
    bottle: isJapanese ? "ボトル給水" : "Bottle Refill",
    fountain: isJapanese ? "噴水タイプ" : "Fountain Type",
    access: isJapanese ? "アクセス" : "Access",
    indoor: isJapanese ? "屋内" : "Indoor",
    covered: isJapanese ? "屋根" : "Covered",
    cold_water: isJapanese ? "冷水" : "Cold Water",
    hot_water: isJapanese ? "温水" : "Hot Water",
    check_date: isJapanese ? "確認日" : "Last Checked",
    description: isJapanese ? "説明" : "Description",
    location: isJapanese ? "位置" : "Location",
    openInMaps: isJapanese ? "マップで開く" : "Open in Maps",
    // Value translations
    yes: isJapanese ? "はい" : "Yes",
    no: isJapanese ? "いいえ" : "No",
    limited: isJapanese ? "一部対応" : "Limited",
    bubbler: isJapanese ? "バブラー" : "Bubbler",
  };
}

// Format property values
export function formatPropertyValue(key: string, value: string): string {
  const labels = getLocalizedLabels();

  // Handle common yes/no values
  if (value === "yes") return labels.yes;
  if (value === "no") return labels.no;
  if (value === "limited") return labels.limited;
  if (value === "bubbler") return labels.bubbler;

  // Handle dates
  if (key === "check_date") {
    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch {
      return value;
    }
  }

  return value;
}
