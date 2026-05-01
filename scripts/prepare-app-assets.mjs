// Convierte el logo fuente (webp) en los assets que Capacitor necesita:
//   - assets/icon.png         1024x1024  (icono cuadrado, padding suave)
//   - assets/splash.png       2732x2732  (splash centrado, fondo blanco)
//   - assets/splash-dark.png  2732x2732  (splash centrado, fondo oscuro)
//
// Capacitor luego genera todos los tamaños Android desde estos archivos
// con `npx @capacitor/assets generate --android`.
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const SRC = resolve(ROOT, "assets/source-logo.webp");
const OUT_ICON = resolve(ROOT, "assets/icon.png");
const OUT_SPLASH = resolve(ROOT, "assets/splash.png");
const OUT_SPLASH_DARK = resolve(ROOT, "assets/splash-dark.png");

if (!existsSync(SRC)) {
  console.error(`[prepare-app-assets] Falta source: ${SRC}`);
  process.exit(1);
}

mkdirSync(dirname(OUT_ICON), { recursive: true });

// Color corporativo San Juan Tecnología
const BG_LIGHT = { r: 255, g: 255, b: 255, alpha: 1 };
const BG_DARK = { r: 13, g: 15, b: 19, alpha: 1 }; // matchea el dark mode del shop
const ICON_SIZE = 1024;
const SPLASH_SIZE = 2732;
const SPLASH_LOGO_SIZE = 900; // logo dentro del splash

console.log("🎨 [prepare-app-assets] Procesando logo fuente...");

// 1) Icono: cuadrado 1024x1024 con padding suave para que no toque los bordes
//    (Android le va a aplicar máscara circular o squircle según el launcher).
const iconLogo = await sharp(SRC)
  .resize({
    width: 820,
    height: 820,
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    channels: 4,
    background: BG_LIGHT,
  },
})
  .composite([{ input: iconLogo, gravity: "center" }])
  .png()
  .toFile(OUT_ICON);

console.log("  ✓ icon.png (1024x1024)");

// 2) Splash light: 2732x2732 fondo blanco + logo grande centrado
const splashLogo = await sharp(SRC)
  .resize({
    width: SPLASH_LOGO_SIZE,
    height: SPLASH_LOGO_SIZE,
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: SPLASH_SIZE,
    height: SPLASH_SIZE,
    channels: 4,
    background: BG_LIGHT,
  },
})
  .composite([{ input: splashLogo, gravity: "center" }])
  .png()
  .toFile(OUT_SPLASH);

console.log("  ✓ splash.png (2732x2732, light)");

// 3) Splash dark: igual pero fondo oscuro
await sharp({
  create: {
    width: SPLASH_SIZE,
    height: SPLASH_SIZE,
    channels: 4,
    background: BG_DARK,
  },
})
  .composite([{ input: splashLogo, gravity: "center" }])
  .png()
  .toFile(OUT_SPLASH_DARK);

console.log("  ✓ splash-dark.png (2732x2732, dark)");
console.log("✅ Listos. Ahora corré: npx @capacitor/assets generate --android");
