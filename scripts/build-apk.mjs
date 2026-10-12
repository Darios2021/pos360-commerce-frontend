// Build dedicado para empaquetar la SPA dentro del APK Capacitor.
// Diferencias con el build web:
//  - VITE_SHOP_BASE=/   (sin prefijo /shop/, porque el WebView del APK
//    sirve la app desde la raíz, no desde un subpath)
//  - VITE_API_BASE_URL absoluto a la API de producción, porque dentro del
//    APK la SPA corre en https://localhost y un path relativo /api/v1
//    quedaría apuntando al WebView local (404) en vez del backend.
//  - VITE_ENABLE_PRERENDER=0  (prerender no aplica para APK)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const PROD_API = "https://sanjuantecnologia.com/api/v1";

process.env.VITE_SHOP_BASE = "/";
process.env.VITE_API_BASE_URL = PROD_API;
process.env.VITE_PUBLIC_API_BASE_URL = PROD_API;
process.env.VITE_ENABLE_PRERENDER = "0";

// La version de la APK (android/app/build.gradle) viaja con el registro del
// telefono para saber que version tiene cada uno.
try {
  const gradle = readFileSync(resolve(process.cwd(), "android/app/build.gradle"), "utf8");
  process.env.VITE_APP_VERSION = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1] || "";
  // versionCode: lo compara el aviso de actualizacion con /app/download/version.json
  process.env.VITE_APP_VERSION_CODE = (gradle.match(/versionCode\s+(\d+)/) || [])[1] || "";
} catch { /* sin android/ todavia */ }

// Avisos push: solo con el proyecto de Firebase presente. Sin el archivo, la
// app no llama a register() (sin Firebase eso cierra la app en Android).
const GOOGLE_SERVICES = resolve(process.cwd(), "android/app/google-services.json");
process.env.VITE_APK_PUSH = existsSync(GOOGLE_SERVICES) ? "1" : "0";
console.log(`🔔 [build-apk] avisos push: ${process.env.VITE_APK_PUSH === "1" ? "SI" : "NO (falta android/app/google-services.json)"}`);

console.log("📦 [build-apk] Compilando bundle para APK con base /");

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// Limpieza post-build: el APK distribuible vive en public/shop/app/download/
// y Vite lo copia a dist/. Si lo dejamos, `cap sync` lo embebe dentro del
// nuevo APK Capacitor (recursión que infla la APK 15+MB cada build).
const APK_IN_DIST = resolve(process.cwd(), "dist/shop/app/download");
if (existsSync(APK_IN_DIST)) {
  rmSync(APK_IN_DIST, { recursive: true, force: true });
  console.log("🧹 [build-apk] Removida dist/shop/app/download (no va dentro del APK)");
}

process.exit(0);
