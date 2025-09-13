export const registerServiceWorker = async (): Promise<void> => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log(
                  "New service worker available, please refresh the page",
                );
              } else {
                console.log("Service worker installed");
              }
            }
          });
        }
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
};

export const clearDataCache = async (): Promise<boolean> => {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      navigator.serviceWorker.controller!.postMessage(
        { type: "CLEAR_DATA_CACHE" },
        [messageChannel.port2],
      );
    });
  }
  return false;
};
