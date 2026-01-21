<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramEmbed.vue -->
<template>
  <section class="ig-wrap">
    <div class="ig-shell">
      <!-- Header suave -->
      <div class="ig-top">
        <div class="ig-brand">
          <span class="ig-dot" aria-hidden="true"></span>
          <v-icon size="18" class="ig-icon">mdi-instagram</v-icon>
          <div class="ig-copy">
            <div class="ig-title">{{ title }}</div>
            <div class="ig-subtitle">{{ subtitle }}</div>
          </div>
        </div>

        <v-btn
          class="ig-btn"
          size="small"
          variant="flat"
          color="primary"
          prepend-icon="mdi-open-in-new"
          :href="cleanPermalink"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver sorteo
        </v-btn>
      </div>

      <!-- Frame -->
      <div v-if="embedSrc" class="ig-frame">
        <iframe
          class="ig-iframe"
          :src="embedSrc"
          :title="`Instagram: ${title}`"
          loading="lazy"
          allowfullscreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>

      <!-- Fallback -->
      <div v-else class="ig-fallback">
        <v-alert type="warning" variant="tonal" density="comfortable">
          Falta el link del post/reel para embeber.
        </v-alert>
      </div>

      <!-- Footer mini -->
      <div class="ig-foot">
        <span class="ig-foot-text">
          Si no se visualiza dentro del navegador interno de Instagram/Facebook, tocá <b>“Ver sorteo”</b>.
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  permalink: { type: String, default: "" },
  title: { type: String, default: "Sorteo activo" },
  subtitle: { type: String, default: "Participá desde Instagram y mirá las condiciones." },
  // alturas controladas para que NO sea gigante
  heightDesktop: { type: Number, default: 380 },
  heightMobile: { type: Number, default: 460 },
});

function normalizePermalink(u) {
  const s = String(u || "").trim();
  if (!s) return "";

  // sacar query/hash
  const noQuery = s.split("?")[0].split("#")[0];

  // https
  let url = noQuery;
  if (url.startsWith("http://")) url = url.replace("http://", "https://");

  // asegurar trailing slash
  if (!url.endsWith("/")) url += "/";

  return url;
}

const cleanPermalink = computed(() => normalizePermalink(props.permalink));

const embedSrc = computed(() => {
  const base = cleanPermalink.value;
  if (!base) return "";
  return base + "embed/";
});

const frameStyle = computed(() => {
  return {
    "--ig-h-desktop": `${Number(props.heightDesktop) || 380}px`,
    "--ig-h-mobile": `${Number(props.heightMobile) || 460}px`,
  };
});
</script>

<style scoped>
/* wrapper neutro */
.ig-wrap {
  width: 100%;
}

/* card suave tipo “premium” */
.ig-shell {
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* header */
.ig-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.03),
    rgba(0, 0, 0, 0.00)
  );
}

.ig-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ig-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 0, 128, 0.55), rgba(255, 153, 0, 0.45));
  box-shadow: 0 0 0 6px rgba(255, 0, 128, 0.08);
}

.ig-icon {
  opacity: 0.9;
}

.ig-copy {
  min-width: 0;
}

.ig-title {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ig-subtitle {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* botón más “suave” */
.ig-btn {
  border-radius: 999px !important;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}

/* frame contenedor con ratio card */
.ig-frame {
  padding: 0 16px 14px 16px;
}

.ig-frame::v-deep(*) {
  box-sizing: border-box;
}

/* caja del iframe con borde sutil + blur background */
.ig-frame {
  position: relative;
}

.ig-frame:before {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  bottom: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.65);
  filter: blur(0px);
  pointer-events: none;
}

.ig-iframe {
  position: relative;
  width: 100%;
  height: var(--ig-h-desktop, 380px); /* ✅ acotado */
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  overflow: hidden;
  display: block;
  background: #fff;
}

/* fallback */
.ig-fallback {
  padding: 0 16px 14px 16px;
}

/* footer */
.ig-foot {
  padding: 10px 16px 14px 16px;
}

.ig-foot-text {
  font-size: 12px;
  opacity: 0.72;
}

/* mobile */
@media (max-width: 600px) {
  .ig-top {
    padding: 12px 12px;
  }
  .ig-frame {
    padding: 0 12px 12px 12px;
  }
  .ig-frame:before {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
  .ig-iframe {
    height: var(--ig-h-mobile, 460px); /* ✅ mobile controlado */
    border-radius: 16px;
  }
  .ig-foot {
    padding: 8px 12px 12px 12px;
  }
}
</style>
