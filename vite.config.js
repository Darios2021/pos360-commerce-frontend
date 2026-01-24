// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

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

function env(name, fallback = "") {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).trim() !== ""
    ? String(v).trim()
    : fallback;
}

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "")
      .trim()
      .toLowerCase() === "true";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ SOLO SHOP (público) + ✅ EXCLUYE /shop/cart y /shop/checkout
    const routes = (() => {
      const base =
        fileRoutes && fileRoutes.length
          ? fileRoutes.map(normalizeRoute).filter(Boolean)
          : ["/shop/"];

      const onlyShop = base.filter((r) => r.startsWith("/shop"));

      const excluded = new Set(["/shop/cart", "/shop/checkout"]);

      const cleaned = onlyShop.filter((r) => {
        const noSlash = r.endsWith("/") && r.length > 1 ? r.slice(0, -1) : r;
        return !excluded.has(noSlash);
      });

      return uniq(cleaned.length ? cleaned : ["/shop/"]);
    })();

    // ✅ timeout REAL (ms). Default 120s.
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

  // ✅ CLAVE: el shop vive bajo /shop/
  // Si querés cambiarlo por ENV, setea VITE_APP_BASE=/shop/
  // (default: /shop/)
  const APP_BASE = env("VITE_APP_BASE", "/shop/");
  const normalizedBase = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;

  return {
    // ✅ FIX MIME / assets: ahora index.html apuntará a /shop/assets/...
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
