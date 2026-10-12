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

const CLASE = "barcode-scanner-active";
function claseCamara(on) {
  document.documentElement.classList.toggle(CLASE, on);
  document.body.classList.toggle(CLASE, on);
}

/**
 * Lectura continua con la camara dibujada DETRAS del WebView (cargador:
 * lector central y lector por lote). Usa startScan() + el evento
 * barcodesScanned del plugin. startScan() usa ML Kit empaquetado en la APK
 * (com.google.mlkit:barcode-scanning): NO necesita el modulo de Google de
 * scan(), pero SI el permiso CAMERA en tiempo de ejecucion.
 * Mientras lee, la clase barcode-scanner-active deja transparente la pagina y
 * esconde todo menos el marco y los controles (movil.css).
 * Devuelve { cortar } si arranco, o { motivo: "sin-permiso" | "no-soportado" | "error" }.
 */
export async function lecturaContinua(onCodigo) {
  const { plugin: p } = await plugin();
  if (!p) return { motivo: "no-soportado" };
  try {
    const { supported } = await p.isSupported();
    if (!supported) return { motivo: "no-soportado" };
    let { camera } = await p.checkPermissions();
    if (camera !== "granted" && camera !== "limited") ({ camera } = await p.requestPermissions());
    if (camera !== "granted" && camera !== "limited") return { motivo: "sin-permiso" };
  } catch {
    return { motivo: "error" };
  }
  try {
    claseCamara(true);
    await p.removeAllListeners().catch(() => {});
    await p.addListener("barcodesScanned", (ev) => {
      for (const b of ev?.barcodes || []) {
        const raw = String(b?.rawValue || "").trim();
        if (raw) onCodigo(raw);
      }
    });
    await p.startScan();
    let cortado = false;
    return {
      cortar: async () => {
        if (cortado) return;
        cortado = true;
        claseCamara(false);
        try { await p.removeAllListeners(); } catch { /* ya cortado */ }
        try { await p.stopScan(); } catch { /* ya cortado */ }
      },
    };
  } catch {
    claseCamara(false);
    try { await p.removeAllListeners(); } catch { /* nada */ }
    try { await p.stopScan(); } catch { /* nada */ }
    return { motivo: "error" };
  }
}

/** Abre los ajustes de la app (para dar el permiso de camara negado). */
export async function abrirAjustes() {
  const { plugin: p } = await plugin();
  if (!p) return;
  try { await p.openSettings(); } catch { /* sin ajustes */ }
}

/** Linterna del lector nativo (startScan). */
export async function linternaNativa(encender) {
  const { plugin: p } = await plugin();
  if (!p) return false;
  try {
    const { available } = await p.isTorchAvailable();
    if (!available) return false;
    if (encender) await p.enableTorch();
    else await p.disableTorch();
    return true;
  } catch {
    return false;
  }
}

export async function hayLinternaNativa() {
  const { plugin: p } = await plugin();
  if (!p) return false;
  try { return !!(await p.isTorchAvailable()).available; } catch { return false; }
}
