<!-- src/modules/account/pages/ProfilePage.vue -->
<template>
  <div class="prof-page">

    <!-- ── Hero header ──────────────────────────────────────────────── -->
    <div class="prof-hero">
      <div class="prof-hero__inner">
        <div class="prof-hero__left">
          <div class="prof-hero__avatar-wrap">
            <v-avatar size="72" class="prof-hero__avatar">
              <v-img v-if="avatarSrc && !avatarError" :key="avatarKey" :src="avatarSrc" cover @error="avatarError = true" />
              <span v-else class="font-weight-black text-h5">{{ initials }}</span>
            </v-avatar>
            <button class="prof-hero__avatar-edit" title="Cambiar foto" @click="pickFile">
              <v-icon size="14">mdi-camera</v-icon>
            </button>
          </div>
          <div>
            <div class="prof-hero__name">{{ fullName || "Usuario" }}</div>
            <div class="prof-hero__meta">
              <span class="prof-role-badge">{{ roleLabel }}</span>
              <span class="prof-hero__email">{{ me.email }}</span>
            </div>
          </div>
        </div>
        <div class="prof-hero__actions">
          <v-btn variant="tonal" size="small" prepend-icon="mdi-refresh" :loading="loadingMe" @click="loadMe">
            Actualizar
          </v-btn>
          <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-content-save" :loading="saving" @click="saveProfile">
            Guardar cambios
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ── Alerts ───────────────────────────────────────────────────── -->
    <div class="prof-body">
      <v-alert v-if="pageError" type="error" variant="tonal" rounded="xl" class="mb-5" density="compact">
        {{ pageError }}
      </v-alert>

      <!-- ── Grid principal ─────────────────────────────────────────── -->
      <div class="prof-grid">

        <!-- Datos personales (editable) -->
        <div class="prof-section">
          <div class="prof-section__header">
            <div class="prof-section__title">Datos personales</div>
            <div class="prof-section__sub">Nombre y apellido son editables</div>
          </div>
          <div class="prof-section__body">
            <div class="prof-field-row">
              <div class="prof-field">
                <label class="prof-label">Nombre</label>
                <v-text-field v-model="form.first_name" variant="outlined" density="compact" hide-details />
              </div>
              <div class="prof-field">
                <label class="prof-label">Apellido</label>
                <v-text-field v-model="form.last_name" variant="outlined" density="compact" hide-details />
              </div>
            </div>
          </div>
        </div>

        <!-- Información de cuenta (readonly) -->
        <div class="prof-section">
          <div class="prof-section__header">
            <div class="prof-section__title">Cuenta</div>
            <div class="prof-section__sub">Información del sistema</div>
          </div>
          <div class="prof-section__body">
            <div class="prof-info-list">
              <div class="prof-info-row">
                <span class="prof-info-label"><v-icon size="13" class="mr-1">mdi-email-outline</v-icon>Email</span>
                <span class="prof-info-value">{{ me.email || "—" }}</span>
              </div>
              <div class="prof-info-row">
                <span class="prof-info-label"><v-icon size="13" class="mr-1">mdi-at</v-icon>Usuario</span>
                <span class="prof-info-value">{{ me.username || "—" }}</span>
              </div>
              <div class="prof-info-row">
                <span class="prof-info-label"><v-icon size="13" class="mr-1">mdi-shield-account-outline</v-icon>Rol</span>
                <span class="prof-role-badge">{{ roleLabel }}</span>
              </div>
              <div class="prof-info-row">
                <span class="prof-info-label"><v-icon size="13" class="mr-1">mdi-identifier</v-icon>ID</span>
                <span class="prof-info-value prof-info-value--mono">#{{ me.id || "—" }}</span>
              </div>
              <div v-if="me.created_at" class="prof-info-row">
                <span class="prof-info-label"><v-icon size="13" class="mr-1">mdi-calendar-outline</v-icon>Miembro desde</span>
                <span class="prof-info-value">{{ fmtDate(me.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Foto de perfil -->
        <div class="prof-section">
          <div class="prof-section__header">
            <div class="prof-section__title">Foto de perfil</div>
            <div class="prof-section__sub">png · jpg · webp · máx 5 MB</div>
          </div>
          <div class="prof-section__body">
            <div class="prof-avatar-row">
              <v-avatar size="56" class="prof-avatar-sm">
                <v-img v-if="avatarSrc && !avatarError" :key="avatarKey + 'sm'" :src="avatarSrc" cover @error="avatarError = true" />
                <span v-else class="font-weight-bold">{{ initials }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div v-if="avatarHint" class="prof-info-value mb-2">{{ avatarHint }}</div>
                <div class="d-flex gap-2">
                  <v-btn variant="tonal" size="small" prepend-icon="mdi-camera" @click="pickFile">Elegir</v-btn>
                  <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-cloud-upload-outline"
                    :disabled="!avatarFile" :loading="uploading" @click="uploadAvatar">
                    Subir
                  </v-btn>
                </div>
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="d-none" @change="onPickFile" />
          </div>
        </div>

        <!-- Sucursales -->
        <div class="prof-section">
          <div class="prof-section__header">
            <div class="prof-section__title">Sucursales asignadas</div>
            <div class="prof-section__sub">{{ userBranches.length }} sucursal{{ userBranches.length !== 1 ? 'es' : '' }}</div>
          </div>
          <div class="prof-section__body">
            <div v-if="loadingMe" class="d-flex justify-center py-3">
              <v-progress-circular indeterminate size="20" color="primary" />
            </div>
            <div v-else-if="!userBranches.length" class="prof-empty">
              Sin sucursales asignadas
            </div>
            <div v-else class="prof-branch-list">
              <div v-for="b in userBranches" :key="b.id" class="prof-branch-row">
                <div class="prof-branch-icon">
                  <v-icon size="13" color="primary">mdi-store-outline</v-icon>
                </div>
                <span class="prof-branch-name">{{ b.name }}</span>
                <span class="prof-branch-id">#{{ b.id }}</span>
                <v-chip v-if="b.id === me.branch_id" size="x-small" color="success" variant="tonal" class="ml-auto">
                  Principal
                </v-chip>
              </div>
            </div>
          </div>
        </div>

        <!-- ════════════ FIRMA CRM EMAIL (full width) ════════════ -->
        <div class="prof-section prof-section--full">
          <div class="prof-section__header">
            <div>
              <div class="prof-section__title">
                <v-icon size="14" class="me-1">mdi-draw-pen</v-icon>
                Firma para emails del CRM
              </div>
              <div class="prof-section__sub">
                Tu firma personal aparece al pie de los emails que envíes desde el módulo de clientes.
              </div>
            </div>
            <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-content-save"
                   :loading="savingSig" @click="saveSignature">
              Guardar firma
            </v-btn>
          </div>

          <div class="prof-section__body">
            <v-alert v-if="sigError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ sigError }}
            </v-alert>

            <div class="prof-sig-grid">
              <!-- Form -->
              <div class="prof-sig-form">
                <div class="prof-sig-photo-row">
                  <v-avatar size="64" rounded="lg" class="elevation-1">
                    <v-img v-if="sigForm.photo_url" :src="sigForm.photo_url" cover />
                    <v-icon v-else size="32">mdi-account-outline</v-icon>
                  </v-avatar>
                  <div>
                    <div class="d-flex ga-2 mb-1">
                      <v-btn size="small" variant="tonal" prepend-icon="mdi-upload"
                             :loading="uploadingSigPhoto" @click="pickSigPhoto">
                        Subir foto
                      </v-btn>
                      <v-btn v-if="sigForm.photo_url" size="small" variant="text" color="error"
                             prepend-icon="mdi-delete-outline" :loading="deletingSigPhoto"
                             @click="removeSigPhoto">
                        Quitar
                      </v-btn>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Recomendado: foto cuadrada (mínimo 200×200 px).
                    </div>
                    <input ref="sigPhotoInput" type="file" accept="image/*" class="d-none" @change="onSigPhotoFile" />
                  </div>
                </div>

                <div class="prof-field-row">
                  <div class="prof-field">
                    <label class="prof-label">Nombre a mostrar</label>
                    <v-text-field v-model="sigForm.display_name" variant="outlined" density="compact" hide-details
                                  placeholder="Ej: Dario Pérez" />
                  </div>
                  <div class="prof-field">
                    <label class="prof-label">Cargo / rol</label>
                    <v-text-field v-model="sigForm.role_title" variant="outlined" density="compact" hide-details
                                  placeholder="Ej: Asesor comercial" />
                  </div>
                </div>

                <div class="prof-field mt-3">
                  <label class="prof-label">Frase / tagline (opcional)</label>
                  <v-text-field v-model="sigForm.tagline" variant="outlined" density="compact" hide-details
                                placeholder="Ej: Disponible de lun a sáb para asesorarte" />
                </div>

                <div class="prof-field-row mt-3">
                  <div class="prof-field">
                    <label class="prof-label">Email de contacto</label>
                    <v-text-field v-model="sigForm.email" type="email"
                                  variant="outlined" density="compact" hide-details
                                  placeholder="dario@ejemplo.com" />
                  </div>
                  <div class="prof-field">
                    <label class="prof-label">Teléfono</label>
                    <v-text-field v-model="sigForm.phone" variant="outlined" density="compact" hide-details
                                  placeholder="+54 11 1234-5678" />
                  </div>
                </div>

                <div class="prof-field mt-3">
                  <label class="prof-label">WhatsApp (solo dígitos)</label>
                  <v-text-field v-model="sigForm.whatsapp" variant="outlined" density="compact" hide-details
                                placeholder="5491112345678" />
                  <div class="text-caption text-medium-emphasis mt-1">
                    Se usa para armar el link <code>wa.me/&lt;número&gt;</code>.
                  </div>
                </div>

                <v-switch v-model="sigForm.include_by_default" color="primary" density="compact" hide-details class="mt-3"
                          :label="sigForm.include_by_default
                            ? 'Incluir mi firma por defecto en cada envío'
                            : 'No incluir por defecto (la activo manualmente al enviar)'" />
              </div>

              <!-- Preview -->
              <div class="prof-sig-preview-wrap">
                <div class="text-caption font-weight-bold text-medium-emphasis mb-2"
                     style="letter-spacing: 0.06em; text-transform: uppercase;">
                  Vista previa en el email
                </div>
                <div class="prof-sig-preview">
                  <div class="prof-sig-preview__row">
                    <div class="prof-sig-preview__avatar">
                      <img v-if="sigForm.photo_url" :src="sigForm.photo_url" :alt="sigForm.display_name" />
                      <span v-else>{{ sigInitials }}</span>
                    </div>
                    <div class="prof-sig-preview__info">
                      <div v-if="sigForm.display_name" class="prof-sig-preview__name">{{ sigForm.display_name }}</div>
                      <div v-else class="prof-sig-preview__name prof-sig-preview__name--placeholder">Tu nombre</div>
                      <div v-if="sigForm.role_title" class="prof-sig-preview__role">{{ sigForm.role_title }}</div>
                      <div v-if="sigForm.tagline" class="prof-sig-preview__tag">{{ sigForm.tagline }}</div>
                      <div v-if="sigForm.email || sigForm.phone || sigForm.whatsapp" class="prof-sig-preview__contact">
                        <a v-if="sigForm.email" :href="`mailto:${sigForm.email}`">{{ sigForm.email }}</a>
                        <span v-if="sigForm.email && sigForm.phone" class="prof-sig-preview__sep">·</span>
                        <span v-if="sigForm.phone">{{ sigForm.phone }}</span>
                        <span v-if="(sigForm.email || sigForm.phone) && sigForm.whatsapp" class="prof-sig-preview__sep">·</span>
                        <a v-if="sigForm.whatsapp" class="prof-sig-preview__wa">WhatsApp</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seguridad (full width) -->
        <div class="prof-section prof-section--full">
          <div class="prof-section__header">
            <div>
              <div class="prof-section__title">Seguridad</div>
              <div class="prof-section__sub">Gestioná tu contraseña de acceso</div>
            </div>
            <v-btn variant="tonal" size="small" prepend-icon="mdi-lock-reset" @click="pwDialog = true">
              Cambiar contraseña
            </v-btn>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Dialog contraseña ────────────────────────────────────────── -->
    <v-dialog v-model="pwDialog" max-width="440">
      <v-card rounded="xl" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-5">
          <div class="text-subtitle-1 font-weight-black">Cambiar contraseña</div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="pwDialog = false" />
        </div>
        <v-text-field v-model="pw.current_password" label="Contraseña actual" type="password"
          variant="outlined" density="comfortable" class="mb-3" hide-details="auto" />
        <v-text-field v-model="pw.new_password" label="Nueva contraseña (mínimo 8)" type="password"
          variant="outlined" density="comfortable" class="mb-3" hide-details="auto" />
        <v-text-field v-model="pw.new_password2" label="Repetir nueva contraseña" type="password"
          variant="outlined" density="comfortable" hide-details="auto" />
        <v-alert v-if="pwError" type="error" variant="tonal" rounded="lg" class="mt-4" density="compact">
          {{ pwError }}
        </v-alert>
        <div class="d-flex justify-end gap-2 mt-5">
          <v-btn variant="text" @click="pwDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="pwLoading" @click="changePassword">Guardar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.open" :color="snack.color" timeout="2600" rounded="xl">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import { MeService } from "@/app/services/me.service";
import {
  getMySignature,
  updateMySignature,
  uploadMySignaturePhoto,
  deleteMySignaturePhoto,
} from "@/modules/admin/services/mySignature.api";

const auth = useAuthStore();

const me = reactive({
  id: null, email: "", username: "", first_name: "", last_name: "",
  avatar_url: "", roles: [], branch_id: null, branches: [],
  phone: "", created_at: null,
});
const form = reactive({ first_name: "", last_name: "" });

const loadingMe = ref(false);
const saving    = ref(false);
const uploading = ref(false);
const pageError = ref("");

const pwDialog  = ref(false);
const pwLoading = ref(false);
const pwError   = ref("");
const pw = reactive({ current_password: "", new_password: "", new_password2: "" });

// ── Firma CRM email ──────────────────────────────────────────────────────────
const sigForm = reactive({
  display_name: "",
  role_title: "",
  tagline: "",
  email: "",
  phone: "",
  whatsapp: "",
  photo_url: "",
  include_by_default: true,
});
const savingSig = ref(false);
const uploadingSigPhoto = ref(false);
const deletingSigPhoto = ref(false);
const sigError = ref("");
const sigPhotoInput = ref(null);

const sigInitials = computed(() => {
  const n = String(sigForm.display_name || "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

const snack = reactive({ open: false, text: "", color: "success" });
function toast(text, color = "success") { Object.assign(snack, { text, color, open: true }); }

// ── Sucursales ────────────────────────────────────────────────────────────────
const userBranches = computed(() => {
  const fromStore = auth.branches || [];
  if (fromStore.length) return fromStore;
  const raw = Array.isArray(me.branches) ? me.branches : [];
  return raw.map(b => {
    if (typeof b === "object" && b) return { id: Number(b.id || b.branch_id || 0), name: b.name || `Sucursal #${b.id}` };
    const id = Number(b); return { id, name: `Sucursal #${id}` };
  }).filter(b => b.id > 0);
});

// ── Computed ──────────────────────────────────────────────────────────────────
const fullName = computed(() => [me.first_name, me.last_name].filter(Boolean).join(" ").trim());
const initials = computed(() => {
  const a = (me.first_name || "").trim(), b = (me.last_name || "").trim();
  return ((a ? a[0].toUpperCase() : "") + (b ? b[0].toUpperCase() : "")) || "U";
});
const roleLabel = computed(() => {
  const roles = Array.isArray(me.roles)
    ? me.roles.map(r => String(r?.name || r || "").toLowerCase())
    : [];
  if (roles.some(r => ["super_admin","superadmin"].includes(r))) return "Super Admin";
  if (roles.includes("admin"))   return "Administrador";
  if (roles.includes("manager")) return "Supervisor";
  if (roles.includes("seller"))  return "Vendedor";
  return roles[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : "Usuario";
});

// ── Avatar ────────────────────────────────────────────────────────────────────
const avatarError  = ref(false);
const avatarBuster = ref(Date.now());
function normalizeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^(data:|blob:|https?:\/\/)/.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const s3 = String(import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (s3) return s3 + (s.startsWith("/") ? s : `/${s}`);
  const api = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return api ? api + (s.startsWith("/") ? s : `/${s}`) : s;
}
const avatarSrc = computed(() => {
  const raw = me.avatar_url || auth.user?.avatar_url || auth.user?.avatar || "";
  const base = normalizeUrl(raw);
  return base ? `${base}${base.includes("?") ? "&" : "?"}v=${avatarBuster.value}` : "";
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

// ── API ───────────────────────────────────────────────────────────────────────
async function loadMe() {
  pageError.value = ""; loadingMe.value = true;
  try {
    const r = await MeService.getMe();
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);
    form.first_name = me.first_name || "";
    form.last_name  = me.last_name  || "";
    auth.setUser?.(data);
    avatarBuster.value = Date.now();

    // Cargar la firma CRM en paralelo (no bloquea el resto del perfil).
    loadSignature().catch(() => {});
  } catch (e) {
    pageError.value = e?.response?.data?.message || e?.message || "No se pudo cargar el perfil";
  } finally { loadingMe.value = false; }
}

// ── Firma CRM email ──────────────────────────────────────────────────────────
async function loadSignature() {
  sigError.value = "";
  try {
    const sig = await getMySignature();
    if (sig) {
      Object.assign(sigForm, {
        display_name: sig.display_name || "",
        role_title: sig.role_title || "",
        tagline: sig.tagline || "",
        email: sig.email || "",
        phone: sig.phone || "",
        whatsapp: sig.whatsapp || "",
        photo_url: sig.photo_url || "",
        include_by_default: sig.include_by_default !== false,
      });
    }
  } catch (e) {
    sigError.value = e?.response?.data?.message || e?.message || "No se pudo cargar la firma.";
  }
}

async function saveSignature() {
  savingSig.value = true; sigError.value = "";
  try {
    const updated = await updateMySignature({ ...sigForm });
    if (updated?.photo_url !== undefined) sigForm.photo_url = updated.photo_url || "";
    toast("Firma guardada");
  } catch (e) {
    sigError.value = e?.response?.data?.message || e?.message || "No se pudo guardar la firma.";
  } finally { savingSig.value = false; }
}

function pickSigPhoto() { sigPhotoInput.value?.click?.(); }

async function onSigPhotoFile(ev) {
  const f = ev?.target?.files?.[0] || null;
  ev.target.value = "";
  if (!f) return;
  uploadingSigPhoto.value = true; sigError.value = "";
  try {
    const updated = await uploadMySignaturePhoto(f);
    if (updated) sigForm.photo_url = updated.photo_url || "";
    toast("Foto actualizada");
  } catch (e) {
    sigError.value = e?.response?.data?.message || e?.message || "No se pudo subir la foto.";
  } finally { uploadingSigPhoto.value = false; }
}

async function removeSigPhoto() {
  if (!window.confirm("¿Quitar la foto de la firma?")) return;
  deletingSigPhoto.value = true; sigError.value = "";
  try {
    await deleteMySignaturePhoto();
    sigForm.photo_url = "";
    toast("Foto quitada");
  } catch (e) {
    sigError.value = e?.response?.data?.message || e?.message || "No se pudo quitar la foto.";
  } finally { deletingSigPhoto.value = false; }
}
async function saveProfile() {
  saving.value = true; pageError.value = "";
  try {
    const r = await MeService.updateMe({ first_name: form.first_name, last_name: form.last_name });
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data); auth.setUser?.(data);
    toast("Perfil actualizado");
  } catch (e) { toast(e?.response?.data?.message || e?.message || "No se pudo guardar", "error");
  } finally { saving.value = false; }
}
async function uploadAvatar() {
  if (!avatarFile.value) return;
  uploading.value = true;
  try {
    const r = await MeService.uploadAvatar(avatarFile.value);
    const data = r?.data?.data || r?.data || {};
    Object.assign(me, data);
    auth.setUser?.({ ...(auth.user || {}), ...data });
    avatarBuster.value = Date.now();
    avatarFile.value = null; avatarHint.value = "";
    toast("Foto actualizada");
  } catch (e) { toast(e?.response?.data?.message || e?.message || "No se pudo subir la foto", "error");
  } finally { uploading.value = false; }
}
async function changePassword() {
  pwError.value = "";
  if (!pw.current_password || !pw.new_password || !pw.new_password2) { pwError.value = "Completá todos los campos."; return; }
  if (pw.new_password.length < 8) { pwError.value = "Mínimo 8 caracteres."; return; }
  if (pw.new_password !== pw.new_password2) { pwError.value = "Las contraseñas no coinciden."; return; }
  pwLoading.value = true;
  try {
    await MeService.changePassword({ current_password: pw.current_password, new_password: pw.new_password });
    Object.assign(pw, { current_password: "", new_password: "", new_password2: "" });
    pwDialog.value = false; toast("Contraseña actualizada");
  } catch (e) { pwError.value = e?.response?.data?.message || e?.message || "No se pudo cambiar la contraseña.";
  } finally { pwLoading.value = false; }
}

onMounted(loadMe);
</script>

<style scoped>
.prof-page {
  min-height: 100%;
  background: rgb(var(--v-theme-background));
}

/* ── Hero ────────────────────────────────────────────────── */
.prof-hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 24px 32px;
}
.prof-hero__inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.prof-hero__left {
  display: flex;
  align-items: center;
  gap: 18px;
}
.prof-hero__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.prof-hero__avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.35);
}
.prof-hero__avatar-edit {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border: 2px solid rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.prof-hero__name {
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}
.prof-hero__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  flex-wrap: wrap;
}
.prof-hero__email {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.prof-hero__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.prof-role-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 9px;
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
}

/* ── Body ────────────────────────────────────────────────── */
.prof-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 32px 48px;
}

/* ── Grid ────────────────────────────────────────────────── */
.prof-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 680px) {
  .prof-grid { grid-template-columns: 1fr; }
  .prof-hero { padding: 18px 20px; }
  .prof-body { padding: 20px 20px 40px; }
}

/* ── Section card ─────────────────────────────────────────── */
.prof-section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  overflow: hidden;
}
.prof-section--full {
  grid-column: 1 / -1;
}
.prof-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.prof-section__title {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.01em;
}
.prof-section__sub {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 2px;
}
.prof-section__body {
  padding: 18px 20px;
}

/* ── Field row ───────────────────────────────────────────── */
.prof-field-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.prof-field { display: flex; flex-direction: column; gap: 5px; }
.prof-label {
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.55);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ── Info list ───────────────────────────────────────────── */
.prof-info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.prof-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.prof-info-row:last-child { border-bottom: none; }
.prof-info-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.prof-info-value {
  font-size: 12.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface));
  text-align: right;
}
.prof-info-value--mono {
  font-family: monospace;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* ── Avatar row ──────────────────────────────────────────── */
.prof-avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.prof-avatar-sm {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  flex-shrink: 0;
}

/* ── Branch list ─────────────────────────────────────────── */
.prof-branch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.prof-branch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.prof-branch-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: rgba(var(--v-theme-primary), 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.prof-branch-name {
  font-size: 12.5px;
  font-weight: 400;
  flex: 1;
  color: rgb(var(--v-theme-on-surface));
}
.prof-branch-id {
  font-size: 11px;
  font-family: monospace;
  color: rgba(var(--v-theme-on-surface), 0.35);
}
.prof-empty {
  text-align: center;
  padding: 20px;
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.35);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 10px;
}

/* gap utility (vue 3 Vuetify no siempre tiene gap en flex) */
.gap-2 { gap: 8px; }

/* ── Firma CRM ───────────────────────────────────────────── */
.prof-sig-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}
@media (max-width: 880px) {
  .prof-sig-grid { grid-template-columns: 1fr; }
}
.prof-sig-form { display: flex; flex-direction: column; }
.prof-sig-photo-row {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
}

