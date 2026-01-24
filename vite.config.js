// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

function env(name, fallback = "") {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).trim() !== ""
    ? String(v).trim()
    : fallback;
}

function readRoutesFile() {
  const p = path.resolve(process.cwd(), "scripts", "prerender.routes.json");
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function normalizeRoute(r) {
  if (typeof r !== "string") return null;
  let s = r.trim();
  if (!s) return null;
  if (!s.startsWith("/")) s = `/${s}`;

  // ✅ normaliza: NO trailing slash excepto root "/shop/"
  if (s !== "/shop/" && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  // ✅ Fuente de verdad: base del sitio
  // En CapRover setear: VITE_APP_BASE=/shop/
  const APP_BASE = env("VITE_APP_BASE", "/shop/");
  const base = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ SOLO /shop + SIN duplicados por slash
    const routes = (() => {
      const baseRoutes =
        fileRoutes && fileRoutes.length
          ? fileRoutes.map(normalizeRoute).filter(Boolean)
          : ["/shop/"];

      const onlyShop = baseRoutes
        .filter((r) => r.startsWith("/shop"))
        .map((r) => (r === "/shop" ? "/shop/" : r));

      // ✅ excluye checkout/cart (si existen)
      const excluded = new Set(["/shop/cart", "/shop/checkout"]);
      const cleaned = onlyShop.filter((r) => !excluded.has(r));

      return uniq(cleaned.length ? cleaned : ["/shop/"]);
    })();

    // ✅ timeout en MILISEGUNDOS (default 240s)
    const timeoutMsRaw = Number(process.env.VITE_PRERENDER_TIMEOUT_MS || 240000);
    const timeoutMs =
      Number.isFinite(timeoutMsRaw) && timeoutMsRaw >= 10000 ? timeoutMsRaw : 240000;

    plugins.push(
      prerender({
        routes,
        renderer: "@prerenderer/renderer-puppeteer",
        rendererOptions: {
          renderAfterDocumentEvent: "prerender-ready",
          timeout: timeoutMs,
        },
      })
    );
  }

  return {
    // ✅ CLAVE para que NO pida /shop/shop/assets ni /assets
    base,

    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },

    // ✅ no tocar assetsDir/outDir
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
  };
});
