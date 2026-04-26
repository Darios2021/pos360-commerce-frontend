<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/admin/pages/ShopBrandingView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px">
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
            Guardar nombre
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- ====================== BRANDING ====================== -->
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
              <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" @click="pickLogo" :loading="uploadingLogo">
                Subir logo
              </v-btn>
            </div>

            <div class="mt-3 d-flex align-center ga-3">
              <v-avatar size="56" rounded="lg" color="white" class="elevation-1">
                <v-img v-if="branding.logo_url" :src="abs(branding.logo_url)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>
              <div class="text-caption text-medium-emphasis" style="word-break: break-all">
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
              <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" @click="pickFavicon" :loading="uploadingFav">
                Subir favicon
              </v-btn>
            </div>

            <div class="mt-3 d-flex align-center ga-3">
              <v-avatar size="40" rounded="lg" color="white" class="elevation-1">
                <v-img v-if="branding.favicon_url" :src="abs(branding.favicon_url)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>
              <div class="text-caption text-medium-emphasis" style="word-break: break-all">
                {{ branding.favicon_url || "Sin favicon cargado" }}
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              Recomendado: 48x48 o 64x64 (PNG/ICO).
            </div>

            <input ref="favInput" type="file" accept="image/*,.ico" class="d-none" @change="onFavFile" />
          </v-card>
        </v-col>

        <!-- OG Image -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="font-weight-bold">OG Image (preview WhatsApp)</div>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" @click="pickOg" :loading="uploadingOg">
                Subir OG
              </v-btn>
            </div>

            <div class="mt-3 d-flex align-center ga-3">
              <v-avatar size="56" rounded="lg" color="white" class="elevation-1">
                <v-img v-if="branding.og_image_url" :src="abs(branding.og_image_url)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>

              <div class="text-caption text-medium-emphasis" style="word-break: break-all">
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

      <v-divider class="my-6" />

      <!-- ====================== THEME ====================== -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
        <div>
          <div class="text-h6 font-weight-bold">Tema</div>
          <div class="text-caption text-medium-emphasis">
            Definí los colores principales. Se aplican al Shop (header/footer/botones) sin redeploy.
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-restore" @click="resetTheme" :disabled="savingTheme">
            Reset
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="saveTheme" :loading="savingTheme">
            Guardar tema
          </v-btn>
        </div>
      </div>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="font-weight-bold">Primary</div>
              <div class="text-caption text-medium-emphasis">Ej: #0e2134</div>
            </div>

            <div class="mt-3 d-flex flex-wrap ga-2 align-center">
              <v-text-field
                v-model="themeForm.primary"
                label="Color primary"
                variant="outlined"
                density="comfortable"
                style="max-width: 240px"
                hide-details
              />
              <v-chip size="small" variant="tonal">Header / Footer / Botones</v-chip>
            </div>

            <div class="mt-3">
              <v-color-picker v-model="themeForm.primary" mode="hex" hide-inputs elevation="0" />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="font-weight-bold">Secondary</div>
              <div class="text-caption text-medium-emphasis">Ej: #3483fa</div>
            </div>

            <div class="mt-3 d-flex flex-wrap ga-2 align-center">
              <v-text-field
                v-model="themeForm.secondary"
                label="Color secondary"
                variant="outlined"
                density="comfortable"
                style="max-width: 240px"
                hide-details
              />
              <v-chip size="small" variant="tonal">Accentos / Links</v-chip>
            </div>

            <div class="mt-3">
              <v-color-picker v-model="themeForm.secondary" mode="hex" hide-inputs elevation="0" />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card rounded="xl" variant="outlined" class="pa-3">
            <div class="font-weight-bold mb-2">Preview</div>

            <!-- ✅ SCOPE SOLO PARA EL PREVIEW -->
            <div class="shop-preview-scope">
              <v-sheet rounded="xl" class="pa-4" :style="previewStyle">
                <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                  <div class="d-flex align-center ga-2">
                    <v-avatar size="40" :style="{ background: themeForm.secondary }">
                      <v-icon>mdi-storefront</v-icon>
                    </v-avatar>
                    <div>
                      <div class="font-weight-black">San Juan Tecnología</div>
                      <div class="text-caption" style="opacity: 0.85">Header / Footer con Primary</div>
                    </div>
                  </div>

                  <div class="d-flex align-center ga-2">
                    <v-btn variant="flat" color="primary">Primary</v-btn>
                    <v-btn variant="tonal" color="secondary">Secondary</v-btn>
                  </div>
                </div>
              </v-sheet>
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              Al guardar NO pisamos el tema del backoffice; solo el Shop público tomará el cambio al entrar/recargar.
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- ====================== UBICACIÓN Y CONTACTO ====================== -->
      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
        <div>
          <div class="text-subtitle-1 font-weight-bold">Ubicación y contacto</div>
          <div class="text-caption text-medium-emphasis">
            Datos del local que aparecen en el pie de cada email del CRM (dirección, mapa, horarios, teléfonos).
          </div>
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save"
               @click="saveContactBlock" :loading="savingContact">
          Guardar contacto
        </v-btn>
      </div>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contactForm.address" label="Dirección del local"
            variant="outlined" density="comfortable" hide-details
            placeholder="Av. Siempreviva 742, San Juan"
            prepend-inner-icon="mdi-map-marker-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contactForm.maps_url" label="URL de Google Maps"
            variant="outlined" density="comfortable" hide-details
            placeholder="https://maps.google.com/?q=..."
            prepend-inner-icon="mdi-google-maps"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contactForm.phone_display" label="Teléfono de contacto"
            variant="outlined" density="comfortable" hide-details
            placeholder="+54 264 1234-567"
            prepend-inner-icon="mdi-phone-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contactForm.whatsapp_display" label="WhatsApp visible"
            variant="outlined" density="comfortable" hide-details
            placeholder="+54 9 264 1234-567"
            prepend-inner-icon="mdi-whatsapp"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contactForm.business_hours" label="Horario de atención"
            variant="outlined" density="comfortable" hide-details
            placeholder="Lun a Sáb · 9 a 19hs"
            prepend-inner-icon="mdi-clock-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contactForm.tagline" label="Slogan / tagline (header del email)"
            variant="outlined" density="comfortable" hide-details
            placeholder="Tecnología de confianza desde 2010"
            prepend-inner-icon="mdi-format-quote-open-outline"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="contactForm.footer_note" label="Nota legal del pie del email (opcional)"
            variant="outlined" density="comfortable" hide-details rows="2" auto-grow
            placeholder="Recibís este correo porque sos cliente de San Juan Tecnología. Si querés dejar de recibirlos, respondé con 'BAJA'."
          />
        </v-col>
      </v-row>

      <!-- ====================== ÍCONOS DE REDES SOCIALES ====================== -->
      <v-divider class="my-5" />

      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
        <div>
          <div class="text-subtitle-1 font-weight-bold">Íconos de redes sociales (CRM email)</div>
          <div class="text-caption text-medium-emphasis">
            Subí PNG/JPG por red social. Si no subís ninguno, los emails usan iniciales coloreadas como fallback.
            Recomendado: PNG cuadrado de 64×64 o 128×128 px con fondo transparente.
          </div>
        </div>
        <v-btn variant="text" size="small" prepend-icon="mdi-refresh" :loading="loadingSocialIcons" @click="loadSocialIcons">
          Recargar íconos
        </v-btn>
      </div>

      <v-row dense>
        <v-col
          v-for="kind in socialKinds"
          :key="kind"
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="font-weight-bold text-capitalize">{{ socialKindLabel(kind) }}</div>
                <div class="text-caption text-medium-emphasis">{{ socialIconUrl(kind) ? 'Configurado' : 'Sin ícono' }}</div>
              </div>
              <v-avatar size="48" rounded="lg" :color="socialIconUrl(kind) ? 'white' : socialFallbackColor(kind)" class="elevation-1">
                <v-img v-if="socialIconUrl(kind)" :src="socialIconUrl(kind)" cover />
                <span v-else class="text-white font-weight-bold" style="font-size: 13px;">
                  {{ socialFallbackInitial(kind) }}
                </span>
              </v-avatar>
            </div>
            <div class="d-flex ga-2">
              <v-btn
                size="x-small"
                color="primary"
                variant="flat"
                prepend-icon="mdi-upload"
                :loading="uploadingSocial[kind]"
                @click="pickSocialIcon(kind)"
              >
                Subir
              </v-btn>
              <v-btn
                v-if="socialIconUrl(kind)"
                size="x-small"
                color="error"
                variant="text"
                prepend-icon="mdi-delete-outline"
                :loading="deletingSocial[kind]"
                @click="onDeleteSocialIcon(kind)"
              >
                Quitar
              </v-btn>
            </div>
            <input
              :ref="(el) => (socialFileRefs[kind] = el)"
              type="file"
              accept="image/*"
              class="d-none"
              @change="(e) => onSocialFile(kind, e)"
            />
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
import { ref, onMounted, computed, watch } from "vue";
import {
  getShopBranding,
  updateShopBranding,
  uploadShopLogo,
  uploadShopFavicon,
  uploadShopOgImage,
  listSocialIcons,
  uploadSocialIcon,
  deleteSocialIcon,
} from "@/modules/shop/service/admin.shopBranding.api";

