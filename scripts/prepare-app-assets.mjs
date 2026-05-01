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
const OUT_ICON_FG = resolve(ROOT, "assets/icon-foreground.png");
const OUT_ICON_BG = resolve(ROOT, "assets/icon-background.png");
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
// Azul corporativo del logo: cuando Android aplica máscaras circulares al
// adaptive icon, lo de "afuera" del círculo del logo será este color, no blanco.
const BRAND_BLUE = { r: 20, g: 136, b: 209, alpha: 1 };
const ICON_SIZE = 1024;
const SPLASH_SIZE = 2732;
const SPLASH_LOGO_SIZE = 1400; // logo dentro del splash, más grande

console.log("🎨 [prepare-app-assets] Procesando logo fuente...");

// 1) Iconos: estrategia "adaptive icon" de Android moderno
//    + fallback legacy con fondo azul (no blanco).
//
//    a) icon-foreground.png  → solo el logo, transparente alrededor.
//                              Android lo dibuja sobre el background.
//                              Safe zone del adaptive icon es 66% central,
//                              así que escalamos a 680/1024.
//    b) icon-background.png  → color sólido azul del logo. Lo que se vea
//                              fuera del círculo del logo será este azul
//                              cuando el launcher aplique máscaras.
//    c) icon.png (legacy)    → mismo logo grande sobre fondo azul, sin
//                              recuadro blanco. Para launchers viejos que
//                              no usan adaptive icons.
const iconLogoLarge = await sharp(SRC)
  .trim()
  .resize({
    width: 980,
    height: 980,
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  })
  .png()
  .toBuffer();

const iconLogoSafeZone = await sharp(SRC)
  .trim()
  .resize({
    width: 680,
    height: 680,
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  })
  .png()
  .toBuffer();

// Foreground: logo transparente (Android compone con el background)
await sharp({
  create: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: iconLogoSafeZone, gravity: "center" }])
  .png()
  .toFile(OUT_ICON_FG);

console.log("  ✓ icon-foreground.png (1024x1024, transparente)");

// Background: azul sólido
await sharp({
  create: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    channels: 4,
    background: BRAND_BLUE,
  },
})
  .png()
  .toFile(OUT_ICON_BG);

console.log("  ✓ icon-background.png (1024x1024, azul)");

// Legacy icon: logo grande sobre azul (no blanco)
await sharp({
  create: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    channels: 4,
    background: BRAND_BLUE,
  },
})
  .composite([{ input: iconLogoLarge, gravity: "center" }])
  .png()
  .toFile(OUT_ICON);

console.log("  ✓ icon.png (1024x1024, logo sobre azul)");

// 2) Splash light: 2732x2732 fondo blanco + logo grande centrado (también trim)
const splashLogo = await sharp(SRC)
  .trim()
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
