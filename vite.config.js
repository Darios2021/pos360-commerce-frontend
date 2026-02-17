// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js (SHOP /shop) — EXTENDIDO PERO LIMPIO + DEV PROXY (CORS FIX)
//
// Qué corrige:
// - En DEV, evita CORS y evita perder sesión (cookies) usando proxy same-origin:
//   El browser ve /api/... como mismo host (localhost), y Vite lo manda a tu API real.
//
// Recomendación DEV (SHOP):
// - VITE_SHOP_BASE=/shop/
// - VITE_API_BASE_URL=/api/v1
// - VITE_DEV_API_TARGET=https://pos360-commerce-api.cingulado.org
//
// Recomendación PROD (SHOP):
// - VITE_SHOP_BASE=/shop/   (o "/" si deployás shop en root)
// - VITE_API_BASE_URL=/api/v1  (ideal si tu edge/proxy sirve /api)
//   o tu URL absoluta si no tenés proxy en prod

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

function env(name, fallback = "") {
  const v = process.env[name];
  return v !== undefined && v !== null && String(v).trim() !== ""
    ? String(v).trim()
    : fallback;
}

function normalizeBase(input, fallback) {
  const raw = String(input ?? "").trim();
  const b = raw || fallback;

  let out = b.startsWith("/") ? b : `/${b}`;
  if (!out.endsWith("/")) out += "/";
  return out;
}

function isTrue(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .match(/^(1|true|yes|y|on)$/);
}

export default defineConfig(({ command, mode }) => {
  const isBuild = command === "build";
  const isDev = command === "serve";

  // ✅ base del shop en build
  const BASE = normalizeBase(env("VITE_SHOP_BASE", "/shop/"), "/shop/");
  const FORCE_SHOP_BASE_IN_DEV = isTrue(env("VITE_FORCE_SHOP_BASE_IN_DEV", "0"));

  // ✅ en DEV casi siempre conviene base "/" para que HMR no se vuelva loco,
  // salvo que explícitamente quieras servir con /shop/ también en DEV.
  const effectiveBase =
    isDev && !FORCE_SHOP_BASE_IN_DEV ? normalizeBase(env("VITE_SHOP_BASE", "/"), "/") : BASE;

  // ✅ DEV proxy target (API real)
  const DEV_API_TARGET = env("VITE_DEV_API_TARGET", "https://pos360-commerce-api.cingulado.org");

  if (isBuild) {
    console.log("🧩 [vite-shop] mode:", mode);
    console.log("🧩 [vite-shop] base:", effectiveBase);
  } else {
    console.log("🧩 [vite-shop] dev proxy target:", DEV_API_TARGET);
  }

  return {
    base: effectiveBase,
    plugins: [vue()],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },

    server: {
      host: true,
      port: Number(env("VITE_PORT", "5173")) || 5173,
      strictPort: true,

      // ✅ CLAVE: proxy /api -> API real (same-origin en el browser)
      proxy: {
        "/api": {
          target: DEV_API_TARGET,
          changeOrigin: true,
          secure: true, // si tu target usa cert válido
          ws: true,
        },
      },
    },

    preview: {
      host: true,
      port: Number(env("VITE_PREVIEW_PORT", "4173")) || 4173,
      strictPort: true,
    },

    build: {
      sourcemap: isTrue(env("VITE_SOURCEMAP", "0")),
      outDir: env("VITE_OUT_DIR", "dist"),
      assetsDir: env("VITE_ASSETS_DIR", "assets"),
      chunkSizeWarningLimit: Number(env("VITE_CHUNK_WARN", "1500")) || 1500,
    },

    define: {
      __APP_KIND__: JSON.stringify("shop"),
      __SHOP_BASE__: JSON.stringify(effectiveBase),
    },
  };
});
