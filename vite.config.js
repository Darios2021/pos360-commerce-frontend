// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

function readRoutesFile() {
  // Podés generar este JSON desde un script tuyo.
  // Formato esperado: ["\/shop","\/shop\/product\/282", ...]
  const p = path.resolve(process.cwd(), "prerender.routes.json");
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

  // ✅ SOLO en build (en dev NO)
  if (command === "build") {
    const { default: prerender } = await import("@prerenderer/rollup-plugin");

    const fileRoutes = readRoutesFile();

    // ✅ fallback si todavía no generaste el json
    const routes =
      fileRoutes && fileRoutes.length
        ? fileRoutes
        : [
            "/shop",
            // poné al menos 1 producto para testear
            "/shop/product/282"
          ];

    plugins.push(
      prerender({
        routes,
        renderer: "@prerenderer/renderer-puppeteer",
        rendererOptions: {
          // 👇 esto tiene que matchear con el evento que disparás en tu app
          renderAfterDocumentEvent: "prerender-ready"
        }
      })
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        vue: "vue/dist/vue.esm-bundler.js"
      }
    }
  };
});
