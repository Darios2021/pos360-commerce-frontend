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

function toMsTimeout(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 180000; // 3min

  // si es chico, asumimos segundos (ej: 120)
  if (n > 0 && n < 10000) return n * 1000;
  return n; // ya ms
}

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  // ✅ base del shop (default /shop/)
  const APP_BASE = env("VITE_APP_BASE", "/shop/");
  const normalizedBase = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;

  // ✅ IMPORTANTÍSIMO:
  // con base "/shop/" el prerenderer pide "/shop/assets/...".
  // Si los assets están en dist/assets => 404 en el server interno del prerenderer.
  // Entonces los emitimos en dist/shop/assets para que exista físicamente.
  const baseFolder = normalizedBase.replace(/^\/|\/$/g, ""); // "/shop/" -> "shop"
  const assetsDir = baseFolder ? `${baseFolder}/assets` : "assets";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    const routes = (() => {
      const base =
        fileRoutes && fileRoutes.length
          ? fileRoutes.map(normalizeRoute).filter(Boolean)
          : ["/shop/"];

      const onlyShop = base.filter((r) => r.startsWith("/shop"));

      // excluye pantallas internas
      const excluded = new Set(["/shop/cart", "/shop/checkout"]);

      const cleaned = onlyShop.filter((r) => {
        // normaliza para comparar
        const noSlash = r.endsWith("/") && r.length > 1 ? r.slice(0, -1) : r;
        return !excluded.has(noSlash);
      });

      return uniq(cleaned.length ? cleaned : ["/shop/"]);
    })();

    const timeoutMs = toMsTimeout(process.env.VITE_PRERENDER_TIMEOUT || "180");

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
    base: normalizedBase,

    // ✅ FIX para que el prerenderer encuentre /shop/assets/*
    build: {
      assetsDir,
    },

    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },
  };
});
