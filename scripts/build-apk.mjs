// Build dedicado para empaquetar la SPA dentro del APK Capacitor.
// Diferencias con el build web:
//  - VITE_SHOP_BASE=/   (sin prefijo /shop/, porque el WebView del APK
//    sirve la app desde la raíz, no desde un subpath)
//  - VITE_API_BASE_URL absoluto a la API de producción, porque dentro del
//    APK la SPA corre en https://localhost y un path relativo /api/v1
//    quedaría apuntando al WebView local (404) en vez del backend.
//  - VITE_ENABLE_PRERENDER=0  (prerender no aplica para APK)
import { spawnSync } from "node:child_process";

const PROD_API = "https://sanjuantecnologia.com/api/v1";

process.env.VITE_SHOP_BASE = "/";
process.env.VITE_API_BASE_URL = PROD_API;
process.env.VITE_PUBLIC_API_BASE_URL = PROD_API;
process.env.VITE_ENABLE_PRERENDER = "0";

console.log("📦 [build-apk] Compilando bundle para APK con base /");

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 0);
