// src/app/native/escaner.js
//
// ESCANER NATIVO DE CODIGOS (solo en la APK).
//
// En el navegador el lector usa la camara por getUserMedia + BarcodeDetector
// (components/BarcodeScannerDialog.vue). Dentro de la APK eso depende de la
// version del WebView del telefono y en varios equipos no arranca. Aca se usa
// el escaner de Google (ML Kit, @capacitor-mlkit/barcode-scanning): abre su
// propia pantalla, lee EAN-13, EAN-8, Code 128, QR y el resto, y no pide el
// permiso de camara porque la camara la maneja Google Play Services.
//
// El escaner viene como modulo de Play Services que se baja la primera vez.
// Si el telefono no lo tiene ni puede bajarlo, `disponible()` da false y el
// dialogo sigue con la camara web de siempre.

import { isCapacitor } from "@/app/utils/runtime";

let _plugin = null;
// OJO: el plugin de Capacitor es un Proxy que responde a cualquier propiedad,
// tambien a `then`. Si una funcion async lo devuelve tal cual, el await lo toma
// por una promesa, llama a plugin.then() (que no existe) y queda colgado para
// siempre. Por eso se devuelve envuelto: { plugin }.
async function plugin() {
  if (!isCapacitor()) return { plugin: null };
  if (_plugin) return { plugin: _plugin };
  try {
    const mod = await import("@capacitor-mlkit/barcode-scanning");
    _plugin = mod.BarcodeScanner;
  } catch {
    _plugin = null;
  }
  return { plugin: _plugin };
}

/** True si se puede usar el escaner de Google en este telefono. */
export async function disponible() {
  const { plugin: p } = await plugin();
  if (!p) return false;
  try {
    const { supported } = await p.isSupported();
    if (!supported) return false;
    const { available } = await p.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      // Se pide la descarga y por esta vez se usa la camara web: el modulo
      // tarda unos segundos y queda instalado para la proxima.
      p.installGoogleBarcodeScannerModule().catch(() => {});
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre el escaner. Devuelve el codigo leido, o null si el usuario volvio
 * atras sin leer nada.
 */
export async function escanear() {
  const { plugin: p } = await plugin();
  if (!p) return null;
  try {
    const { barcodes } = await p.scan({ autoZoom: true });
    const raw = String(barcodes?.[0]?.rawValue || "").trim();
    return raw || null;
  } catch (e) {
    // "scan canceled" es volver atras: no es un error para el cajero.
    if (/cancel/i.test(String(e?.message || ""))) return null;
    throw e;
  }
}

/**
 * Lectura continua con la camara dibujada detras de la vista (cargador:
 * lector central y lector por lote). Usa startScan() + el evento
 * barcodesScanned del mismo plugin; la pantalla de la app queda encima, con
 * el fondo transparente (clase barcode-scanner-active, ver movil.css).
 * Devuelve una funcion para cortar, o null si el telefono no puede.
 */
export async function lecturaContinua(onCodigo) {
  const { plugin: p } = await plugin();
  if (!p) return null;
  try {
    const { supported } = await p.isSupported();
    if (!supported) return null;
    let { camera } = await p.checkPermissions();
    if (camera !== "granted" && camera !== "limited") ({ camera } = await p.requestPermissions());
    if (camera !== "granted" && camera !== "limited") return null;
    document.documentElement.classList.add("barcode-scanner-active");
    document.body.classList.add("barcode-scanner-active");
    await p.addListener("barcodesScanned", (ev) => {
      for (const b of ev?.barcodes || []) {
        const raw = String(b?.rawValue || "").trim();
        if (raw) onCodigo(raw);
      }
    });
    await p.startScan();
    return async () => {
      document.documentElement.classList.remove("barcode-scanner-active");
      document.body.classList.remove("barcode-scanner-active");
      try { await p.removeAllListeners(); } catch { /* ya cortado */ }
      try { await p.stopScan(); } catch { /* ya cortado */ }
    };
  } catch {
    document.documentElement.classList.remove("barcode-scanner-active");
    document.body.classList.remove("barcode-scanner-active");
    return null;
  }
}
