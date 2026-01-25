// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js (FIX ASSETS 404 + /shop/)
// - Frontend se buildea para "/shop/"
// - Edge lo sirve en "/shop/"

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

// ✅ helpers para colgar todo de /shop
function toShopPath(p) {
  if (!p) return "/shop/";
  if (p === "/") return "/shop/";
  return p.startsWith("/shop/") ? p : `/shop${p}`;
}

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  // ✅ CLAVE: base real del deploy
  const normalizedBase = "/shop/";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ Rutas que vas a prerenderizar (colgadas de /shop)
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
        "/shop/cart",
        "/shop/checkout",
        "/shop/cart/",
        "/shop/checkout/",
      ]);

      const cleaned = base
        .map((r) => toShopPath(r)) // ✅ ahora son /shop/...
        .filter((r) => !excluded.has(r));

      return uniq(cleaned.length ? cleaned : ["/shop/"]);
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
