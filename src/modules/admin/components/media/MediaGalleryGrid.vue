<template>
  <div class="mm-grid" :class="{ 'mm-grid-compact': compact }">
    <v-card
      v-for="img in items"
      :key="img.key || img.url"
      class="mm-card"
      rounded="xl"
      variant="outlined"
    >
      <button class="mm-thumb" type="button" @click="$emit('view', img)" :aria-label="`Ver ${img.filename}`">
        <img :src="img.url" :alt="img.filename" loading="lazy" />
        <div class="mm-badges">
          <v-chip size="small" :color="img.is_used ? 'green' : 'grey'" variant="tonal">
            {{ img.is_used ? `Usada (${img.used_count})` : "No usada" }}
          </v-chip>
        </div>
      </button>

      <v-card-text class="mm-meta">
        <div class="mm-filename" :title="img.filename">{{ img.filename }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ formatBytes(img.size) }} · {{ formatDate(img.last_modified) }}
        </div>

        <div v-if="showSummary" class="mm-productline">
          <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon>
          <span class="text-caption text-medium-emphasis">{{ summaryOf(img) }}</span>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="mm-actions">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click="$emit('view', img)">Ver</v-btn>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-content-copy" @click="$emit('copy', img)">Copiar URL</v-btn>
        <v-spacer />
        <v-btn
          size="small"
          color="red"
          variant="tonal"
          prepend-icon="mdi-delete"
          :disabled="img.is_used"
          @click="$emit('delete', img)"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
defineEmits(["view", "copy", "delete"]);

const props = defineProps({
  items: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
  showSummary: { type: Boolean, default: true },
  summaryOf: { type: Function, default: () => "—" },
});

function formatBytes(n) {
  const v = Number(n || 0);
  if (!v) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(v) / Math.log(k)));
  return `${(v / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${sizes[i]}`;
}

function formatDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return "—";
  }
}
</script>

<style scoped>
.mm-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
.mm-grid-compact {
  gap: 10px;
}

.mm-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mm-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(0, 0, 0, 0.06);
  border: 0;
  padding: 0;
  cursor: pointer;
}
.mm-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mm-badges {
  position: absolute;
  left: 10px;
  top: 10px;
}

.mm-meta {
  padding: 12px;
}
.mm-filename {
  font-weight: 800;
  font-size: 0.95rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mm-productline {
  display: flex;
  align-items: center;
  margin-top: 8px;
  min-height: 20px;
}

.mm-actions {
  padding: 10px;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 1400px) {
  .mm-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
@media (max-width: 1200px) {
  .mm-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 960px) {
  .mm-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .mm-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
