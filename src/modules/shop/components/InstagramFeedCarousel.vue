<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramFeedCarousel.vue -->
<template>
  <v-card class="igf-card" variant="outlined" rounded="xl">
    <div class="igf-head">
      <div class="igf-left">
        <span class="igf-dot" aria-hidden="true"></span>
        <v-icon size="18" class="igf-icon">mdi-instagram</v-icon>

        <div class="igf-copy">
          <div class="igf-title">{{ title }}</div>
          <div class="igf-subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <div class="igf-actions">
        <v-btn
          v-if="profileUrl"
          class="igf-btn"
          size="small"
          variant="tonal"
          prepend-icon="mdi-account"
          :href="profileUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver perfil
        </v-btn>

        <v-btn
          class="igf-btn"
          size="small"
          variant="flat"
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="load"
        >
          Actualizar
        </v-btn>
      </div>
    </div>

    <div class="igf-body">
      <v-alert v-if="error" type="warning" variant="tonal" density="comfortable">
        {{ error }}
      </v-alert>

      <div v-else>
        <div v-if="loading" class="igf-skel">
          <div v-for="n in skelCount" :key="n" class="igf-skel-item">
            <v-skeleton-loader type="image" />
          </div>
        </div>

        <v-slide-group v-else class="igf-group" show-arrows center-active>
          <v-slide-group-item v-for="it in items" :key="it.id">
            <a class="igf-item" :href="it.permalink" target="_blank" rel="noopener noreferrer">
              <div class="igf-media">
                <img class="igf-img" :src="it.thumb_url" :alt="it.caption || 'Instagram'" loading="lazy" />
                <div class="igf-badge" v-if="it.media_type === 'VIDEO'">
                  <v-icon size="16">mdi-play</v-icon>
                </div>
                <div class="igf-badge" v-else-if="it.media_type === 'CAROUSEL_ALBUM'">
                  <v-icon size="16">mdi-layers-outline</v-icon>
                </div>
              </div>

              <div class="igf-meta">
                <div class="igf-cap">{{ trimCaption(it.caption) }}</div>
                <div class="igf-open">
                  <v-icon size="16">mdi-open-in-new</v-icon>
                  <span>Abrir</span>
                </div>
              </div>
            </a>
          </v-slide-group-item>
        </v-slide-group>

        <div v-if="!loading && !items.length" class="text-caption text-medium-emphasis mt-2">
          No hay publicaciones para mostrar.
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getInstagramLatest } from "@/modules/shop/service/shop.instagram.api";


const loading = ref(false);
const error = ref("");
const items = ref([]);

const skelCount = computed(() => Math.min(Math.max(Number(props.limit || 10), 4), 12));

function trimCaption(s) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (!t) return "Publicación";
  return t.length > 70 ? t.slice(0, 70) + "…" : t;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getInstagramLatest(props.limit);
    items.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("❌ InstagramFeedCarousel", e);
    error.value = "No se pudo cargar Instagram. Tocá “Ver perfil” para abrirlo directo.";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.igf-card {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
}

.igf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px 10px 16px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0));
}

.igf-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.igf-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 0, 128, 0.55), rgba(255, 153, 0, 0.45));
  box-shadow: 0 0 0 6px rgba(255, 0, 128, 0.08);
}

.igf-icon {
  opacity: 0.9;
}

.igf-copy {
  min-width: 0;
}

.igf-title {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igf-subtitle {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igf-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.igf-btn {
  border-radius: 999px !important;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}

.igf-body {
  padding: 0 16px 16px 16px;
}

.igf-skel {
  display: flex;
  gap: 12px;
  overflow: hidden;
  padding-top: 6px;
}

.igf-skel-item {
  width: 220px;
  flex: 0 0 auto;
}

.igf-group {
  margin-top: 6px;
}

.igf-item {
  width: 240px;
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
  margin-right: 12px;
}

.igf-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.1);
}

.igf-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(0, 0, 0, 0.03);
}

.igf-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.igf-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.igf-meta {
  padding: 10px 12px 12px 12px;
}

.igf-cap {
  font-size: 12px;
  opacity: 0.85;
  line-height: 1.2;
  min-height: 28px;
}

.igf-open {
  margin-top: 8px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  opacity: 0.8;
}

@media (max-width: 600px) {
  .igf-head {
    padding: 12px 12px 8px 12px;
  }
  .igf-body {
    padding: 0 12px 12px 12px;
  }
  .igf-item {
    width: 200px;
  }
}
</style>
