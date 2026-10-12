<!-- /admin/shop/branding/compartir — Vista al compartir: imagen OG y decoración estacional sobre el logo -->

<template>
  <div class="sp vc">
    <header class="vc-cab">
      <div class="vc-migas">Tienda</div>
      <h1>Vista al compartir</h1>
    </header>

    <div v-if="error" class="vc-error" role="alert">{{ error }}</div>

    <section class="vc-bloque">
      <h2>Imagen al compartir</h2>
      <div class="vc-fila">
        <label class="vc-caja vc-caja--og" :class="{ 'is-ocupado': subiendoOg }">
          <img v-if="branding.og_image_url" :src="abs(branding.og_image_url)" alt="Imagen al compartir" />
          <span v-else class="vc-vacio">1200 × 630, JPG o PNG</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Elegir imagen al compartir" @change="onOg" />
        </label>
      </div>
    </section>

    <section class="vc-bloque">
      <h2>Decoración sobre el logo</h2>
      <div class="vc-fila">
        <label class="vc-caja" :class="{ 'is-ocupado': subiendoDeco }">
          <template v-if="branding.holiday_overlay_url">
            <video
              v-if="esVideo(branding.holiday_overlay_url)"
              :src="abs(branding.holiday_overlay_url)"
              autoplay
              muted
              loop
              playsinline
            />
            <img v-else :src="abs(branding.holiday_overlay_url)" alt="Decoración" />
          </template>
          <span v-else class="vc-vacio">GIF, PNG o MP4</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            aria-label="Elegir decoración"
            @change="onDeco"
          />
        </label>
        <button v-if="branding.holiday_overlay_url" type="button" class="vc-quitar" :disabled="quitando" @click="quitarDeco">
          Quitar
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import "@/modules/products/styles/proveedores.css";
import {
  getShopBranding,
  uploadShopOgImage,
  uploadShopHolidayOverlay,
  removeShopHolidayOverlay,
} from "@/modules/shop/service/admin.shopBranding.api";

const branding = ref({ og_image_url: "", holiday_overlay_url: "" });
const error = ref("");
const subiendoOg = ref(false);
const subiendoDeco = ref(false);
const quitando = ref(false);

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const assetBase = (() => {
  const cut = String(base || "").replace(/\/api(\/v\d+)?$/i, "");
  return (cut || base).replace(/\/+$/, "");
})();
function abs(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  return `${assetBase}${s.startsWith("/") ? "" : "/"}${s}`;
}
function esVideo(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/.test(String(url || "").toLowerCase());
}

async function cargar() {
  error.value = "";
  try {
    const it = await getShopBranding();
    if (it) branding.value = { ...branding.value, ...it };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar.";
  }
}

async function subir(uploader, ev, flag) {
  const f = ev?.target?.files?.[0] || null;
  if (ev?.target) ev.target.value = "";
  if (!f) return;
  flag.value = true;
  error.value = "";
  try {
    const it = await uploader(f);
    if (it) branding.value = { ...branding.value, ...it };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo subir.";
  } finally {
    flag.value = false;
  }
}
const onOg = (ev) => subir(uploadShopOgImage, ev, subiendoOg);
const onDeco = (ev) => subir(uploadShopHolidayOverlay, ev, subiendoDeco);

async function quitarDeco() {
  quitando.value = true;
  error.value = "";
  try {
    await removeShopHolidayOverlay();
    branding.value = { ...branding.value, holiday_overlay_url: "" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo quitar.";
  } finally {
    quitando.value = false;
  }
}

onMounted(cargar);
</script>

<style scoped>
.vc { font-family: Inter, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
.vc button, .vc input { font: inherit; }
.vc-migas { font-size: 13px; color: var(--sp-suave); }
.vc-cab h1 { font-size: 24px; font-weight: 800; letter-spacing: -.015em; margin: 2px 0 0; }
.vc-error { background: rgba(214, 59, 59, .1); color: #d63b3b; border: 1px solid rgba(214, 59, 59, .3); border-radius: 12px; padding: 10px 14px; font-weight: 600; font-size: 13px; }
.vc-bloque { background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 14px; padding: 18px; display: grid; gap: 14px; }
.vc-bloque h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--sp-suave); margin: 0; }
.vc-fila { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.vc-caja { position: relative; width: 160px; aspect-ratio: 1; border-radius: 12px; border: 1px dashed var(--sp-borde); background: #ffffff; display: grid; place-items: center; overflow: hidden; cursor: pointer; padding: 8px; }
.vc-caja--og { width: min(100%, 420px); aspect-ratio: 1200 / 630; padding: 0; }
.vc-caja--og img { width: 100%; height: 100%; object-fit: cover; }
.vc-caja img, .vc-caja video { max-width: 100%; max-height: 100%; object-fit: contain; }
.vc-caja.is-ocupado { opacity: .5; pointer-events: none; }
.vc-caja input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.vc-vacio { font-size: 12px; color: #8a94a6; text-align: center; }
.vc-quitar { background: none; border: 0; color: #d63b3b; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
.vc-quitar:disabled { opacity: .5; }
</style>
