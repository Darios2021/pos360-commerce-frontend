<!-- src/modules/account/pages/ProfilePage.vue -->
<template>
  <v-container class="py-6" style="max-width: 1100px;">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Perfil</div>
        <div class="text-caption text-medium-emphasis">Cuenta · Foto · Seguridad</div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loadingMe" @click="loadMe">
          Actualizar
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" :loading="saving" @click="saveProfile">
          Guardar
        </v-btn>
      </div>
    </div>

    <v-alert v-if="pageError" type="error" variant="tonal" class="mb-4">
      {{ pageError }}
    </v-alert>

    <v-row dense class="ga-4">
      <!-- LEFT: Card identidad -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-4 prof-card">
          <div class="d-flex align-center ga-3">
            <v-avatar size="92" class="prof-avatar">
              <v-img
                v-if="avatarSrc && !avatarError"
                :key="avatarKey"
                :src="avatarSrc"
                cover
                @error="avatarError = true"
              />
              <span v-else class="font-weight-black text-h5">{{ initials }}</span>
            </v-avatar>

            <div class="flex-grow-1">
              <div class="text-subtitle-1 font-weight-bold">{{ fullName || "Usuario" }}</div>
              <div class="text-caption text-medium-emphasis">{{ roleLabel }}</div>
              <div class="text-caption text-medium-emphasis">{{ me.email || me.username || "" }}</div>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="text-caption text-medium-emphasis mb-2">
            Foto (png/jpg/webp, máx 5MB)
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="d-none"
            @change="onPickFile"
          />

          <div class="d-flex ga-2">
            <v-btn variant="tonal" prepend-icon="mdi-camera" @click="pickFile">
              Elegir
            </v-btn>

            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-cloud-upload-outline"
              :disabled="!avatarFile"
              :loading="uploading"
              @click="uploadAvatar"
            >
              Subir
            </v-btn>
          </div>

          <div v-if="avatarHint" class="text-caption text-medium-emphasis mt-2">
            {{ avatarHint }}
          </div>

          <v-divider class="my-4" />

          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="font-weight-bold">Seguridad</div>
              <div class="text-caption text-medium-emphasis">Actualizá tu contraseña.</div>
            </div>
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-lock-reset" @click="pwDialog = true">
              Cambiar
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- RIGHT: datos -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-4 prof-card">
          <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
            <div>
              <div class="text-subtitle-1 font-weight-bold">Datos personales</div>
              <div class="text-caption text-medium-emphasis">Tu información básica.</div>
            </div>
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.first_name" label="Nombre" variant="outlined" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.last_name" label="Apellido" variant="outlined" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field :model-value="me.email" label="Email" variant="outlined" disabled />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field :model-value="roleLabel" label="Rol" variant="outlined" disabled />
            </v-col>
          </v-row>
        </v-card>

        <v-card rounded="xl" class="pa-4 prof-card mt-4">
          <div class="text-subtitle-1 font-weight-bold mb-2">Vista previa</div>
          <div class="text-caption text-medium-emphasis mb-3">
            Así debería verse tu avatar en el menú.
          </div>

          <div class="d-flex align-center ga-3">
            <v-avatar size="44" class="prof-avatar-mini">
              <v-img
                v-if="avatarSrc && !avatarError"
                :key="avatarKey + '-mini'"
                :src="avatarSrc"
                cover
                @error="avatarError = true"
              />
              <span v-else class="font-weight-bold">{{ initials }}</span>
            </v-avatar>

            <div>
              <div class="font-weight-bold">{{ fullName || "Usuario" }}</div>
              <div class="text-caption text-medium-emphasis">{{ me.email || me.username || "" }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Change password dialog -->
    <v-dialog v-model="pwDialog" max-width="520">
      <v-card rounded="xl" class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-h6 font-weight-bold">Cambiar contraseña</div>
          <v-btn icon="mdi-close" variant="text" @click="pwDialog = false" />
        </div>

        <v-text-field v-model="pw.current_password" label="Contraseña actual" type="password" variant="outlined" class="mt-2" />
        <v-text-field v-model="pw.new_password" label="Nueva contraseña (mínimo 8)" type="password" variant="outlined" />
        <v-text-field v-model="pw.new_password2" label="Repetir nueva contraseña" type="password" variant="outlined" />

        <v-alert v-if="pwError" type="error" variant="tonal" class="mt-2">
          {{ pwError }}
        </v-alert>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="pwDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="pwLoading" @click="changePassword">
            Guardar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.open" :color="snack.color" timeout="2600">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import { MeService } from "@/app/services/me.service";

const auth = useAuthStore();

const me = reactive({
  id: null,
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  avatar_url: "",
  roles: [],
});

const form = reactive({ first_name: "", last_name: "" });

const loadingMe = ref(false);
const saving = ref(false);
const uploading = ref(false);
const pageError = ref("");

const pwDialog = ref(false);
const pwLoading = ref(false);
const pwError = ref("");

const pw = reactive({ current_password: "", new_password: "", new_password2: "" });

const snack = reactive({ open: false, text: "", color: "success" });
function toast(text, color = "success") {
  snack.text = text;
  snack.color = color;
  snack.open = true;
}

// --------------------
// Avatar URL NORMALIZER (igual que AppShell)
// --------------------
const avatarError = ref(false);
const avatarBuster = ref(Date.now());

function normalizeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("data:") || s.startsWith("blob:") || s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;

  const s3 = String(import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (s3) return s3 + (s.startsWith("/") ? s : `/${s}`);

  const api = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (!api) return s;
  return api + (s.startsWith("/") ? s : `/${s}`);
}

const fullName = computed(() => [me.first_name, me.last_name].filter(Boolean).join(" ").trim());
const initials = computed(() => {
  const a = (me.first_name || "").trim();
  const b = (me.last_name || "").trim();
  return ((a ? a[0].toUpperCase() : "") + (b ? b[0].toUpperCase() : "")) || "U";
});

const roleLabel = computed(() => {
  const roles = Array.isArray(me.roles) ? me.roles : [];
  if (roles.includes("super_admin")) return "Super Admin";
  if (roles.includes("admin")) return "Administrador";
  if (roles.includes("manager")) return "Supervisor";
  if (roles.includes("seller")) return "Vendedor";
  return roles[0] || "Usuario";
});

// avatar final con cache-bust
const avatarSrc = computed(() => {
  const raw =
    me.avatar_url ||
    auth.user?.avatar_url ||
    auth.user?.avatar ||
    auth.user?.picture ||
    "";
  const base = normalizeUrl(raw);
  if (!base) return "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${avatarBuster.value}`;
});

const avatarKey = computed(() => `${avatarSrc.value}-${avatarBuster.value}`);

watch(avatarSrc, () => {
  avatarError.value = false;
});

// --------------------
// File picker
// --------------------
const fileInput = ref(null);
const avatarFile = ref(null);
const avatarHint = ref("");

function pickFile() {
  fileInput.value?.click?.();
}

function onPickFile(e) {
  const f = e?.target?.files?.[0];
  if (!f) return;

  if (f.size > 5 * 1024 * 1024) {
    avatarHint.value = "Máximo 5MB.";
    avatarFile.value = null;
    return;
  }

  avatarFile.value = f;
  avatarHint.value = `${f.name} (${Math.round(f.size / 1024)} KB)`;
}

// --------------------
// API
// --------------------
async function loadMe() {
  pageError.value = "";
  loadingMe.value = true;
  try {
    const r = await MeService.getMe();
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);

    form.first_name = me.first_name || "";
    form.last_name = me.last_name || "";

    // sincroniza auth store (sin pisar avatar si viene vacío)
    auth.setUser?.(data);

    avatarBuster.value = Date.now();
  } catch (e) {
    pageError.value = e?.response?.data?.message || e?.message || "No se pudo cargar el perfil";
  } finally {
    loadingMe.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  pageError.value = "";
  try {
    const r = await MeService.updateMe({ first_name: form.first_name, last_name: form.last_name });
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);
    auth.setUser?.(data);
    toast("Perfil actualizado");
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo guardar", "error");
  } finally {
    saving.value = false;
  }
}

