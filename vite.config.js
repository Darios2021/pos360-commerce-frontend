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
  // Acepta:
  // - "120" => lo tratamos como segundos (lo que vos estás seteando)
  // - "120000" => ms
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 180000; // default 3 min

  // si es chico, asumimos segundos
  if (n > 0 && n < 10000) return n * 1000;

  return n; // ya es ms
}

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ SOLO SHOP público
    const routes = (() => {
      const base =
        fileRoutes && fileRoutes.length
          ? fileRoutes.map(normalizeRoute).filter(Boolean)
          : ["/shop/"];

      const onlyShop = base.filter((r) => r.startsWith("/shop"));

      // Excluye pantallas que no querés prerender
      const excluded = new Set(["/shop/cart", "/shop/checkout"]);

      const cleaned = onlyShop.filter((r) => {
        const noSlash = r.endsWith("/") && r.length > 1 ? r.slice(0, -1) : r;
        return !excluded.has(noSlash);
      });

      return uniq(cleaned.length ? cleaned : ["/shop/"]);
    })();

    // ✅ Timeout robusto (toma segundos si mandás 120)
    const timeoutMs = toMsTimeout(process.env.VITE_PRERENDER_TIMEOUT || "180");

    plugins.push(
      prerender({
        routes,
        renderer: "@prerenderer/renderer-puppeteer",
        rendererOptions: {
          // tu evento (pero ahora main.js lo garantiza sí o sí)
          renderAfterDocumentEvent: "prerender-ready",
          timeout: timeoutMs,
        },
      })
    );
  }

  // ✅ base del shop
  const APP_BASE = env("VITE_APP_BASE", "/shop/");
  const normalizedBase = APP_BASE.endsWith("/") ? APP_BASE : `${APP_BASE}/`;

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
