<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/ProductPhotoGallery.vue -->
<template>
  <div class="pg">
    <div v-if="!items.length" class="pg-empty">
      <v-icon size="22">mdi-image-off-outline</v-icon>
      <span>Sin fotos cargadas</span>
    </div>

    <div v-else class="pg-grid">
      <!-- thumbs -->
      <div class="pg-thumbs">
        <button
          v-for="(it, idx) in items"
          :key="idx"
          type="button"
          class="pg-thumb"
          :class="{ active: idx === active }"
          @click="active = idx"
        >
          <img
            :src="it.url"
            :alt="it.title || ''"
            @error="onImgError(it.url)"
          />
        </button>
      </div>

      <!-- main -->
      <div class="pg-main">
        <img
          v-if="items[active]?.url"
          :src="items[active]?.url"
          :alt="items[active]?.title || ''"
          @error="onImgError(items[active]?.url)"
        />
        <div v-else class="pg-main-empty">
          <v-icon size="26">mdi-image-off-outline</v-icon>
          <div class="pg-main-empty-txt">Sin imagen</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  images: { type: Array, default: () => [] }, // [{url,title?}] or strings
});

const active = ref(0);

function pickBase() {
  const storage = (import.meta?.env?.VITE_STORAGE_PUBLIC_URL || "").trim();
  if (storage) return storage.replace(/\/+$/, "");

  const api = (import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE_URL || "").trim();
  if (api) return api.replace(/\/+$/, "");

  return "";
}

function resolveUrl(input) {
  if (!input) return "";
  const base = pickBase();

  const s = String(input).trim();
  if (!s) return "";

  // absoluta
  if (/^https?:\/\//i.test(s)) return s;

  // data uri
  if (s.startsWith("data:image/")) return s;

  // sin base, devolvemos tal cual
  if (!base) return s;

  // relativa con / => base + /path
  if (s.startsWith("/")) return base + s;

  // relativa sin / => base + /path
  return base + "/" + s.replace(/^\/+/, "");
}

const items = computed(() => {
  const arr = Array.isArray(props.images) ? props.images : [];
  const out = [];

  for (const it of arr) {
    if (!it) continue;

    // string
    if (typeof it === "string") {
      const u = resolveUrl(it);
      if (u) out.push({ url: u, title: "" });
      continue;
    }

    // object
    const rawUrl =
      it.url ||
      it.image_url ||
      it.src ||
      it.path ||
      it.key ||
      it.objectKey ||
      it.filename ||
      "";
    const u = resolveUrl(rawUrl);

    if (u) out.push({ url: u, title: String(it.title || it.alt || "").trim() });
  }

  // dedupe simple
  const seen = new Set();
  return out.filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
});

watch(
  () => items.value.length,
  (len) => {
    if (!len) {
      active.value = 0;
      return;
    }
    // ✅ clamp
    if (active.value < 0) active.value = 0;
    if (active.value > len - 1) active.value = 0;
  },
  { immediate: true }
);

function onImgError(url) {
  console.warn("[ProductPhotoGallery] img error:", url);
}
</script>

<style scoped>
.pg { width: 100%; }

.pg-empty{
  display:flex;
  align-items:center;
  gap:10px;
  padding:14px;
  border-radius:14px;
  background: rgba(0,0,0,.04);
  opacity:.8;
  font-weight: 500;
}

.pg-grid{
  display:grid;
  grid-template-columns: 86px 1fr;
  gap: 12px;
  align-items: start;
}
@media (max-width: 900px){
  .pg-grid{ grid-template-columns: 1fr; }
  .pg-thumbs{ order: 2; display:flex; flex-wrap:wrap; }
}

.pg-thumbs{
  display:grid;
  gap: 10px;
}

.pg-thumb{
  width: 86px;
  height: 86px;
  border-radius: 14px;
  border: 2px solid transparent;
  padding: 0;
  overflow:hidden;
  background: rgba(0,0,0,.04);
  cursor:pointer;
}
.pg-thumb.active{
  border-color: rgba(52,131,250,.9);
  box-shadow: 0 0 0 3px rgba(52,131,250,.12);
}

.pg-thumb img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}

.pg-main{
  width:100%;
  border-radius: 18px;
  overflow:hidden;
  background: rgba(0,0,0,.04);
  min-height: 240px;
  display:grid;
  place-items:center;
}
.pg-main img{
  width:100%;
  height: 100%;
  max-height: 520px;
  object-fit: contain;
  display:block;
}

.pg-main-empty{
  display:grid;
  place-items:center;
  gap: 6px;
  opacity: .8;
}
.pg-main-empty-txt{
  font-size: 12px;
  font-weight: 500;
}
</style>