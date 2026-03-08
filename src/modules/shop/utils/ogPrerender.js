// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/utils/ogPrerender.js

import { nextTick } from "vue";

function upsertMetaByName(name, content) {
  if (typeof document === "undefined" || !name) return;

  let el = document.head.querySelector(`meta[name="${CSS.escape(name)}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }

  el.setAttribute("content", String(content ?? ""));
}

function upsertMetaByProperty(property, content) {
  if (typeof document === "undefined" || !property) return;

  let el = document.head.querySelector(`meta[property="${CSS.escape(property)}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }

  el.setAttribute("content", String(content ?? ""));
}

function upsertCanonical(href) {
  if (typeof document === "undefined") return;

  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }

  el.setAttribute("href", String(href ?? ""));
}

function setDocumentTitle(title) {
  if (typeof document === "undefined") return;
  document.title = String(title ?? "");
}

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
  const safeDesc = (
    description || "Electrónica, ecommerce, sistemas POS y soluciones tecnológicas."
  )
    .toString()
    .trim();

  // ⚠️ OG image debe ser ABSOLUTA y accesible públicamente
  const safeImage = (image || "").toString().trim();
  const safeUrl = (url || "").toString().trim();

  // title
  setDocumentTitle(safeTitle);

  // description
  upsertMetaByName("description", safeDesc);

  // Open Graph
  upsertMetaByProperty("og:site_name", siteName);
  upsertMetaByProperty("og:type", "website");
  upsertMetaByProperty("og:title", safeTitle);
  upsertMetaByProperty("og:description", safeDesc);

  if (safeImage) upsertMetaByProperty("og:image", safeImage);
  if (safeUrl) upsertMetaByProperty("og:url", safeUrl);

  // Twitter
  upsertMetaByName("twitter:card", safeImage ? "summary_large_image" : "summary");
  upsertMetaByName("twitter:title", safeTitle);
  upsertMetaByName("twitter:description", safeDesc);

  if (safeImage) upsertMetaByName("twitter:image", safeImage);

  // canonical
  if (safeUrl) upsertCanonical(safeUrl);

  // Esperar a que el head se aplique
  await nextTick();

  // Liberar prerender
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