import { getShopThemeAdmin, updateShopThemeAdmin } from "@/modules/shop/service/admin.shopTheme.api";

// ✅ ahora applyRuntimeTheme soporta scope
import { applyRuntimeTheme, normalizeTheme } from "@/modules/shop/utils/runtimeTheme";

const loading = ref(false);
const saving = ref(false);
const savingTheme = ref(false);
const savingContact = ref(false);
const uploadingLogo = ref(false);
const uploadingFav = ref(false);
const uploadingOg = ref(false);
const error = ref("");

// Datos extendidos del shop_branding usados por el layout de email del CRM.
// Se guardan en la misma fila id=1 vía PUT /admin/shop/branding.
const contactForm = ref({
  address: "",
  maps_url: "",
  phone_display: "",
  whatsapp_display: "",
  business_hours: "",
  tagline: "",
  footer_note: "",
});

const branding = ref({
  name: "San Juan Tecnología",
  logo_url: "",
  favicon_url: "",
  og_image_url: "",
  updated_at: null,
});

const form = ref({ name: "San Juan Tecnología" });
const snack = ref({ show: false, text: "" });

// THEME
const theme = ref({
  primary: "#0e2134",
  secondary: "#3483fa",
});
const themeForm = ref({
  primary: "#0e2134",
  secondary: "#3483fa",
});

