<template>
  <div class="pf">
    <v-alert v-if="pageError" type="error" variant="tonal" density="compact">{{ pageError }}</v-alert>

    <!-- Quién soy -->
    <div class="pf-cab">
      <div class="pf-foto">
        <button type="button" class="pf-foto__btn" aria-label="Cambiar foto" :disabled="uploading" @click="pickFile">
          <v-avatar size="88" class="pf-foto__avatar">
            <v-img v-if="avatarSrc && !avatarError" :key="avatarKey" :src="avatarSrc" cover @error="avatarError = true" />
            <span v-else class="pf-foto__iniciales">{{ initials }}</span>
          </v-avatar>
          <v-progress-circular v-if="uploading" class="pf-foto__carga" indeterminate size="88" width="3" color="primary" />
        </button>
        <a href="#" class="pf-link pf-link--chico" @click.prevent="pickFile">Cambiar foto</a>
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="d-none" @change="onPickFile" />
      </div>
      <div class="pf-cab__txt">
        <h1 class="pf-cab__nombre">{{ fullName || me.username || "Mi perfil" }}</h1>
        <span class="pf-cab__sub">{{ [roleLabel, me.email].filter(Boolean).join(" · ") }}</span>
        <span v-if="avatarHint" class="pf-cab__aviso">{{ avatarHint }}</span>
      </div>
      <v-btn color="primary" variant="flat" class="pf-guardar" :loading="saving || savingSig" @click="guardarTodo">Guardar cambios</v-btn>
    </div>

    <div class="pf-grilla">
      <!-- Datos personales -->
      <section class="pf-caja">
        <div class="pf-banda"><span>Datos personales</span></div>
        <div class="pf-campos pf-campos--dos">
          <label class="pf-campo"><span>Nombre</span><input v-model="form.first_name" type="text" autocomplete="given-name" /></label>
          <label class="pf-campo"><span>Apellido</span><input v-model="form.last_name" type="text" autocomplete="family-name" /></label>
        </div>
        <dl class="pf-datos">
          <dt>Usuario</dt><dd>{{ me.username || "—" }}</dd>
          <dt>Correo</dt><dd>{{ me.email || "—" }}</dd>
          <dt>Rol</dt><dd>{{ roleLabel }}</dd>
        </dl>
      </section>

      <!-- Sucursales -->
      <section class="pf-caja">
        <div class="pf-banda"><span>Sucursales</span><small>{{ sucursalesOrdenadas.length }} {{ sucursalesOrdenadas.length === 1 ? "asignada" : "asignadas" }}</small></div>
        <div class="pf-filas">
          <div v-for="b in sucursalesOrdenadas" :key="b.id" class="pf-suc" :class="{ 'is-principal': b.principal }">
            <v-icon size="20">mdi-store-outline</v-icon>{{ b.name }}
            <span v-if="b.principal" class="pf-suc__tag">Principal</span>
          </div>
          <div v-if="!sucursalesOrdenadas.length" class="pf-vacio">Sin sucursales asignadas</div>
        </div>
      </section>
    </div>

    <!-- Firma: formulario a la izquierda, cómo se ve a la derecha -->
    <section class="pf-caja">
      <div class="pf-banda"><span>Firma para correos del CRM</span><small>va al pie de los correos a clientes</small></div>
      <v-alert v-if="sigError" type="error" variant="tonal" density="compact" class="ma-3">{{ sigError }}</v-alert>
      <div class="pf-firma">
        <div class="pf-campos pf-campos--dos">
          <label class="pf-campo"><span>Nombre a mostrar</span><input v-model="sigForm.display_name" type="text" /></label>
          <label class="pf-campo"><span>Cargo</span><input v-model="sigForm.role_title" type="text" placeholder="Ej.: Ventas" /></label>
          <label class="pf-campo"><span>Correo de contacto</span><input v-model="sigForm.email" type="email" /></label>
          <label class="pf-campo"><span>Teléfono</span><input v-model="sigForm.phone" type="tel" /></label>
          <label class="pf-campo"><span>WhatsApp</span><input v-model="sigForm.whatsapp" type="tel" inputmode="numeric" placeholder="Solo números" /></label>
          <label class="pf-campo"><span>Frase</span><input v-model="sigForm.tagline" type="text" placeholder="Opcional" /></label>
          <label class="pf-check">
            <input v-model="sigForm.include_by_default" type="checkbox" />
            Incluir la firma en cada envío
          </label>
        </div>
        <div class="pf-previa">
          <span class="pf-previa__tit">Así se ve</span>
          <div class="pf-previa__caja">
            <button type="button" class="pf-previa__foto" aria-label="Cambiar foto de la firma" :disabled="uploadingSigPhoto" @click="pickSigPhoto">
              <img v-if="sigForm.photo_url" :src="sigForm.photo_url" alt="" />
              <span v-else>{{ sigInitials }}</span>
            </button>
            <div class="pf-previa__txt">
              <span class="pf-previa__nombre">{{ sigForm.display_name || "Tu nombre" }}</span>
              <span v-if="sigForm.role_title" class="pf-previa__sub">{{ sigForm.role_title }}</span>
              <span v-if="sigForm.tagline" class="pf-previa__sub">{{ sigForm.tagline }}</span>
              <span v-if="sigForm.email" class="pf-previa__mail">{{ sigForm.email }}</span>
              <span v-if="sigForm.phone || sigForm.whatsapp" class="pf-previa__sub">{{ [sigForm.phone, sigForm.whatsapp ? "WhatsApp" : ""].filter(Boolean).join(" · ") }}</span>
            </div>
          </div>
          <span class="pf-previa__links">
            <a href="#" class="pf-link pf-link--chico" @click.prevent="pickSigPhoto">{{ sigForm.photo_url ? "Cambiar foto de la firma" : "Poner foto en la firma" }}</a>
            <a v-if="sigForm.photo_url" href="#" class="pf-link pf-link--chico pf-link--suave" @click.prevent="removeSigPhoto">Quitar</a>
          </span>
          <input ref="sigPhotoInput" type="file" accept="image/*" class="d-none" @change="onSigPhotoFile" />
        </div>
      </div>
    </section>

    <!-- Contraseña: se abre acá mismo, no en una ventana -->
    <section class="pf-caja">
      <button type="button" class="pf-clave" :aria-expanded="pwAbierto" @click="pwAbierto = !pwAbierto">
        <v-icon size="22">mdi-lock-outline</v-icon>
        <span class="pf-clave__tit">Contraseña</span>
        <span class="pf-link">{{ pwAbierto ? "Cancelar" : "Cambiar" }}<v-icon size="20">{{ pwAbierto ? "mdi-chevron-up" : "mdi-chevron-right" }}</v-icon></span>
      </button>
      <div v-if="pwAbierto" class="pf-clave__form">
        <div class="pf-campos pf-campos--tres">
          <label class="pf-campo"><span>Contraseña actual</span><input v-model="pw.current_password" type="password" autocomplete="current-password" /></label>
          <label class="pf-campo"><span>Nueva (mínimo 8)</span><input v-model="pw.new_password" type="password" autocomplete="new-password" /></label>
          <label class="pf-campo"><span>Repetir la nueva</span><input v-model="pw.new_password2" type="password" autocomplete="new-password" @keyup.enter="changePassword" /></label>
        </div>
        <div class="pf-clave__pie">
          <span v-if="pwError" class="pf-error">{{ pwError }}</span>
          <v-btn color="primary" variant="flat" :loading="pwLoading" @click="changePassword">Cambiar contraseña</v-btn>
        </div>
      </div>
    </section>

    <v-snackbar v-model="snack.open" :color="snack.color" :timeout="2800">{{ snack.text }}</v-snackbar>
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
  avatarHint.value = "";
  e.target.value = "";
  uploadAvatar();
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
    pwDialog.value = false; pwAbierto.value = false; toast("Contraseña actualizada");
  } catch (e) { pwError.value = e?.response?.data?.message || e?.message || "No se pudo cambiar la contraseña.";
  } finally { pwLoading.value = false; }
}

