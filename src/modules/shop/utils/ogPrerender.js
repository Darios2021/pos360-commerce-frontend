// src/modules/shop/utils/ogPrerender.js
import { useHead } from "@vueuse/head";
import { nextTick } from "vue";

/**
 * Setea OG tags para preview (WhatsApp/IG/FB) y libera el prerender.
 * Importante: esto NO sirve para bots en runtime, sirve para el HTML generado en build (prerender).
 */
export async function setOgAndReady({
  title,
  description,
  image,
  url,
  siteName = "San Juan Tecnología",
}) {
  const safeTitle = (title || siteName).toString().trim();
  const safeDesc = (description || "Electrónica, ecommerce, sistemas POS y soluciones tecnológicas.").toString().trim();

  // ⚠️ OG image debe ser ABSOLUTA y accesible públicamente
  const safeImage = (image || "").toString().trim();

  const safeUrl = (url || "").toString().trim();

  useHead({
    title: safeTitle,
    meta: [
      { name: "description", content: safeDesc },

      // Open Graph
      { property: "og:site_name", content: siteName },
      { property: "og:type", content: "website" },
      { property: "og:title", content: safeTitle },
      { property: "og:description", content: safeDesc },
      ...(safeImage ? [{ property: "og:image", content: safeImage }] : []),
      ...(safeUrl ? [{ property: "og:url", content: safeUrl }] : []),

      // Twitter (muchas apps lo leen también)
      { name: "twitter:card", content: safeImage ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: safeTitle },
      { name: "twitter:description", content: safeDesc },
      ...(safeImage ? [{ name: "twitter:image", content: safeImage }] : []),
    ],
    link: safeUrl ? [{ rel: "canonical", href: safeUrl }] : [],
  });

  // Esperar a que el head se aplique
  await nextTick();

  // Liberar prerender (PuppeteerRenderer espera este evento)
  if (typeof document !== "undefined") {
    document.dispatchEvent(new Event("prerender-ready"));
  }
}

/**
 * Helper: arma URL absoluta del sitio manteniendo path + query.
 * (Para og:url correcto cuando hay branch_id)
 */
export function absoluteUrlFromLocation(pathWithQuery = "") {
  if (typeof window === "undefined") return pathWithQuery;
  const origin = window.location.origin;
  if (!pathWithQuery) return origin;
  return new URL(pathWithQuery, origin).toString();
}