.prof-sig-preview-wrap {
  display: flex; flex-direction: column;
}
.prof-sig-preview {
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
}
.prof-sig-preview__row {
  display: flex; align-items: flex-start; gap: 16px;
}
.prof-sig-preview__avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  display: grid; place-items: center;
  font-size: 18px; font-weight: 500;
  flex-shrink: 0; overflow: hidden;
}
.prof-sig-preview__avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.prof-sig-preview__info { flex-grow: 1; min-width: 0; }
.prof-sig-preview__name {
  font-size: 15px; font-weight: 500; color: #111827; letter-spacing: -0.2px;
}
.prof-sig-preview__name--placeholder { opacity: .4; font-weight: 400; }
.prof-sig-preview__role {
  font-size: 12.5px;
  color: rgb(var(--v-theme-primary));
  font-weight: 400; letter-spacing: 0.3px;
  text-transform: uppercase; margin-top: 2px;
}
.prof-sig-preview__tag { font-size: 12.5px; color: #6b7280; margin-top: 6px; line-height: 1.5; }
.prof-sig-preview__contact { font-size: 12.5px; color: #6b7280; margin-top: 8px; line-height: 1.6; }
.prof-sig-preview__contact a {
  color: rgb(var(--v-theme-primary)); text-decoration: none; font-weight: 400;
}
.prof-sig-preview__sep { margin: 0 8px; color: #d1d5db; }
.prof-sig-preview__wa { color: #25D366 !important; font-weight: 400; }
</style>