// ── Rediseño: guardar todo junto, foto al elegirla, contraseña en el lugar ──
const pwAbierto = ref(false);
async function guardarTodo() {
  await Promise.all([saveProfile(), saveSignature()]);
}
const sucursalesOrdenadas = computed(() => {
  const principal = Number(me.branch_id || auth.user?.branch_id || 0);
  return userBranches.value
    .map((b) => ({ ...b, principal: Number(b.id) === principal }))
    .sort((a, b) => Number(b.principal) - Number(a.principal));
});

onMounted(loadMe);
</script>

<style>
/* Perfil. Sin scoped: todo cuelga de .pf; tema oscuro con .v-theme--dark .pf. */
.pos-container:has(.pf) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.pf {
  --pf-fondo: #d6e6f3; --pf-caja: #ffffff; --pf-borde: #d3dde7; --pf-linea: #eef2f6; --pf-campo: #c9d5e1;
  --pf-texto: #0f172a; --pf-suave: #5a6678; --pf-acento: #0f6fae; --pf-banda: #0f6fae; --pf-pie: #f8fbfd;
  padding: 22px 28px 48px; min-height: calc(100vh - 56px); box-sizing: border-box; background: var(--pf-fondo); color: var(--pf-texto);
  display: flex; flex-direction: column; gap: 18px;
}
.v-theme--dark .pf {
  --pf-fondo: #0b0f14; --pf-caja: #151c25; --pf-borde: #253141; --pf-linea: #222c39; --pf-campo: #33425a;
  --pf-texto: #e5edf5; --pf-suave: #9aa8b8; --pf-acento: #5aaee0; --pf-banda: #0f5f96; --pf-pie: #1a2430;
}
.pf > * { max-width: 1100px; width: 100%; margin-left: auto; margin-right: auto; box-sizing: border-box; }
.pf-link { display: inline-flex; align-items: center; font-size: 15px; font-weight: 800; color: var(--pf-acento); text-decoration: none; cursor: pointer; }
.pf-link:hover { text-decoration: underline; }
.pf-link--chico { font-size: 13px; }
.pf-link--suave { color: var(--pf-suave); font-weight: 700; }

