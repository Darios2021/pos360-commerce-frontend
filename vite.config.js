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

export default defineConfig(async ({ command }) => {
  const plugins = [vue()];

  const ENABLE_PRERENDER =
    String(process.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(process.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  if (command === "build" && ENABLE_PRERENDER) {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();
    // ✅ prerender del shop (y si querés, agregá algunas rutas públicas más)
    const routes = fileRoutes && fileRoutes.length ? fileRoutes : ["/shop/"];

    plugins.push(
      prerender({
        routes,
        renderer: "@prerenderer/renderer-puppeteer",
        rendererOptions: { renderAfterDocumentEvent: "prerender-ready" },
      })
    );
  }

  return {
    // ✅ CLAVE: el SPA ahora funciona en /shop y /app
    base: "/",

    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },
  };
});
