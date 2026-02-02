<template>
  <div class="sj-spot-wrap">
    <v-menu
      v-model="open"
      location="bottom end"
      offset="10"
      transition="fade-transition"
      :close-on-content-click="false"
    >
      <template #activator="{ props }">
        <button
          class="sj-spot-btn"
          type="button"
          v-bind="props"
          :aria-label="open ? 'Cerrar música' : 'Abrir música'"
          :title="open ? 'Cerrar' : 'Música'"
        >
          <v-icon class="sj-spot-ico" size="22">
            {{ open ? "mdi-close" : "mdi-play" }}
          </v-icon>
        </button>
      </template>

      <!-- Panel mini (NO modal) -->
      <v-card class="sj-spot-card" elevation="16" rounded="xl">
        <div class="sj-spot-head">
          <div class="sj-spot-pill">
            <span class="sj-dot" aria-hidden="true"></span>
            <span class="sj-t1">SJ Música</span>
            <span class="sj-t2">Playlist San Juan Tecnología</span>
          </div>

          <v-btn icon variant="text" class="sj-close" @click="open = false" aria-label="Cerrar">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="sj-spot-frame">
          <iframe
            :src="embedUrl"
            title="San Juan Tecnología - Spotify Playlist"
            width="100%"
            height="152"
            frameborder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>

        <div class="sj-spot-hint">
          Tocá <b>Play</b> una vez. Podés cerrar este panel y la música sigue sonando.
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  playlistId: { type: String, required: true },
});

const open = ref(false);

const embedUrl = computed(() => {
  const id = String(props.playlistId || "").trim();
  return `https://open.spotify.com/embed/playlist/${encodeURIComponent(id)}?utm_source=generator&theme=0`;
});
</script>

<style scoped>
.sj-spot-wrap {
  display: inline-flex;
  align-items: center;
}

/* Botón verde estilo WhatsApp */
.sj-spot-btn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;

  background: #25d366;
  color: #fff;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
  transition: transform 0.12s ease, filter 0.12s ease;
}
.sj-spot-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}
.sj-spot-btn:active {
  transform: translateY(0px) scale(0.98);
}
.sj-spot-ico {
  color: #fff;
}

/* Panel mini */
.sj-spot-card {
  width: min(360px, calc(100vw - 24px));
  background: rgba(18, 18, 20, 0.96);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.10);
  overflow: hidden;
}

.sj-spot-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px 8px;
}

.sj-spot-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.sj-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #1db954;
  box-shadow: 0 0 0 6px rgba(29, 185, 84, 0.16);
}

.sj-t1 {
  font-weight: 950;
  font-size: 13px;
  white-space: nowrap;
}

.sj-t2 {
  font-size: 12px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sj-close {
  color: #fff !important;
  opacity: 0.9;
}

.sj-spot-frame {
  padding: 0 10px 10px;
}
.sj-spot-frame iframe {
  border-radius: 14px;
  overflow: hidden;
  background: #0b0b0c;
}

.sj-spot-hint {
  padding: 0 12px 12px;
  font-size: 11px;
  opacity: 0.75;
}
</style>
