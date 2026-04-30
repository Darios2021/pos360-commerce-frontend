// src/app/utils/googleMapsLoader.js
//
// Cargador único del Google Maps JS SDK usando la API funcional nueva
// (@googlemaps/js-api-loader v2+).
//
// Uso:
//   import { loadGoogleMaps } from "@/app/utils/googleMapsLoader";
//   const google = await loadGoogleMaps(["maps", "marker", "geocoding"]);
//   const map = new google.maps.Map(el, { ... });
//
// La API key se toma de VITE_GOOGLE_MAPS_API_KEY (.env). Si falta, el loader
// arroja error con mensaje claro para el dev.

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const API_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

let optionsApplied = false;
const loadedLibraries = new Set();
const libraryPromises = new Map();

function applyOptionsOnce() {
  if (!API_KEY) {
    throw new Error(
      "[googleMapsLoader] VITE_GOOGLE_MAPS_API_KEY no está configurada en el .env"
    );
  }
  if (optionsApplied) return;
  setOptions({
    key: API_KEY,
    v: "weekly",
    language: "es",
    region: "AR",
  });
  optionsApplied = true;
}

/**
 * Carga las librerías solicitadas y devuelve el objeto google global ya listo.
 * Es seguro llamar desde múltiples componentes en paralelo: el SDK se carga
 * una única vez y las librerías se cachean.
 *
 * @param {string[]} libraries — ej. ["maps", "marker"], ["geocoding"]
 * @returns {Promise<typeof google>} el objeto global google
 */
export async function loadGoogleMaps(libraries = ["maps", "marker"]) {
  applyOptionsOnce();

  // Asegurar que "maps" siempre esté incluida (es la lib core)
  const libs = Array.from(new Set(["maps", ...libraries]));

  for (const lib of libs) {
    if (loadedLibraries.has(lib)) continue;

    if (!libraryPromises.has(lib)) {
      libraryPromises.set(lib, importLibrary(lib));
    }
    await libraryPromises.get(lib);
    loadedLibraries.add(lib);
  }

  return window.google;
}

/**
 * Indica si la API key está configurada.
 */
export function hasGoogleMapsKey() {
  return !!API_KEY;
}
