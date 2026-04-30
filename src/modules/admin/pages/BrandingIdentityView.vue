<!-- /admin/shop/branding/identity — Identidad visual del shop -->

<template>
  <v-container class="mx-auto" style="max-width: 1000px">
    <AppPageHeader
      icon="mdi-storefront-outline"
      title="Identidad visual"
      subtitle="Nombre, logo, favicon y previews. Aparece en el header del shop y al compartir links en WhatsApp / redes."
      :back-to="{ name: 'shopBranding' }"
    >
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="saving"
        @click="saveName"
      >
        Guardar nombre
      </v-btn>
    </AppPageHeader>

    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-alert v-if="error" type="error" variant="tonal" rounded="lg" class="mb-3" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <!-- NOMBRE -->
      <div class="mb-5">
        <div class="text-subtitle-2 font-weight-medium mb-1">Nombre del shop</div>
        <div class="text-caption text-medium-emphasis mb-3">
          Se usa en el header del shop y en el title del navegador.
        </div>

        <v-text-field
          v-model="form.name"
          placeholder="Ej. San Juan Tecnología"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          hide-details
          prepend-inner-icon="mdi-storefront-outline"
        />
      </div>

      <v-divider class="my-5" />

      <!-- LOGO -->
      <div class="mb-5">
        <div class="text-subtitle-2 font-weight-medium mb-1">Logo</div>
        <div class="text-caption text-medium-emphasis mb-3">
          PNG/SVG con fondo transparente. Recomendado 240×80 aprox.
        </div>

        <v-card rounded="xl" variant="tonal" class="pa-3">
          <div class="d-flex align-center ga-3">
            <v-avatar size="64" rounded="lg" color="surface" class="elevation-1">
              <v-img v-if="branding.logo_url" :src="abs(branding.logo_url)" cover />
              <v-icon v-else size="22" class="text-medium-emphasis">mdi-image-outline</v-icon>
            </v-avatar>

            <div class="flex-grow-1 min-w-0">
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ branding.logo_url || "Sin logo cargado" }}
              </div>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                rounded="lg"
                prepend-icon="mdi-upload"
                :loading="uploadingLogo"
                class="mt-2"
                @click="pickLogo"
              >
                Subir logo
              </v-btn>
            </div>
          </div>
        </v-card>
        <input ref="logoInput" type="file" accept="image/*" class="d-none" @change="onLogoFile" />
      </div>

      <!-- FAVICON -->
      <div class="mb-5">
        <div class="text-subtitle-2 font-weight-medium mb-1">Favicon</div>
        <div class="text-caption text-medium-emphasis mb-3">
          PNG/ICO de 48×48 o 64×64. Aparece en la pestaña del navegador.
        </div>

        <v-card rounded="xl" variant="tonal" class="pa-3">
          <div class="d-flex align-center ga-3">
            <v-avatar size="48" rounded="lg" color="surface" class="elevation-1">
              <v-img v-if="branding.favicon_url" :src="abs(branding.favicon_url)" cover />
              <v-icon v-else size="20" class="text-medium-emphasis">mdi-image-outline</v-icon>
            </v-avatar>

            <div class="flex-grow-1 min-w-0">
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ branding.favicon_url || "Sin favicon cargado" }}
              </div>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                rounded="lg"
                prepend-icon="mdi-upload"
                :loading="uploadingFav"
                class="mt-2"
                @click="pickFavicon"
              >
                Subir favicon
              </v-btn>
            </div>
          </div>
        </v-card>
        <input ref="favInput" type="file" accept="image/*,.ico" class="d-none" @change="onFavFile" />
      </div>

      <!-- OG IMAGE -->
      <div>
        <div class="text-subtitle-2 font-weight-medium mb-1">Imagen para previews (OG)</div>
        <div class="text-caption text-medium-emphasis mb-3">
          Se muestra cuando alguien comparte un link del shop. Recomendado 1200×630 (JPG/PNG).
          El backend la guarda como <code>og-default.jpg</code>.
        </div>

        <v-card rounded="xl" variant="tonal" class="pa-3">
          <div class="d-flex align-center ga-3">
            <v-avatar size="64" rounded="lg" color="surface" class="elevation-1" style="width: 110px;">
              <v-img v-if="branding.og_image_url" :src="abs(branding.og_image_url)" cover />
              <v-icon v-else size="22" class="text-medium-emphasis">mdi-image-outline</v-icon>
            </v-avatar>

            <div class="flex-grow-1 min-w-0">
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ branding.og_image_url || "Sin OG cargada" }}
              </div>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                rounded="lg"
                prepend-icon="mdi-upload"
                :loading="uploadingOg"
                class="mt-2"
                @click="pickOg"
              >
                Subir OG
              </v-btn>
            </div>
          </div>
        </v-card>
        <input ref="ogInput" type="file" accept="image/*" class="d-none" @change="onOgFile" />
      </div>

      <v-divider class="my-5" />

      <!-- 🇦🇷 DECORACIÓN ESTACIONAL -->
      <div>
        <div class="text-subtitle-2 font-weight-medium mb-1">
          Decoración estacional sobre el logo
          <v-chip size="x-small" variant="tonal" color="primary" class="ml-2">opcional</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mb-3">
          Subí un GIF, PNG transparente o video corto MP4 (hasta 8MB) para mostrarlo
          encima del logo del shop. Útil para temporada (gorrito argentino del Mundial,
          gorro de Navidad, etc). Si no subís nada, no se muestra nada.
        </div>

        <v-card rounded="xl" variant="tonal" class="pa-3">
          <div class="d-flex align-center ga-3 flex-wrap">
            <!-- Preview -->
            <div class="overlay-preview">
              <template v-if="branding.holiday_overlay_url">
                <video
                  v-if="isVideoUrl(branding.holiday_overlay_url)"
                  :src="abs(branding.holiday_overlay_url)"
                  autoplay
                  muted
                  loop
                  playsinline
                  class="overlay-preview-media"
                />
                <img
                  v-else
                  :src="abs(branding.holiday_overlay_url)"
                  alt="Decoración"
                  class="overlay-preview-media"
                />
              </template>
              <v-icon v-else size="22" class="text-medium-emphasis">
                mdi-party-popper
              </v-icon>
            </div>

            <div class="flex-grow-1 min-w-0">
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ branding.holiday_overlay_url || "Sin decoración cargada" }}
              </div>
              <div class="d-flex ga-2 mt-2">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  rounded="lg"
                  prepend-icon="mdi-upload"
                  :loading="uploadingOverlay"
                  @click="pickOverlay"
                >
                  {{ branding.holiday_overlay_url ? "Reemplazar" : "Subir decoración" }}
                </v-btn>

                <v-btn
                  v-if="branding.holiday_overlay_url"
                  variant="text"
                  size="small"
                  rounded="lg"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  :loading="removingOverlay"
                  @click="removeOverlay"
                >
                  Quitar
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>

        <input
          ref="overlayInput"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          class="d-none"
          @change="onOverlayFile"
        />
      </div>

      <div v-if="branding.updated_at" class="text-caption text-medium-emphasis mt-4 text-right">
        Última actualización: {{ branding.updated_at }}
      </div>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="2400">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from "vue";
