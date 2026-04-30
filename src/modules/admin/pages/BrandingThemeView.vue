<!-- /admin/shop/branding/theme — Colores del shop -->

<template>
  <v-container class="mx-auto" style="max-width: 1100px">
    <AppPageHeader
      icon="mdi-palette-outline"
      title="Tema de colores"
      subtitle="Color primary (header, footer, botones) y secondary (acentos). Se aplica al shop público sin redeploy."
      :back-to="{ name: 'shopBranding' }"
    >
      <v-btn variant="tonal" size="small" rounded="lg" prepend-icon="mdi-restore" @click="reset" :disabled="saving">
        Reset
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="saving"
        @click="save"
      >
        Guardar tema
      </v-btn>
    </AppPageHeader>

    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-alert v-if="error" type="error" variant="tonal" rounded="lg" class="mb-3" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <v-row dense>
        <!-- PRIMARY -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3 h-100">
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="font-weight-medium">Color primary</div>
              <span class="text-caption text-medium-emphasis">Ej: #0e2134</span>
            </div>
            <div class="text-caption text-medium-emphasis mb-3">
              Header, footer y botones principales del shop público.
            </div>

            <v-text-field
              v-model="form.primary"
              label="Hex"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-palette"
            />

            <div class="mt-3 theme-picker-wrap">
              <v-color-picker v-model="form.primary" mode="hex" hide-inputs flat />
            </div>
          </v-card>
        </v-col>

        <!-- SECONDARY -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3 h-100">
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="font-weight-medium">Color secondary</div>
              <span class="text-caption text-medium-emphasis">Ej: #3483fa</span>
            </div>
            <div class="text-caption text-medium-emphasis mb-3">
              Acentos, links y estados activos del shop.
            </div>

            <v-text-field
              v-model="form.secondary"
              label="Hex"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-palette"
            />

            <div class="mt-3 theme-picker-wrap">
              <v-color-picker v-model="form.secondary" mode="hex" hide-inputs flat />
            </div>
          </v-card>
        </v-col>

        <!-- PREVIEW -->
        <v-col cols="12">
          <v-card rounded="xl" variant="outlined" class="pa-3">
            <div class="font-weight-medium mb-2">Preview</div>

            <div class="shop-preview-scope">
              <div class="theme-preview" :style="{ background: form.primary, color: '#fff' }">
                <div class="d-flex align-center ga-3 min-w-0">
                  <v-avatar
                    size="40"
                    rounded="lg"
                    :style="{ background: form.secondary, color: '#fff' }"
                  >
                    <v-icon size="20">mdi-storefront-outline</v-icon>
                  </v-avatar>
                  <div class="min-w-0">
                    <div class="font-weight-medium" style="font-size: 15px; letter-spacing: -0.005em;">
                      {{ shopName || "Mi shop" }}
                    </div>
                    <div class="text-caption" style="opacity: 0.78; font-size: 11.5px;">
                      Header / Footer con primary
                    </div>
                  </div>
                </div>

                <div class="d-flex ga-2">
                  <button class="theme-btn-primary" :style="{ background: form.secondary }">Comprar</button>
                  <button class="theme-btn-ghost">Ver más</button>
                </div>
              </div>
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              Al guardar NO se modifica el tema del backoffice; solo el shop público lo toma al recargar.
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="2400">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { getShopThemeAdmin, updateShopThemeAdmin } from "@/modules/shop/service/admin.shopTheme.api";
import { applyRuntimeTheme, normalizeTheme } from "@/modules/shop/utils/runtimeTheme";
import { getShopBranding } from "@/modules/shop/service/admin.shopBranding.api";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const saving = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "" });
const shopName = ref("");

const DEFAULT = { primary: "#0e2134", secondary: "#3483fa" };

const form = ref({ ...DEFAULT });

function normHex(v, fallback) {
  const s = String(v || "").trim();
  if (!s) return fallback;
  const h = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : fallback;
}

function applyPreview() {
  applyRuntimeTheme(normalizeTheme(form.value), { scope: ".shop-preview-scope" });
}

watch(
  () => [form.value.primary, form.value.secondary],
  () => applyPreview(),
  { immediate: true }
);

async function load() {
  error.value = "";
  try {
    const [th, br] = await Promise.all([
      getShopThemeAdmin().catch(() => null),
      getShopBranding().catch(() => null),
    ]);
    if (th) {
      form.value = {
        primary: normHex(th.primary, DEFAULT.primary),
        secondary: normHex(th.secondary, DEFAULT.secondary),
      };
    }
    if (br?.name) shopName.value = br.name;
    applyPreview();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el tema.";
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    const payload = {
      primary: normHex(form.value.primary, DEFAULT.primary),
      secondary: normHex(form.value.secondary, DEFAULT.secondary),
    };
    await updateShopThemeAdmin(payload);
    form.value = { ...payload };
    applyPreview();
    snack.value = { show: true, text: "Tema guardado · impacta al shop público" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar el tema.";
  } finally {
    saving.value = false;
  }
}

function reset() {
  form.value = { ...DEFAULT };
  applyPreview();
  snack.value = { show: true, text: "Preview reseteado · guardá para aplicar" };
}

onMounted(load);
</script>

<style scoped>
.min-w-0 { min-width: 0; }

.h-100 { height: 100%; }

.theme-picker-wrap :deep(.v-color-picker) {
  background: transparent !important;
  box-shadow: none !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
}

.theme-preview {
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  transition: background 0.18s ease;
}

.theme-btn-primary,
.theme-btn-ghost {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.005em;
  font-family: inherit;
}
.theme-btn-primary { color: #fff; }
.theme-btn-ghost {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.32);
}
</style>