const previewStyle = computed(() => ({
  background: themeForm.value.primary,
  color: "#fff",
}));

function normHex(v, fallback) {
  const s = String(v || "").trim();
  if (!s) return fallback;
  const h = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : fallback;
}

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

function applyPreviewThemeNow() {
  // ✅ SOLO preview, no backoffice global
  applyRuntimeTheme(normalizeTheme(themeForm.value), { scope: ".shop-preview-scope" });
}

// ✅ cada vez que cambian los inputs, actualizamos preview
watch(
  () => [themeForm.value.primary, themeForm.value.secondary],
  () => applyPreviewThemeNow(),
  { immediate: true }
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const it = await getShopBranding();
    if (it) {
      branding.value = { ...branding.value, ...it };
      form.value.name = branding.value.name || "San Juan Tecnología";
      // Hidratar campos de contacto/ubicación para el form correspondiente.
      contactForm.value = {
        address: it.address || "",
        maps_url: it.maps_url || "",
        phone_display: it.phone_display || "",
        whatsapp_display: it.whatsapp_display || "",
        business_hours: it.business_hours || "",
        tagline: it.tagline || "",
        footer_note: it.footer_note || "",
      };
    }

    const th = await getShopThemeAdmin();
    if (th) {
      theme.value = {
        primary: normHex(th.primary, "#0e2134"),
        secondary: normHex(th.secondary, "#3483fa"),
      };
      themeForm.value = { ...theme.value };
      applyPreviewThemeNow();
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar la configuración.";
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
    snack.value = { show: true, text: "Nombre guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

// Guarda el bloque "Ubicación y contacto" (campos extendidos de shop_branding).
async function saveContactBlock() {
  savingContact.value = true;
  error.value = "";
  try {
    const it = await updateShopBranding({ ...contactForm.value });
    if (it) branding.value = { ...branding.value, ...it };
    snack.value = { show: true, text: "Datos de contacto guardados" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar el bloque de contacto.";
  } finally {
    savingContact.value = false;
  }
}

async function saveTheme() {
  savingTheme.value = true;
  error.value = "";
  try {
    const payload = {
      primary: normHex(themeForm.value.primary, "#0e2134"),
      secondary: normHex(themeForm.value.secondary, "#3483fa"),
    };

    await updateShopThemeAdmin(payload);

    theme.value = { ...payload };
    themeForm.value = { ...payload };

    // ✅ preview solo
    applyPreviewThemeNow();

    snack.value = { show: true, text: "Tema guardado OK (impacta al Shop público)" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar el tema.";
  } finally {
    savingTheme.value = false;
  }
}

function resetTheme() {
  themeForm.value = { primary: "#0e2134", secondary: "#3483fa" };
  applyPreviewThemeNow();
  snack.value = { show: true, text: "Preview reseteado (guardá para aplicar)" };
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

// ════════════════════════════════════════════════════════════════
// ÍCONOS DE REDES SOCIALES
// ════════════════════════════════════════════════════════════════
const socialKinds = ref([
  "instagram", "facebook", "whatsapp",
  "twitter", "x", "tiktok", "youtube",
  "linkedin", "telegram", "spotify", "github",
  "email", "website",
]);
const socialItems = ref([]); // [{ kind, url, label }]
const loadingSocialIcons = ref(false);
const uploadingSocial = ref({});
const deletingSocial = ref({});
const socialFileRefs = {};

// Mapeo visual para los placeholders cuando no hay ícono custom.
const SOCIAL_FALLBACK = {
  instagram: { initial: "IG", color: "#E4405F" },
  facebook:  { initial: "f",  color: "#1877F2" },
  whatsapp:  { initial: "WA", color: "#25D366" },
  twitter:   { initial: "X",  color: "#000000" },
  x:         { initial: "X",  color: "#000000" },
  tiktok:    { initial: "TT", color: "#000000" },
  youtube:   { initial: "YT", color: "#FF0000" },
  linkedin:  { initial: "in", color: "#0A66C2" },
  telegram:  { initial: "TG", color: "#26A5E4" },
  spotify:   { initial: "♫",  color: "#1DB954" },
  github:    { initial: "Gh", color: "#181717" },
  email:     { initial: "@",  color: "#EA4335" },
  website:   { initial: "W",  color: "#1f2937" },
};

const SOCIAL_LABELS = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp",
  twitter: "Twitter", x: "X", tiktok: "TikTok", youtube: "YouTube",
  linkedin: "LinkedIn", telegram: "Telegram", spotify: "Spotify",
  github: "GitHub", email: "Email", website: "Sitio web",
};

function socialKindLabel(kind) {
  return SOCIAL_LABELS[kind] || kind;
}
function socialFallbackInitial(kind) {
  return SOCIAL_FALLBACK[kind]?.initial || kind.slice(0, 2).toUpperCase();
}
function socialFallbackColor(kind) {
  return SOCIAL_FALLBACK[kind]?.color || "#6b7280";
}
function socialIconUrl(kind) {
  return socialItems.value.find((it) => it.kind === kind)?.url || "";
}

async function loadSocialIcons() {
  loadingSocialIcons.value = true;
  try {
    const res = await listSocialIcons();
    socialItems.value = res.items || [];
    if (Array.isArray(res.knownKinds) && res.knownKinds.length) {
      socialKinds.value = res.knownKinds;
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar los íconos sociales.";
  } finally {
    loadingSocialIcons.value = false;
  }
}

function pickSocialIcon(kind) {
  socialFileRefs[kind]?.click?.();
}

async function onSocialFile(kind, ev) {
  const file = ev?.target?.files?.[0];
  if (!file) return;
  uploadingSocial.value = { ...uploadingSocial.value, [kind]: true };
  try {
    const item = await uploadSocialIcon(kind, file);
    if (item) {
      const idx = socialItems.value.findIndex((x) => x.kind === kind);
      if (idx >= 0) socialItems.value.splice(idx, 1, item);
      else socialItems.value.push(item);
      snack.value = { show: true, text: `Ícono de ${socialKindLabel(kind)} actualizado.` };
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo subir el ícono.";
  } finally {
    uploadingSocial.value = { ...uploadingSocial.value, [kind]: false };
    if (ev?.target) ev.target.value = "";
  }
}

async function onDeleteSocialIcon(kind) {
  if (!window.confirm(`¿Quitar el ícono custom de ${socialKindLabel(kind)}? Volverá a usarse el estilo por defecto.`)) return;
  deletingSocial.value = { ...deletingSocial.value, [kind]: true };
  try {
    await deleteSocialIcon(kind);
    socialItems.value = socialItems.value.filter((x) => x.kind !== kind);
    snack.value = { show: true, text: `Ícono de ${socialKindLabel(kind)} quitado.` };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo eliminar el ícono.";
  } finally {
    deletingSocial.value = { ...deletingSocial.value, [kind]: false };
  }
}

onMounted(async () => {
  await load();
  await loadSocialIcons();
});
</script>