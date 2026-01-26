// ✅ COPY-PASTE FINAL COMPLETO
// vite.config.js (BACKOFFICE /app) — EXTENDIDO PERO LIMPIO
// - Admin/backoffice se buildea para "/app/"
// - Sin prerender (eso es solo para shop público)
// - Dev friendly: podés levantar local y no romperte al entrar /app
//
// Recomendación de uso:
// - En producción (CapRover): VITE_APP_BASE=/app/  (o dejalo default)
// - En local: podés usar VITE_APP_BASE=/ para no “obligar” /app
//
// Ejemplo local:
//   VITE_APP_BASE=/ vite
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

  // Debe empezar con "/" y terminar con "/"
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

  // ✅ Base del admin:
  // - Prod: /app/
  // - Local (opcional): /  (si seteás VITE_APP_BASE=/)
  const BASE = normalizeBase(env("VITE_APP_BASE", "/app/"), "/app/");

  // Opcional: forzar modo “app” aunque estés en dev
  const FORCE_APP_BASE_IN_DEV = isTrue(env("VITE_FORCE_APP_BASE_IN_DEV", "0"));

  // En dev, si no forzás, podés usar "/" para no depender de /app
  const effectiveBase =
    isDev && !FORCE_APP_BASE_IN_DEV ? normalizeBase(env("VITE_APP_BASE", "/"), "/") : BASE;

  // Logs de build útiles (aparecen en consola al buildear)
  if (isBuild) {
    console.log("🧩 [vite-admin] mode:", mode);
    console.log("🧩 [vite-admin] base:", effectiveBase);
  }

  return {
    // ✅ CLAVE: assets y router base del admin
    base: effectiveBase,

    plugins: [vue()],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },

    // ✅ Dev server (solo afecta local)
    server: {
      host: true, // 0.0.0.0
      port: Number(env("VITE_PORT", "5173")) || 5173,
      strictPort: true,
      // Si querés abrir directo el admin en local:
      // open: "/app/",
    },

    // ✅ Preview (vite preview) — útil para probar build local
    preview: {
      host: true,
      port: Number(env("VITE_PREVIEW_PORT", "4173")) || 4173,
      strictPort: true,
    },

    // ✅ Build “sano” para backoffice
    build: {
      sourcemap: isTrue(env("VITE_SOURCEMAP", "0")),
      outDir: env("VITE_OUT_DIR", "dist"),
      assetsDir: env("VITE_ASSETS_DIR", "assets"),
      chunkSizeWarningLimit: Number(env("VITE_CHUNK_WARN", "1500")) || 1500,
      // Si tenés problemas con Terser / minify:
      // minify: "esbuild",
    },

    // ✅ Define flags (opcionales) para tu app si te sirven
    define: {
      __APP_KIND__: JSON.stringify("admin"),
      __APP_BASE__: JSON.stringify(effectiveBase),
    },
  };
});