import {
  getShopBranding,
  updateShopBranding,
  uploadShopLogo,
  uploadShopFavicon,
  uploadShopOgImage,
  uploadShopHolidayOverlay,
  removeShopHolidayOverlay,
} from "@/modules/shop/service/admin.shopBranding.api";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const saving = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "" });

const branding = ref({
  name: "",
  logo_url: "",
  favicon_url: "",
  og_image_url: "",
  holiday_overlay_url: "",
  updated_at: null,
});
const form = ref({ name: "" });

const logoInput = ref(null);
const favInput = ref(null);
const ogInput = ref(null);
const overlayInput = ref(null);
const uploadingLogo = ref(false);
const uploadingFav = ref(false);
const uploadingOg = ref(false);
const uploadingOverlay = ref(false);
const removingOverlay = ref(false);

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

async function load() {
  error.value = "";
  try {
    const it = await getShopBranding();
    if (it) {
      branding.value = { ...branding.value, ...it };
      form.value.name = branding.value.name || "";
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar la identidad.";
  }
}

async function saveName() {
  saving.value = true;
  error.value = "";
  try {
    const it = await updateShopBranding({ name: form.value.name });
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: "Nombre guardado" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

function pickLogo() { logoInput.value?.click(); }
function pickFavicon() { favInput.value?.click(); }
function pickOg() { ogInput.value?.click(); }

async function uploadAndApply(uploader, ev, flagRef, label) {
  const f = ev?.target?.files?.[0] || null;
  if (ev?.target) ev.target.value = "";
  if (!f) return;
  flagRef.value = true;
  error.value = "";
  try {
    const it = await uploader(f);
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: `${label} subido` };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || `No se pudo subir el ${label.toLowerCase()}.`;
  } finally {
    flagRef.value = false;
  }
}

const onLogoFile = (ev) => uploadAndApply(uploadShopLogo, ev, uploadingLogo, "Logo");
const onFavFile = (ev) => uploadAndApply(uploadShopFavicon, ev, uploadingFav, "Favicon");
const onOgFile = (ev) => uploadAndApply(uploadShopOgImage, ev, uploadingOg, "OG");

function pickOverlay() { overlayInput.value?.click(); }
const onOverlayFile = (ev) => uploadAndApply(uploadShopHolidayOverlay, ev, uploadingOverlay, "Decoración");

async function removeOverlay() {
  if (!confirm("¿Quitar la decoración estacional del logo?")) return;
  removingOverlay.value = true;
  error.value = "";
  try {
    const it = await removeShopHolidayOverlay();
    if (it) branding.value = { ...branding.value, ...it, holiday_overlay_url: "" };
    else branding.value = { ...branding.value, holiday_overlay_url: "" };
    snack.value = { show: true, text: "Decoración eliminada" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo eliminar.";
  } finally {
    removingOverlay.value = false;
  }
}

function isVideoUrl(url) {
  const u = String(url || "").toLowerCase();
  return /\.(mp4|webm|mov|m4v)(\?|$)/.test(u);
}

onMounted(load);
</script>

<style scoped>
.min-w-0 { min-width: 0; }

code {
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 11.5px;
}

.overlay-preview {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  display: grid;
  place-items: center;
  overflow: hidden;
  flex: 0 0 auto;
}
.overlay-preview-media {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
