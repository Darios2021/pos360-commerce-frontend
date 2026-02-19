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
          <img :src="it.url" :alt="it.title || ''" />
        </button>
      </div>

      <!-- main -->
      <div class="pg-main">
        <img :src="items[active]?.url" :alt="items[active]?.title || ''" />
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

const items = computed(() => {
  const arr = Array.isArray(props.images) ? props.images : [];
  const out = [];
  for (const it of arr) {
    if (!it) continue;
    if (typeof it === "string") {
      const u = it.trim();
      if (u) out.push({ url: u, title: "" });
      continue;
    }
    const u = String(it.url || it.image_url || it.src || it.path || "").trim();
    if (u) out.push({ url: u, title: String(it.title || it.alt || "").trim() });
  }
  return out;
});

watch(
  () => items.value.length,
  () => {
    active.value = 0;
  }
);
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
  font-weight:800;
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
</style>
