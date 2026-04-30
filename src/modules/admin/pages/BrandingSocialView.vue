<!-- /admin/shop/branding/social — Íconos custom de redes sociales para emails CRM -->

<template>
  <v-container class="mx-auto" style="max-width: 1100px">
    <AppPageHeader
      icon="mdi-share-variant-outline"
      title="Íconos de redes sociales"
      subtitle="Subí PNG cuadrado por red social (recomendado 64×64 o 128×128 con fondo transparente). Si no subís ninguno, los emails usan iniciales coloreadas como fallback."
      :back-to="{ name: 'shopBranding' }"
    >
      <v-btn variant="text" size="small" prepend-icon="mdi-refresh" :loading="loadingSocialIcons" @click="loadSocialIcons">
        Recargar
      </v-btn>
    </AppPageHeader>

    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-alert v-if="error" type="error" variant="tonal" rounded="lg" class="mb-3" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <v-row dense>
        <v-col v-for="kind in socialKinds" :key="kind" cols="12" sm="6" md="4" lg="3">
          <v-card rounded="xl" variant="tonal" class="pa-3 h-100">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="font-weight-medium" style="font-size: 13.5px; letter-spacing: -0.005em;">
                  {{ kindLabel(kind) }}
                </div>
                <div class="text-caption text-medium-emphasis" style="font-size: 11px;">
                  {{ iconUrl(kind) ? "Configurado" : "Sin ícono" }}
                </div>
              </div>
              <v-avatar
                size="48"
                rounded="lg"
                :color="iconUrl(kind) ? 'surface' : 'transparent'"
                class="elevation-1"
                :style="!iconUrl(kind) ? { background: fallbackColor(kind) } : {}"
              >
                <v-img v-if="iconUrl(kind)" :src="iconUrl(kind)" cover />
                <span v-else class="text-white font-weight-bold" style="font-size: 13px;">
                  {{ fallbackInitial(kind) }}
                </span>
              </v-avatar>
            </div>

            <div class="d-flex ga-2">
              <v-btn
                size="x-small"
                color="primary"
                variant="flat"
                rounded="lg"
                prepend-icon="mdi-upload"
                :loading="uploadingSocial[kind]"
                @click="pickSocialIcon(kind)"
              >
                Subir
              </v-btn>
              <v-btn
                v-if="iconUrl(kind)"
                size="x-small"
                color="error"
                variant="text"
                rounded="lg"
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

    <v-snackbar v-model="snack.show" :timeout="2400">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from "vue";
import {
  listSocialIcons,
  uploadSocialIcon,
  deleteSocialIcon,
} from "@/modules/shop/service/admin.shopBranding.api";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const error = ref("");
const snack = ref({ show: false, text: "" });

const socialKinds = ref([
  "instagram", "facebook", "whatsapp",
  "twitter", "x", "tiktok", "youtube",
  "linkedin", "telegram", "spotify", "github",
  "email", "website",
]);
const socialItems = ref([]);
const loadingSocialIcons = ref(false);
const uploadingSocial = ref({});
const deletingSocial = ref({});
const socialFileRefs = {};

const FALLBACK = {
  instagram: { initial: "IG", color: "#E4405F" },
  facebook: { initial: "f", color: "#1877F2" },
  whatsapp: { initial: "WA", color: "#25D366" },
  twitter: { initial: "X", color: "#000000" },
  x: { initial: "X", color: "#000000" },
  tiktok: { initial: "TT", color: "#000000" },
  youtube: { initial: "YT", color: "#FF0000" },
  linkedin: { initial: "in", color: "#0A66C2" },
  telegram: { initial: "TG", color: "#26A5E4" },
  spotify: { initial: "♫", color: "#1DB954" },
  github: { initial: "Gh", color: "#181717" },
  email: { initial: "@", color: "#EA4335" },
  website: { initial: "W", color: "#1f2937" },
};

const LABELS = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp",
  twitter: "Twitter", x: "X", tiktok: "TikTok", youtube: "YouTube",
  linkedin: "LinkedIn", telegram: "Telegram", spotify: "Spotify",
  github: "GitHub", email: "Email", website: "Sitio web",
};

const kindLabel = (k) => LABELS[k] || k;
const fallbackInitial = (k) => FALLBACK[k]?.initial || k.slice(0, 2).toUpperCase();
const fallbackColor = (k) => FALLBACK[k]?.color || "#6b7280";
const iconUrl = (k) => socialItems.value.find((i) => i.kind === k)?.url || "";

async function loadSocialIcons() {
  loadingSocialIcons.value = true;
  error.value = "";
  try {
    const res = await listSocialIcons();
    socialItems.value = res.items || [];
    if (Array.isArray(res.knownKinds) && res.knownKinds.length) {
      socialKinds.value = res.knownKinds;
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar los íconos.";
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
      snack.value = { show: true, text: `${kindLabel(kind)} actualizado` };
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo subir el ícono.";
  } finally {
    uploadingSocial.value = { ...uploadingSocial.value, [kind]: false };
    if (ev?.target) ev.target.value = "";
  }
}

async function onDeleteSocialIcon(kind) {
  if (!window.confirm(`¿Quitar el ícono de ${kindLabel(kind)}?`)) return;
  deletingSocial.value = { ...deletingSocial.value, [kind]: true };
  try {
    await deleteSocialIcon(kind);
    socialItems.value = socialItems.value.filter((x) => x.kind !== kind);
    snack.value = { show: true, text: `${kindLabel(kind)} quitado` };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo eliminar.";
  } finally {
    deletingSocial.value = { ...deletingSocial.value, [kind]: false };
  }
}

onMounted(loadSocialIcons);
</script>

<style scoped>
.h-100 { height: 100%; }
</style>
