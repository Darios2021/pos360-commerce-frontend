// Genera public/shop/app/download/version.json, el manifiesto que la APK lee
// al abrir y al volver al frente para avisar que hay una versión nueva
// (src/app/native/AvisoActualizacion.vue). Se publica en
// https://sanjuantecnologia.com/app/download/version.json, al lado del APK.
//
// Uso (al publicar cada APK firmada):
//   npm run apk:version                 -> conserva el "minimo" del archivo actual
//   npm run apk:version -- --minimo 4   -> fija el versionCode mínimo aceptado
//
// Lee versionCode y versionName de android/app/build.gradle.
//
// ORDEN: el APK firmado de esa versión tiene que estar ya en
// public/shop/app/download/sanjuantecnologia.apk en el mismo commit. Si el
// manifiesto anuncia una versión que el APK publicado no tiene, los teléfonos
// bajan el APK viejo y el aviso no se va. Con "minimo" mayor al versionCode
// instalado la app queda bloqueada hasta actualizar: subirlo solo a propósito.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const RAIZ = process.cwd();
const GRADLE = resolve(RAIZ, "android/app/build.gradle");
const DESTINO = resolve(RAIZ, "public/shop/app/download/version.json");
const URL_APK = "https://sanjuantecnologia.com/app/download/sanjuantecnologia.apk";

const gradle = readFileSync(GRADLE, "utf8");
const versionCode = Number((gradle.match(/versionCode\s+(\d+)/) || [])[1]);
const versionName = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1];
if (!versionCode || !versionName) {
  console.error("No se encontró versionCode/versionName en android/app/build.gradle");
  process.exit(1);
}

let minimo = 0;
if (existsSync(DESTINO)) {
  try { minimo = Number(JSON.parse(readFileSync(DESTINO, "utf8")).minimo) || 0; } catch { /* archivo roto: 0 */ }
}
const i = process.argv.indexOf("--minimo");
if (i > -1) {
  minimo = Number(process.argv[i + 1]);
  if (!Number.isInteger(minimo) || minimo < 0) {
    console.error("--minimo necesita un versionCode entero");
    process.exit(1);
  }
}
if (minimo > versionCode) {
  console.error(`minimo (${minimo}) no puede ser mayor que versionCode (${versionCode})`);
  process.exit(1);
}

const manifiesto = {
  versionCode,
  versionName,
  // ?v= para que ningún caché entregue el APK anterior
  url: `${URL_APK}?v=${versionName}`,
  minimo,
};
writeFileSync(DESTINO, JSON.stringify(manifiesto, null, 2) + "\n");
console.log(`version.json: ${JSON.stringify(manifiesto)}`);
