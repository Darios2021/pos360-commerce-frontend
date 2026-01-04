<!-- src/modules/shop/components/PromoBannerParlantes.vue -->
<template>
  <v-card
    class="pb-card"
    variant="flat"
    rounded="xl"
    role="button"
    tabindex="0"
    :title="title"
    @click="go"
    @keydown.enter.prevent="go"
    @keydown.space.prevent="go"
  >
    <div class="pb-grid">
      <!-- LEFT -->
      <div class="pb-left">
        <div class="pb-kicker">AUDIO</div>

        <div class="pb-title">
          PROMOCIÓN DE<br />
          PARLANTES
        </div>

        <div class="pb-sub">
          Descubrí parlantes y audio para tu setup.
        </div>

        <button class="pb-link" type="button" @click.stop="go">
          Ver ofertas
          <v-icon size="18" class="pb-link-ic">mdi-chevron-right</v-icon>
        </button>

        <div v-if="!ready" class="pb-note">Cargando categoría…</div>
      </div>

      <!-- RIGHT -->
      <div class="pb-right" aria-hidden="true">
        <img
          class="pb-img"
          :src="imgSrc"
          alt="Promoción Parlantes"
          loading="lazy"
          @error="onImgError"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";

const router = useRouter();

const title = "Promoción de Parlantes";

/**
 * ✅ Tu imagen (principal)
 */
const PRIMARY_IMG =
  "https://storage-files.cingulado.org/pos360/products/14/1766778670423-5fba6ded.jpeg";

/**
 * ✅ Fallback (si tu storage no responde / 403 / etc.)
 */
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1518441984357-749f0f4a53b1?auto=format&fit=crop&w=1200&q=80";

const imgSrc = ref(PRIMARY_IMG);
function onImgError() {
  if (imgSrc.value !== FALLBACK_IMG) imgSrc.value = FALLBACK_IMG;
}

/* ========= resolver IDs reales ========= */
const audioId = ref(null);
const parlantesId = ref(null);

const ready = computed(() => Number(audioId.value) > 0 && Number(parlantesId.value) > 0);

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isParent(c) {
  return (
    c &&
    (c.parent_id === null ||
      c.parent_id === undefined ||
      c.parent_id === 0 ||
      c.parent_id === "0")
  );
}

function pickAudioParent(all) {
  return (
    (all || []).find((c) => isParent(c) && norm(c.name) === "audio") ||
    (all || []).find((c) => isParent(c) && norm(c.name).includes("audio")) ||
    null
  );
}

function pickParlantesChild(all, pid) {
  const p = Number(pid);
  if (!p) return null;
  const childs = (all || []).filter((c) => Number(c?.parent_id) === p);
  return childs.find((c) => norm(c.name).includes("parlant")) || null;
}

async function resolveIds() {
  try {
    const all = await getPublicCategories();
    const audio = pickAudioParent(all);
    if (audio?.id) audioId.value = Number(audio.id);

    const parl = pickParlantesChild(all, audioId.value);
    if (parl?.id) parlantesId.value = Number(parl.id);
  } catch (e) {
    console.error("❌ PromoBannerParlantes.resolveIds", e);
  }
}

function go() {
  // ✅ /shop/c/:id?sub=XX (como tu captura)
  if (ready.value) {
    router.push({
      name: "shopCategory",
      params: { id: String(audioId.value) },
      query: { sub: String(parlantesId.value) },
    });
    return;
  }

  // fallback
  router.push({ name: "shopHome", query: { q: "parlantes" } });
}

onMounted(resolveIds);
</script>

<style scoped>
.pb-card {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #dceefe;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  user-select: none;
}

.pb-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  align-items: center;
  gap: 10px;
  padding: 16px;
  min-height: 160px;
}

.pb-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pb-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.65;
  text-transform: uppercase;
  font-weight: 900;
}

.pb-title {
  font-weight: 1000;
  font-size: 22px;
  line-height: 1.05;
  letter-spacing: -0.3px;
  color: #111;
}

.pb-sub {
  font-size: 12px;
  opacity: 0.75;
  max-width: 360px;
}

.pb-link {
  margin-top: 2px;
  align-self: flex-start;
  border: 0;
  background: transparent;
  padding: 0;
  color: #0b57d0;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pb-link-ic {
  opacity: 0.9;
}

.pb-note {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.6;
}

.pb-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 220px; /* evita colapso */
}

/* ✅ “banner style”: que se vea bien con tu imagen real */
.pb-img {
  width: 100%;
  max-width: 320px;
  height: 130px;
  object-fit: cover; /* 🔥 para tu imagen de producto queda mejor que contain */
  border-radius: 12px;
  display: block;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
}

/* Desktop grande */
@media (min-width: 1200px) {
  .pb-grid {
    padding: 18px;
    min-height: 170px;
  }
  .pb-title {
    font-size: 24px;
  }
  .pb-img {
    max-width: 360px;
    height: 140px;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .pb-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    min-height: 0;
    padding: 14px;
  }

  .pb-title {
    font-size: 18px;
  }

  .pb-right {
    justify-content: center;
    min-width: 0;
  }

  .pb-img {
    max-width: 520px;
    width: 100%;
    height: 160px;
  }
}
</style>
