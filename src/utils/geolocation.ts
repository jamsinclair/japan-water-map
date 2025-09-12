// Utility functions for geolocation

export interface GeolocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Check if coordinates are within Japan bounds
export function isInJapan(lat: number, lng: number): boolean {
  // Japan bounds (approximate): lat 24-46, lng 123-146
  return lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146;
}

// Get user's current location
export function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: -1,
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        resolve({
          lat,
          lng,
          accuracy,
        });
      },
      (error) => {
        let message = "Unknown error occurred";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }

        reject({
          code: error.code,
          message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // 5 minutes
      },
    );
  });
}

// Get localized error messages
export function getLocationErrorMessage(
  error: GeolocationError,
  locale: "en" | "ja",
): string {
  const messages = {
    en: {
      unsupported: "Location services not supported",
      denied:
        "Location access denied. Please allow location access and try again.",
      unavailable: "Location unavailable. Please check your GPS settings.",
      timeout: "Location request timed out. Please try again.",
      outOfJapan:
        "Location detected outside of Japan. This map shows drinking water sources in Japan only.",
      unknown: "Unable to get location. Please try again.",
    },
    ja: {
      unsupported: "位置情報サービスはサポートされていません",
      denied:
        "位置情報のアクセスが拒否されました。位置情報へのアクセスを許可して再試行してください。",
      unavailable: "位置情報が利用できません。GPS設定を確認してください。",
      timeout: "位置情報の取得がタイムアウトしました。再試行してください。",
      outOfJapan:
        "日本国外の位置が検出されました。このマップは日本の飲用水源のみを表示します。",
      unknown: "位置情報を取得できませんでした。再試行してください。",
    },
  };

  const localeMessages = messages[locale];

  switch (error.code) {
    case -1:
      return localeMessages.unsupported;
    case 1:
      return localeMessages.denied;
    case 2:
      return localeMessages.unavailable;
    case 3:
      return localeMessages.timeout;
    default:
      return localeMessages.unknown;
  }
}
