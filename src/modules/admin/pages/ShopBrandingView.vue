<!-- src/modules/admin/pages/ShopBrandingView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Branding</div>
          <div class="text-caption text-medium-emphasis">
            Configurá nombre, logo, favicon y OG (preview WhatsApp) del ecommerce público.
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
            Recargar
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="saveName" :loading="saving">
            Guardar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field v-model="form.name" label="Nombre de la tienda" variant="outlined" />
          <div class="text-caption text-medium-emphasis">
            Se usa en el header y como título del sitio.
          </div>
        </v-col>

        <!-- Logo -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="font-weight-bold">Logo</div>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-upload"
                @click="pickLogo"
                :loading="uploadingLogo"
              >
                Subir logo
              </v-btn>
            </div>

            <div class="mt-3 d-flex align-center ga-3">
              <v-avatar size="56" rounded="lg" color="white" class="elevation-1">
                <v-img v-if="branding.logo_url" :src="abs(branding.logo_url)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>
              <div class="text-caption text-medium-emphasis" style="word-break: break-all;">
                {{ branding.logo_url || "Sin logo cargado" }}
              </div>
            </div>

            <input ref="logoInput" type="file" accept="image/*" class="d-none" @change="onLogoFile" />
          </v-card>
        </v-col>

        <!-- Favicon -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="font-weight-bold">Favicon</div>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-upload"
                @click="pickFavicon"
                :loading="uploadingFav"
              >
                Subir favicon
              </v-btn>
            </div>

            <div class="mt-3 d-flex align-center ga-3">
              <v-avatar size="40" rounded="lg" color="white" class="elevation-1">
                <v-img v-if="branding.favicon_url" :src="abs(branding.favicon_url)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>
              <div class="text-caption text-medium-emphasis" style="word-break: break-all;">
                {{ branding.favicon_url || "Sin favicon cargado" }}
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              Recomendado: 48x48 o 64x64 (PNG/ICO).
            </div>

            <input ref="favInput" type="file" accept="image/*,.ico" class="d-none" @change="onFavFile" />
          </v-card>
        </v-col>

        <!-- ✅ OG Image (WhatsApp preview) -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="font-weight-bold">OG Image (preview WhatsApp)</div>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-upload"
                @click="pickOg"
                :loading="uploadingOg"
              >
                Subir OG
              </v-btn>
            </div>

            <div class="mt-3 d-flex align-center ga-3">
              <v-avatar size="56" rounded="lg" color="white" class="elevation-1">
                <v-img v-if="branding.og_image_url" :src="abs(branding.og_image_url)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>

              <div class="text-caption text-medium-emphasis" style="word-break: break-all;">
                {{ branding.og_image_url || "Sin OG cargada" }}
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              Recomendado: 1200×630 (JPG/PNG). El backend la normaliza y la guarda como <b>og-default.jpg</b>.
            </div>

            <input ref="ogInput" type="file" accept="image/*" class="d-none" @change="onOgFile" />
          </v-card>
        </v-col>

        <!-- Updated at -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-1">Última actualización</div>
            <div class="text-caption text-medium-emphasis">
              {{ branding.updated_at || "—" }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  getShopBranding,
  updateShopBranding,
  uploadShopLogo,
  uploadShopFavicon,
  uploadShopOgImage, // ✅ nuevo
} from "@/modules/shop/service/admin.shopBranding.api";

const loading = ref(false);
const saving = ref(false);
const uploadingLogo = ref(false);
const uploadingFav = ref(false);
const uploadingOg = ref(false);
const error = ref("");

const branding = ref({
  name: "San Juan Tecnología",
  logo_url: "",
  favicon_url: "",
  og_image_url: "", // ✅ nuevo
  updated_at: null,
});

const form = ref({ name: "San Juan Tecnología" });
const snack = ref({ show: false, text: "" });

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const assetBase = (() => {
  const b = String(base || "").replace(/\/+$/, "");
  const cut = b.replace(/\/api(\/v\d+)?$/i, "");
  return (cut || b).replace(/\/+$/, "");
})();

function abs(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  return `${assetBase}${s.startsWith("/") ? "" : "/"}${s}`;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const it = await getShopBranding();
    if (it) {
      branding.value = { ...branding.value, ...it };
      form.value.name = branding.value.name || "San Juan Tecnología";
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el branding.";
  } finally {
    loading.value = false;
  }
}

async function saveName() {
  saving.value = true;
  error.value = "";
  try {
    const it = await updateShopBranding({ name: form.value.name });
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: "Guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

/** uploads */
const logoInput = ref(null);
const favInput = ref(null);
const ogInput = ref(null);

function pickLogo() { logoInput.value?.click(); }
function pickFavicon() { favInput.value?.click(); }
function pickOg() { ogInput.value?.click(); }

async function onLogoFile(ev) {
  const f = ev?.target?.files?.[0] || null;
  ev.target.value = "";
  if (!f) return;

  uploadingLogo.value = true;
  error.value = "";
  try {
    const it = await uploadShopLogo(f);
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: "Logo subido OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo subir el logo.";
  } finally {
    uploadingLogo.value = false;
  }
}

async function onFavFile(ev) {
  const f = ev?.target?.files?.[0] || null;
  ev.target.value = "";
  if (!f) return;

  uploadingFav.value = true;
  error.value = "";
  try {
    const it = await uploadShopFavicon(f);
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: "Favicon subido OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo subir el favicon.";
  } finally {
    uploadingFav.value = false;
  }
}

async function onOgFile(ev) {
  const f = ev?.target?.files?.[0] || null;
  ev.target.value = "";
  if (!f) return;

  uploadingOg.value = true;
  error.value = "";
  try {
    const it = await uploadShopOgImage(f);
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: "OG subida OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo subir la OG.";
  } finally {
    uploadingOg.value = false;
  }
}

onMounted(load);
</script>