.pf-cab { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.pf-foto { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.pf-foto__btn { position: relative; padding: 0; border: 0; background: transparent; border-radius: 9999px; cursor: pointer; }
.pf-foto__avatar { background: var(--pf-acento); }
.pf-foto__iniciales { font-size: 30px; font-weight: 800; color: #ffffff; }
.pf-foto__carga { position: absolute; inset: 0; }
.pf-cab__txt { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 2px; }
.pf-cab__nombre { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.pf-cab__sub { font-size: 15px; font-weight: 600; color: var(--pf-suave); }
.pf-cab__aviso { font-size: 13px; font-weight: 700; color: #b23b35; }
.pf-guardar { height: 42px !important; border-radius: 10px !important; font-weight: 800 !important; text-transform: none !important; letter-spacing: 0 !important; }

.pf-grilla { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.pf-caja { border-radius: 12px; overflow: hidden; background: var(--pf-caja); border: 1px solid var(--pf-borde); }
.pf-banda { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; background: var(--pf-banda); color: #ffffff; font-size: 15px; font-weight: 800; }
.pf-banda small { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }

.pf-campos { display: grid; gap: 12px; padding: 14px 16px; }
.pf-campos--dos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pf-campos--tres { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.pf-campo { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.pf-campo span { font-size: 13px; font-weight: 700; color: var(--pf-suave); }
.pf-campo input { height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--pf-campo); background: var(--pf-caja); color: var(--pf-texto); font-family: inherit; font-size: 15px; outline: 0; min-width: 0; }
.pf-campo input:focus { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, 0.18); }
.pf-campo input::placeholder { color: #94a3b8; }
.pf-check { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
.pf-check input { width: 18px; height: 18px; accent-color: #0f6fae; }

.pf-datos { display: grid; grid-template-columns: max-content 1fr; gap: 10px 18px; margin: 0; padding: 14px 16px; border-top: 1px solid var(--pf-linea); }
.pf-datos dt { font-size: 14px; font-weight: 600; color: var(--pf-suave); }
.pf-datos dd { margin: 0; font-size: 15px; font-weight: 700; text-align: right; overflow-wrap: anywhere; }

.pf-filas { display: flex; flex-direction: column; padding: 4px 16px 8px; }
.pf-suc { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--pf-linea); font-size: 15px; font-weight: 600; }
.pf-suc:last-child { border-bottom: 0; }
.pf-suc .v-icon { color: var(--pf-suave); }
.pf-suc.is-principal { font-weight: 700; }
.pf-suc__tag { margin-left: auto; font-size: 12px; font-weight: 800; color: var(--pf-acento); }
.pf-vacio { padding: 20px 0; text-align: center; color: var(--pf-suave); font-weight: 600; }

.pf-firma { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 8px; }
.pf-previa { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px 14px 0; }
.pf-previa__tit { font-size: 13px; font-weight: 700; color: var(--pf-suave); }
.pf-previa__caja { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 10px; border: 1px solid var(--pf-linea); background: var(--pf-pie); }
.pf-previa__foto { width: 56px; height: 56px; flex-shrink: 0; border-radius: 9999px; border: 0; padding: 0; overflow: hidden; background: var(--pf-acento); color: #ffffff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.pf-previa__foto img { width: 100%; height: 100%; object-fit: cover; }
.pf-previa__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pf-previa__nombre { font-size: 16px; font-weight: 800; }
.pf-previa__sub { font-size: 13px; color: var(--pf-suave); }
.pf-previa__mail { font-size: 13px; font-weight: 700; color: var(--pf-acento); overflow-wrap: anywhere; }
.pf-previa__links { display: flex; gap: 14px; }

.pf-clave { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 0; background: transparent; color: var(--pf-texto); font-family: inherit; cursor: pointer; text-align: left; }
.pf-clave .v-icon { color: var(--pf-suave); }
.pf-clave__tit { font-size: 15px; font-weight: 700; }
.pf-clave .pf-link { margin-left: auto; }
.pf-clave .pf-link .v-icon { color: inherit; }
.pf-clave__form { border-top: 1px solid var(--pf-linea); }
.pf-clave__pie { display: flex; align-items: center; justify-content: flex-end; gap: 14px; padding: 0 16px 14px; }
.pf-error { font-size: 13px; font-weight: 700; color: #b23b35; }

@media (max-width: 900px) {
  .pf { padding: 16px 14px 96px; }
  .pf-grilla, .pf-firma, .pf-campos--tres { grid-template-columns: minmax(0, 1fr); }
  .pf-previa { padding: 0 16px 16px; }
  .pf-guardar { width: 100%; }
}
@media (max-width: 520px) {
  .pf-campos--dos { grid-template-columns: minmax(0, 1fr); }
}
</style>
