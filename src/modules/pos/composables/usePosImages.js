// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosImages.js
//
// FIX:
// - Evita spam infinito cuando /products/:id/images devuelve 403/404 (cachea vacío)
// - Prefetch limitado y seguro
// - Mantiene normalización de URLs

import { ref } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

export function usePosImages() {
  const products = useProductsStore();

  const imageById = ref({}); // id -> url ("" cacheado = no hay/forbidden)
  const imgLoading = ref({}); // id -> true

  function pickUrlFromImageRow(row) {
    if (!row) return "";
    return (
      row.url ||
      row.public_url ||
      row.publicUrl ||
      row.image_url ||
      row.path ||
      row.key ||
      row.location ||
      row.filename ||
      ""
    );
  }

  function normalizeUrl(u) {
    if (!u) return "";
    const s = String(u);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;

    const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    if (apiBase && s.startsWith("/")) return apiBase + s;

    const s3Base = (import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    if (s3Base) return s3Base + (s.startsWith("/") ? s : `/${s}`);

    return s;
  }

  function pickImageFromProduct(p) {
    const direct =
      p?.main_image_url ||
      p?.image_url ||
      p?.image ||
      p?.thumb_url ||
      p?.thumbnail_url ||
      p?.public_url ||
      p?.publicUrl ||
      null;

    if (direct) return normalizeUrl(direct);

    const arr = Array.isArray(p?.images)
      ? p.images
      : Array.isArray(p?.product_images)
        ? p.product_images
        : null;

    if (arr?.length) {
      const u = pickUrlFromImageRow(arr[0]);
      if (u) return normalizeUrl(u);
    }
    return "";
  }

  async function fetchFirstImageViaStore(productId) {
    const id = Number(productId || 0);
    if (!id) return "";

    // ✅ si ya cacheamos (incluye ""), no reintentar
    if (imageById.value[id] !== undefined) return imageById.value[id] || "";
    if (imgLoading.value[id]) return "";

    imgLoading.value = { ...imgLoading.value, [id]: true };

    try {
      const imgs = await products.fetchImages(id);

      const arr = Array.isArray(imgs) ? imgs : [];
      const u = pickUrlFromImageRow(arr[0] || null);
      const finalUrl = u ? normalizeUrl(u) : "";

      // ✅ cachear aunque sea vacío
      imageById.value = { ...imageById.value, [id]: finalUrl };
      return finalUrl;
    } catch {
      // ✅ IMPORTANTÍSIMO: cachear vacío para NO spammear
      imageById.value = { ...imageById.value, [id]: "" };
      return "";
    } finally {
      const next = { ...imgLoading.value };
      delete next[id];
      imgLoading.value = next;
    }
  }

  function productImage(p) {
    const id = Number(p?.id || 0);
    if (!id) return "";

    // 1) si viene en el objeto, usarlo
    const fromObj = pickImageFromProduct(p);
    if (fromObj) {
      if (imageById.value[id] !== fromObj) {
        imageById.value = { ...imageById.value, [id]: fromObj };
      }
      return fromObj;
    }

    // 2) si ya cacheamos, devolver
    if (imageById.value[id] !== undefined) return imageById.value[id] || "";

    // 3) disparar fetch async (una sola vez)
    fetchFirstImageViaStore(id);
    return "";
  }

  async function prefetchImagesForVisible(items) {
    const ids = (items || [])
      .map((x) => Number(x?.id || 0))
      .filter((x) => x > 0 && imageById.value[x] === undefined);

    // ✅ límite duro para no matar la red
    const slice = ids.slice(0, 36);
    await Promise.all(slice.map((id) => fetchFirstImageViaStore(id)));
  }

  return {
    productImage,
    prefetchImagesForVisible,
  };
}