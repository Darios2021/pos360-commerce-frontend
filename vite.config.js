// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js (FIX LOOP 301)
// - Frontend se buildea para "/" internamente
// - Edge lo monta en "/shop" externamente

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

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "")
      .trim()
      .toLowerCase() === "true";

  // ✅ FIX: el frontend se construye para root ("/")
  const normalizedBase = "/";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ Rutas internas del frontend (root)
    // - sin /shop
    // - excluye checkout/cart
    const routes = (() => {
      const base =
        fileRoutes && fileRoutes.length
          ? fileRoutes.map(normalizeRoute).filter(Boolean)
          : ["/"];

      const excluded = new Set([
        "/cart",
        "/checkout",
        "/cart/",
        "/checkout/",
      ]);

      const cleaned = base.filter((r) => !excluded.has(r));
      return uniq(cleaned.length ? cleaned : ["/"]);
    })();

    const raw = env("VITE_PRERENDER_TIMEOUT", "120");
    const n = Number(raw);
    const timeoutMs =
      Number.isFinite(n) && n > 0
        ? n < 1000
          ? Math.max(10_000, Math.floor(n * 1000))
          : Math.max(10_000, Math.floor(n))
        : 120_000;

    const renderAfterMsRaw = Number(env("VITE_PRERENDER_AFTER", "1500"));
    const renderAfterMs =
      Number.isFinite(renderAfterMsRaw) && renderAfterMsRaw >= 0
        ? renderAfterMsRaw
        : 1500;

    plugins.push(
      prerender({
        routes,
        renderer: "@prerenderer/renderer-puppeteer",
        rendererOptions: {
          renderAfterTime: renderAfterMs,
          timeout: timeoutMs,
        },
      })
    );
  }

  return {
    base: normalizedBase,
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },
  };
});
