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
  const s = r.trim();
  if (!s) return null;
  return s.startsWith("/") ? s : `/${s}`;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  // ✅ SHOP vive bajo /shop/
  // Si querés parametrizar: VITE_APP_BASE=/shop/
  // (con barra inicial y final)
  const APP_BASE_RAW = env("VITE_APP_BASE", "/shop/");
  const APP_BASE = APP_BASE_RAW.startsWith("/") ? APP_BASE_RAW : `/${APP_BASE_RAW}`;
  const normalizedBase = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ SOLO /shop* y excluye páginas problemáticas (checkout/cart)
    const routes = (() => {
      const base =
        fileRoutes && fileRoutes.length
          ? fileRoutes.map(normalizeRoute).filter(Boolean)
          : ["/shop/"];

      const onlyShop = base.filter((r) => r.startsWith("/shop"));

      // si usás estas rutas en router, evitá prerender
      const excluded = new Set(["/shop/cart", "/shop/checkout"]);

      const cleaned = onlyShop.filter((r) => {
        const noSlash = r.endsWith("/") && r.length > 1 ? r.slice(0, -1) : r;
        return !excluded.has(noSlash);
      });

      return uniq(cleaned.length ? cleaned : ["/shop/"]);
    })();

    // ✅ timeout REAL en ms (default: 120s)
    const timeoutMsRaw = Number(process.env.VITE_PRERENDER_TIMEOUT || 120000);
    const timeoutMs =
      Number.isFinite(timeoutMsRaw) && timeoutMsRaw >= 10000
        ? timeoutMsRaw
        : 120000;

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
    // ✅ CLAVE para que index.html genere /shop/assets/... (NO relativo)
    base: normalizedBase,

    plugins,

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },

    build: {
      // ✅ ULTRA CLAVE: dejá assets SIEMPRE en "assets"
      // Si esto queda como "shop/assets" terminás con /shop/shop/assets (404)
      assetsDir: "assets",

      // opcional (default): outDir: "dist",
      // opcional (default): emptyOutDir: true,
    },
  };
});
