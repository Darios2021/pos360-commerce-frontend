// Helpers de runtime: detectan si la SPA está corriendo embebida en el APK
// (Capacitor) o en un browser, y si el browser es mobile Android. Centralizado
// para que el resto del código no duplique sniffing de UA.

export const APK_DOWNLOAD_URL =
  "https://sanjuantecnologia.com/app/download/sanjuantecnologia.apk";

// Capacitor inyecta `window.Capacitor` en el WebView nativo. También seteamos
// el query string ?native=1 al levantar la app por si alguna vez el wrapper
// usa otra técnica.
export function isCapacitor() {
  if (typeof window === "undefined") return false;
  const w = window;
  if (w.Capacitor && typeof w.Capacitor.isNativePlatform === "function") {
    try {
      return w.Capacitor.isNativePlatform();
    } catch (_) {
      return true;
    }
  }
  if (w.Capacitor) return true;
  try {
    const p = new URLSearchParams(w.location?.search || "");
    if (p.get("native") === "1") return true;
  } catch (_) {}
  return false;
}

export function isAndroidUA() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

// "Mobile real" = Android phone/tablet. iOS no aplica porque no hay APK.
export function isMobileBrowser() {
  if (isCapacitor()) return false;
  return isAndroidUA();
}

export function getApkDownloadUrl() {
  return APK_DOWNLOAD_URL;
}