async function uploadAvatar() {
  if (!avatarFile.value) return;
  uploading.value = true;
  pageError.value = "";
  try {
    const r = await MeService.uploadAvatar(avatarFile.value);

    // soporta {data:{...}} o {...}
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);

    // IMPORTANTÍSIMO: guardar en auth store para que el menú lo vea
    auth.setUser?.(data);

    // cache-bust + reset file
    avatarBuster.value = Date.now();
    avatarFile.value = null;
    avatarHint.value = "";
    toast("Foto actualizada");
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo subir la foto", "error");
  } finally {
    uploading.value = false;
  }
}

async function changePassword() {
  pwError.value = "";

  if (!pw.current_password || !pw.new_password || !pw.new_password2) {
    pwError.value = "Completá todos los campos.";
    return;
  }
  if (pw.new_password.length < 8) {
    pwError.value = "La nueva contraseña debe tener al menos 8 caracteres.";
    return;
  }
  if (pw.new_password !== pw.new_password2) {
    pwError.value = "Las contraseñas no coinciden.";
    return;
  }

  pwLoading.value = true;
  try {
    await MeService.changePassword({ current_password: pw.current_password, new_password: pw.new_password });
    pw.current_password = "";
    pw.new_password = "";
    pw.new_password2 = "";
    pwDialog.value = false;
    toast("Contraseña actualizada");
  } catch (e) {
    pwError.value = e?.response?.data?.message || e?.message || "No se pudo cambiar la contraseña.";
  } finally {
    pwLoading.value = false;
  }
}

onMounted(loadMe);
</script>

<style scoped>
.prof-card{
  border: 1px solid rgba(255,255,255,.06);
  box-shadow: 0 18px 40px rgba(0,0,0,.25);
}
.prof-avatar{
  border: 2px solid rgba(255,255,255,.12);
}
.prof-avatar-mini{
  border: 1px solid rgba(255,255,255,.12);
}
</style>
