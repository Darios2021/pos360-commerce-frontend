<!-- src/modules/account/pages/ProfilePage.vue -->
<template>
  <v-container class="py-6" style="max-width: 1100px;">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
      <div>
        <div class="text-h5 font-weight-black">Perfil</div>
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

    <v-alert v-if="pageError" type="error" variant="tonal" class="mb-4" rounded="xl">
      {{ pageError }}
    </v-alert>

    <v-row dense class="ga-4">
      <!-- LEFT: identidad + foto + seguridad -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="prof-card pa-5">
          <!-- Avatar + nombre -->
          <div class="d-flex align-center ga-4">
            <v-avatar size="80" class="prof-avatar">
              <v-img v-if="avatarSrc && !avatarError" :key="avatarKey" :src="avatarSrc" cover @error="avatarError = true" />
              <span v-else class="font-weight-black text-h5">{{ initials }}</span>
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="text-subtitle-1 font-weight-black text-truncate">{{ fullName || "Usuario" }}</div>
              <v-chip size="x-small" color="primary" variant="tonal" class="mt-1">{{ roleLabel }}</v-chip>
              <div class="text-caption text-medium-emphasis mt-1 text-truncate">{{ me.email || me.username || "" }}</div>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Foto -->
          <div class="prof-section-label mb-2">Foto de perfil</div>
          <div class="text-caption text-medium-emphasis mb-3">png · jpg · webp · máx 5 MB</div>

          <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="d-none" @change="onPickFile" />

          <div class="d-flex ga-2">
            <v-btn variant="tonal" prepend-icon="mdi-camera" size="small" @click="pickFile">Elegir</v-btn>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-cloud-upload-outline" size="small"
              :disabled="!avatarFile" :loading="uploading" @click="uploadAvatar">
              Subir
            </v-btn>
          </div>
          <div v-if="avatarHint" class="text-caption text-medium-emphasis mt-2">{{ avatarHint }}</div>

          <v-divider class="my-4" />

          <!-- Seguridad -->
          <div class="prof-section-label mb-1">Seguridad</div>
          <div class="text-caption text-medium-emphasis mb-3">Actualizá tu contraseña.</div>
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-lock-reset" size="small" @click="pwDialog = true">
            Cambiar contraseña
          </v-btn>
        </v-card>
      </v-col>

      <!-- RIGHT: datos -->
      <v-col cols="12" md="8">
        <!-- Datos personales -->
        <v-card rounded="xl" class="prof-card pa-5">
          <div class="prof-section-label mb-1">Datos personales</div>
          <div class="text-caption text-medium-emphasis mb-4">Tu información básica. Nombre y apellido son editables.</div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.first_name" label="Nombre" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.last_name" label="Apellido" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :model-value="me.email" label="Email" variant="outlined" density="comfortable" readonly
                prepend-inner-icon="mdi-email-outline" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :model-value="me.username || '—'" label="Usuario" variant="outlined" density="comfortable"
                readonly prepend-inner-icon="mdi-at" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :model-value="roleLabel" label="Rol" variant="outlined" density="comfortable" readonly
                prepend-inner-icon="mdi-shield-account-outline" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :model-value="me.id ? `#${me.id}` : '—'" label="ID de usuario" variant="outlined"
                density="comfortable" readonly prepend-inner-icon="mdi-identifier" />
            </v-col>
            <v-col v-if="me.phone" cols="12" sm="6">
              <v-text-field :model-value="me.phone" label="Teléfono" variant="outlined" density="comfortable" readonly
                prepend-inner-icon="mdi-phone-outline" />
            </v-col>
            <v-col v-if="me.created_at" cols="12" sm="6">
              <v-text-field :model-value="fmtDate(me.created_at)" label="Miembro desde" variant="outlined"
                density="comfortable" readonly prepend-inner-icon="mdi-calendar-outline" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Sucursales asignadas -->
        <v-card rounded="xl" class="prof-card pa-5 mt-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="prof-section-label">Sucursales asignadas</div>
            <v-chip size="x-small" color="primary" variant="tonal">
              {{ userBranches.length }} sucursal{{ userBranches.length !== 1 ? 'es' : '' }}
            </v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mb-4">
            Tiendas o locales a los que tenés acceso.
          </div>

          <div v-if="loadingMe" class="d-flex justify-center py-4">
            <v-progress-circular indeterminate size="22" color="primary" />
          </div>

          <div v-else-if="!userBranches.length" class="prof-empty">
            <v-icon size="32" color="primary" class="mb-2">mdi-store-off-outline</v-icon>
            <span>Sin sucursales asignadas</span>
          </div>

          <div v-else class="branch-list">
            <div v-for="b in userBranches" :key="b.id" class="branch-row">
              <div class="branch-row__icon">
                <v-icon size="15" color="primary">mdi-store-outline</v-icon>
              </div>
              <div class="branch-row__info">
                <span class="branch-row__name">{{ b.name }}</span>
                <span class="branch-row__id">#{{ b.id }}</span>
              </div>
              <v-chip v-if="b.id === me.branch_id" size="x-small" color="success" variant="tonal" class="ml-auto">
                Principal
              </v-chip>
            </div>
          </div>
        </v-card>

        <!-- Vista previa -->
        <v-card rounded="xl" class="prof-card pa-5 mt-4">
          <div class="prof-section-label mb-1">Vista previa</div>
          <div class="text-caption text-medium-emphasis mb-3">Así se ve tu perfil en el menú.</div>
          <div class="d-flex align-center ga-3">
            <v-avatar size="44" class="prof-avatar-mini">
              <v-img v-if="avatarSrc && !avatarError" :key="avatarKey + '-mini'" :src="avatarSrc" cover @error="avatarError = true" />
              <span v-else class="font-weight-bold text-body-2">{{ initials }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-body-2">{{ fullName || "Usuario" }}</div>
              <div class="text-caption text-medium-emphasis">{{ roleLabel }} · {{ me.email || "" }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog cambiar contraseña -->
    <v-dialog v-model="pwDialog" max-width="480">
      <v-card rounded="xl" class="pa-5">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-subtitle-1 font-weight-black">Cambiar contraseña</div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="pwDialog = false" />
        </div>
        <v-text-field v-model="pw.current_password" label="Contraseña actual" type="password" variant="outlined" density="comfortable" class="mb-2" />
        <v-text-field v-model="pw.new_password" label="Nueva contraseña (mínimo 8)" type="password" variant="outlined" density="comfortable" class="mb-2" />
        <v-text-field v-model="pw.new_password2" label="Repetir nueva contraseña" type="password" variant="outlined" density="comfortable" />
        <v-alert v-if="pwError" type="error" variant="tonal" class="mt-3" rounded="lg">{{ pwError }}</v-alert>
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="pwDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="pwLoading" @click="changePassword">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.open" :color="snack.color" timeout="2600" rounded="xl">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import { MeService } from "@/app/services/me.service";

const auth = useAuthStore();

// ── Estado del usuario ────────────────────────────────────────────────────────
const me = reactive({
  id: null,
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  avatar_url: "",
  roles: [],
  branch_id: null,
  branches: [],
  phone: "",
  created_at: null,
});

const form = reactive({ first_name: "", last_name: "" });

const loadingMe  = ref(false);
const saving     = ref(false);
const uploading  = ref(false);
const pageError  = ref("");

const pwDialog  = ref(false);
const pwLoading = ref(false);
const pwError   = ref("");
const pw        = reactive({ current_password: "", new_password: "", new_password2: "" });

const snack = reactive({ open: false, text: "", color: "success" });
function toast(text, color = "success") { Object.assign(snack, { text, color, open: true }); }

// ── Sucursales normalizadas ───────────────────────────────────────────────────
const userBranches = computed(() => {
  // Usar las del store (ya normalizadas) o las del reactive local
  const fromStore = auth.branches || [];
  if (fromStore.length) return fromStore;

  const raw = me.branches;
  if (!Array.isArray(raw) || !raw.length) return [];

  return raw.map(b => {
    if (typeof b === "object" && b !== null) {
      return { id: Number(b.id || b.branch_id || 0), name: b.name || `Sucursal #${b.id}` };
    }
    const id = Number(b);
    return { id, name: `Sucursal #${id}` };
  }).filter(b => b.id > 0);
});

// ── Nombre, iniciales, rol ────────────────────────────────────────────────────
const fullName = computed(() => [me.first_name, me.last_name].filter(Boolean).join(" ").trim());
const initials = computed(() => {
  const a = (me.first_name || "").trim();
  const b = (me.last_name  || "").trim();
  return ((a ? a[0].toUpperCase() : "") + (b ? b[0].toUpperCase() : "")) || "U";
});

const roleLabel = computed(() => {
  const roles = Array.isArray(me.roles) ? me.roles.map(r => String(r?.name || r || "").toLowerCase()) : [];
  if (roles.some(r => ["super_admin", "superadmin"].includes(r))) return "Super Admin";
  if (roles.includes("admin"))   return "Administrador";
  if (roles.includes("manager")) return "Supervisor";
  if (roles.includes("seller"))  return "Vendedor";
  if (roles.includes("user"))    return "Usuario";
  return roles[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : "Usuario";
});

// ── Avatar ────────────────────────────────────────────────────────────────────
const avatarError  = ref(false);
const avatarBuster = ref(Date.now());

function normalizeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("data:") || s.startsWith("blob:") || s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const s3 = String(import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (s3) return s3 + (s.startsWith("/") ? s : `/${s}`);
  const api = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return api ? api + (s.startsWith("/") ? s : `/${s}`) : s;
}

const avatarSrc = computed(() => {
  const raw = me.avatar_url || auth.user?.avatar_url || auth.user?.avatar || auth.user?.picture || "";
  const base = normalizeUrl(raw);
  if (!base) return "";
  return `${base}${base.includes("?") ? "&" : "?"}v=${avatarBuster.value}`;
});

const avatarKey = computed(() => `${avatarSrc.value}-${avatarBuster.value}`);
watch(avatarSrc, () => { avatarError.value = false; });

// ── File picker ───────────────────────────────────────────────────────────────
const fileInput = ref(null);
const avatarFile = ref(null);
const avatarHint = ref("");

function pickFile() { fileInput.value?.click?.(); }
function onPickFile(e) {
  const f = e?.target?.files?.[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { avatarHint.value = "Máximo 5 MB."; avatarFile.value = null; return; }
  avatarFile.value = f;
  avatarHint.value = `${f.name} (${Math.round(f.size / 1024)} KB)`;
}

// ── Fecha helper ──────────────────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

// ── API ───────────────────────────────────────────────────────────────────────
async function loadMe() {
  pageError.value = "";
  loadingMe.value = true;
  try {
    const r    = await MeService.getMe();
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);
    form.first_name = me.first_name || "";
    form.last_name  = me.last_name  || "";
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
    const r    = await MeService.updateMe({ first_name: form.first_name, last_name: form.last_name });
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
  try {
    const r    = await MeService.uploadAvatar(avatarFile.value);
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);
    auth.setUser?.({ ...(auth.user || {}), ...data });
    avatarBuster.value = Date.now();
    avatarFile.value   = null;
    avatarHint.value   = "";
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
    pwError.value = "Completá todos los campos."; return;
  }
  if (pw.new_password.length < 8) {
    pwError.value = "La nueva contraseña debe tener al menos 8 caracteres."; return;
  }
  if (pw.new_password !== pw.new_password2) {
    pwError.value = "Las contraseñas no coinciden."; return;
  }
  pwLoading.value = true;
  try {
    await MeService.changePassword({ current_password: pw.current_password, new_password: pw.new_password });
    Object.assign(pw, { current_password: "", new_password: "", new_password2: "" });
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
.prof-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.prof-avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  flex-shrink: 0;
}
.prof-avatar-mini {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  flex-shrink: 0;
}
.prof-section-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.prof-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 12.5px;
  font-weight: 600;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}

/* Branch list */
.branch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.branch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.branch-row__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.10);
  flex-shrink: 0;
}
.branch-row__info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.branch-row__name {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}
.branch-row__id {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-weight: 600;
}
</style>
