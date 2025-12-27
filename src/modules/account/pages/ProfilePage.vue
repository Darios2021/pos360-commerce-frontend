<template>
  <v-container class="py-6" style="max-width: 980px;">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Perfil</div>
        <div class="text-caption text-medium-emphasis">Cuenta · Foto · Contraseña</div>
      </div>

      <v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save" :loading="saving" @click="saveProfile">
        Guardar
      </v-btn>
    </div>

    <v-row class="ga-4" dense>
      <!-- Avatar -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="88" color="primary" variant="tonal">
              <v-img v-if="avatarPreview || me.avatar_url" :src="avatarPreview || me.avatar_url" cover />
              <span v-else class="font-weight-bold text-h6">{{ initials }}</span>
            </v-avatar>

            <div class="d-flex flex-column">
              <div class="font-weight-bold">{{ fullName || "Usuario" }}</div>
              <div class="text-caption text-medium-emphasis">{{ roleLabel }}</div>
              <div class="text-caption text-medium-emphasis">{{ me.email || me.username || "" }}</div>
            </div>
          </div>

          <v-divider class="my-4" />

          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="d-none"
            @change="onPickFile"
          />

          <div class="d-flex ga-2">
            <v-btn variant="tonal" prepend-icon="mdi-camera" @click="pickFile">
              Cambiar foto
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
        </v-card>
      </v-col>

      <!-- Datos -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-3">Datos personales</div>

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

          <v-divider class="my-4" />

          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div>
              <div class="text-subtitle-1 font-weight-bold">Seguridad</div>
              <div class="text-caption text-medium-emphasis">Actualizá tu contraseña periódicamente.</div>
            </div>

            <v-btn color="primary" variant="tonal" prepend-icon="mdi-lock-reset" @click="pwDialog = true">
              Cambiar contraseña
            </v-btn>
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

        <v-text-field
          v-model="pw.current_password"
          label="Contraseña actual"
          type="password"
          variant="outlined"
          class="mt-2"
        />
        <v-text-field
          v-model="pw.new_password"
          label="Nueva contraseña (mínimo 8)"
          type="password"
          variant="outlined"
        />
        <v-text-field
          v-model="pw.new_password2"
          label="Repetir nueva contraseña"
          type="password"
          variant="outlined"
        />

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

    <!-- feedback -->
    <v-snackbar v-model="snack.open" :color="snack.color" timeout="2500">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
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

const form = reactive({
  first_name: "",
  last_name: "",
});

const saving = ref(false);
const uploading = ref(false);
const pwDialog = ref(false);
const pwLoading = ref(false);
const pwError = ref("");

const pw = reactive({
  current_password: "",
  new_password: "",
  new_password2: "",
});

const snack = reactive({ open: false, text: "", color: "success" });

function toast(text, color = "success") {
  snack.text = text;
  snack.color = color;
  snack.open = true;
}

const fullName = computed(() => {
  const n = [me.first_name, me.last_name].filter(Boolean).join(" ").trim();
  return n || "";
});

const initials = computed(() => {
  const a = (me.first_name || "").trim();
  const b = (me.last_name || "").trim();
  const i1 = a ? a[0].toUpperCase() : "";
  const i2 = b ? b[0].toUpperCase() : "";
  return (i1 + i2) || "U";
});

const roleLabel = computed(() => {
  const roles = Array.isArray(me.roles) ? me.roles : [];
  if (roles.includes("super_admin")) return "Super Admin";
  if (roles.includes("admin")) return "Administrador";
  if (roles.includes("manager")) return "Supervisor";
  if (roles.includes("seller")) return "Vendedor";
  return roles[0] || "Usuario";
});

// Avatar
const fileInput = ref(null);
const avatarFile = ref(null);
const avatarPreview = ref("");
const avatarHint = ref("");

function pickFile() {
  fileInput.value?.click?.();
}

function onPickFile(e) {
  const f = e?.target?.files?.[0];
  if (!f) return;

  if (f.size > 5 * 1024 * 1024) {
    avatarHint.value = "Máximo 5MB.";
    return;
  }

  avatarFile.value = f;
  avatarPreview.value = URL.createObjectURL(f);
  avatarHint.value = `${f.name} (${Math.round(f.size / 1024)} KB)`;
}

async function loadMe() {
  const r = await MeService.getMe();
  Object.assign(me, r.data);
  form.first_name = me.first_name || "";
  form.last_name = me.last_name || "";
}

async function saveProfile() {
  saving.value = true;
  try {
    const r = await MeService.updateMe({
      first_name: form.first_name,
      last_name: form.last_name,
    });
    Object.assign(me, r.data);
    // opcional: refrescar auth.user si lo usás globalmente
    auth.setUser?.(r.data);
    toast("Perfil actualizado");
  } catch (e) {
    toast(e?.message || "No se pudo guardar", "error");
  } finally {
    saving.value = false;
  }
}

async function uploadAvatar() {
  if (!avatarFile.value) return;
  uploading.value = true;
  try {
    const r = await MeService.uploadAvatar(avatarFile.value);
    Object.assign(me, r.data);
    auth.setUser?.(r.data);
    avatarFile.value = null;
    avatarPreview.value = "";
    avatarHint.value = "";
    toast("Foto actualizada");
  } catch (e) {
    toast(e?.message || "No se pudo subir la foto", "error");
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
    await MeService.changePassword({
      current_password: pw.current_password,
      new_password: pw.new_password,
    });
    pw.current_password = "";
    pw.new_password = "";
    pw.new_password2 = "";
    pwDialog.value = false;
    toast("Contraseña actualizada");
  } catch (e) {
    pwError.value = e?.message || "No se pudo cambiar la contraseña.";
  } finally {
    pwLoading.value = false;
  }
}

onMounted(loadMe);
</script>