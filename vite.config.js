// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js (BACKOFFICE /app) — EXTENDIDO PERO LIMPIO + DEV PROXY (CORS FIX)
//
// Qué corrige:
// - En DEV, evita CORS proxyando /api/* hacia tu API real.
// - Tu frontend debe pegar a /api/v1/... (relative), NO a https://... directamente.
//
// Recomendación DEV:
// - VITE_API_BASE_URL=/api/v1
// - VITE_DEV_API_TARGET=https://pos360-commerce-api.cingulado.org   (o tu URL interna)
//
// Ejemplo local:
//   VITE_APP_BASE=/ VITE_API_BASE_URL=/api/v1 VITE_DEV_API_TARGET=https://pos360-commerce-api.cingulado.org vite
//
// Ejemplo prod:
//   VITE_APP_BASE=/app/ npm run build

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

  const BASE = normalizeBase(env("VITE_APP_BASE", "/app/"), "/app/");
  const FORCE_APP_BASE_IN_DEV = isTrue(env("VITE_FORCE_APP_BASE_IN_DEV", "0"));

  const effectiveBase =
    isDev && !FORCE_APP_BASE_IN_DEV ? normalizeBase(env("VITE_APP_BASE", "/"), "/") : BASE;

  // ✅ DEV proxy target (API real)
  // - En LAN suele andar mejor pegarle al host interno / directo si lo tenés.
  // - Si no, usá el dominio https público.
  const DEV_API_TARGET = env("VITE_DEV_API_TARGET", "https://pos360-commerce-api.cingulado.org");

  if (isBuild) {
    console.log("🧩 [vite-admin] mode:", mode);
    console.log("🧩 [vite-admin] base:", effectiveBase);
  } else {
    console.log("🧩 [vite-admin] dev proxy target:", DEV_API_TARGET);
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

      // ✅ CORS FIX: Proxy local -> API
      // Si tu app llama a /api/v1/auth/login, esto lo manda a DEV_API_TARGET/api/v1/auth/login
      proxy: {
        "/api": {
          target: DEV_API_TARGET,
          changeOrigin: true,
          secure: true, // si tu target es https con cert OK
          // Si tu target tiene self-signed, poné secure:false
          // secure: false,

          // 👇 WebSockets (si los usaras)
          ws: true,
        },

        // (Opcional) si querés servir assets del storage por la misma origin en dev:
        // "/storage": {
        //   target: "https://storage-files.cingulado.org",
        //   changeOrigin: true,
        //   secure: true,
        // },
      },

      // open: "/app/",
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
      __APP_KIND__: JSON.stringify("admin"),
      __APP_BASE__: JSON.stringify(effectiveBase),
    },
  };
});
