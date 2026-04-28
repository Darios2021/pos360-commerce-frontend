<!-- src/modules/users/components/UserUpsertDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="860" scrollable>
    <v-card rounded="xl" class="uud">

      <!-- Header -->
      <div class="uud-head">
        <div class="uud-head__icon" :style="{ background: avatarColor }">
          <span v-if="initials">{{ initials }}</span>
          <v-icon v-else color="white">mdi-account-plus</v-icon>
        </div>
        <div class="uud-head__text">
          <h2 class="uud-title">
            {{ mode === "create" ? "Nuevo usuario" : form.first_name || form.username || "Editar usuario" }}
          </h2>
          <span class="uud-subtitle">
            {{ mode === "create"
              ? "Creá una cuenta con roles y sucursales habilitadas"
              : `@${form.username || "—"} · ${form.email || "—"}` }}
          </span>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </div>

      <v-divider />

      <!-- Tabs -->
      <v-tabs v-model="tab" color="primary" density="compact" class="uud-tabs">
        <v-tab value="identity">
          <v-icon start size="16">mdi-account-circle-outline</v-icon>
          Identidad
        </v-tab>
        <v-tab value="permissions">
          <v-icon start size="16">mdi-shield-account-outline</v-icon>
          Permisos
        </v-tab>
        <v-tab value="password">
          <v-icon start size="16">mdi-lock-outline</v-icon>
          {{ mode === "create" ? "Contraseña" : "Cambiar contraseña" }}
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="uud-body">
        <v-tabs-window v-model="tab">

          <!-- ── IDENTIDAD ── -->
          <v-tabs-window-item value="identity" class="uud-pane">
            <div class="uud-grid">
              <div class="uud-col">
                <label class="uud-label">Nombre</label>
                <v-text-field
                  v-model="form.first_name"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Ej. Juan"
                  autocomplete="off"
                />
              </div>
              <div class="uud-col">
                <label class="uud-label">Apellido</label>
                <v-text-field
                  v-model="form.last_name"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Ej. Pérez"
                  autocomplete="off"
                />
              </div>
              <div class="uud-col">
                <label class="uud-label">Usuario <span class="uud-required">*</span></label>
                <v-text-field
                  v-model="form.username"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="jperez"
                  prepend-inner-icon="mdi-at"
                  :disabled="mode === 'edit'"
                  autocomplete="off"
                />
                <div class="uud-hint">Único. No se puede modificar después.</div>
              </div>
              <div class="uud-col">
                <label class="uud-label">Email <span class="uud-required">*</span></label>
                <v-text-field
                  v-model="form.email"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="email"
                  placeholder="nombre@empresa.com"
                  prepend-inner-icon="mdi-email-outline"
                  :disabled="mode === 'edit'"
                  autocomplete="off"
                />
                <div class="uud-hint">Único. No se puede modificar después.</div>
              </div>

              <div class="uud-col-full">
                <div class="uud-switch-box">
                  <v-switch
                    v-model="form.is_active"
                    inset
                    color="success"
                    hide-details
                    density="compact"
                  />
                  <div>
                    <div class="uud-switch-title">
                      Usuario {{ form.is_active ? 'activo' : 'inactivo' }}
                    </div>
                    <div class="uud-switch-sub">
                      {{ form.is_active
                        ? 'Puede iniciar sesión y operar según sus permisos.'
                        : 'No puede iniciar sesión. Los datos se conservan.' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- ── PERMISOS ── -->
          <v-tabs-window-item value="permissions" class="uud-pane">
            <!-- Roles -->
            <div class="uud-section">
              <div class="uud-section__head">
                <v-icon size="16" color="primary">mdi-shield-crown-outline</v-icon>
                <span class="uud-section__title">Roles asignados</span>
                <v-chip size="x-small" variant="tonal" class="ml-2">
                  {{ form.role_ids.length }}
                </v-chip>
              </div>
              <div class="uud-section__hint">
                Podés seleccionar uno o más roles. Los permisos se acumulan.
              </div>

              <div class="uud-roles">
                <label
                  v-for="r in roles"
                  :key="r.id"
                  class="uud-role-card"
                  :class="[
                    `uud-role-card--${String(r.name).toLowerCase()}`,
                    { 'is-active': form.role_ids.includes(r.id) },
                  ]"
                >
                  <input
                    type="checkbox"
                    :value="r.id"
                    v-model="form.role_ids"
                    class="uud-role-checkbox"
                  />
                  <div class="uud-role-card__body">
                    <div class="uud-role-card__head">
                      <v-icon size="18">{{ roleIcon(r.name) }}</v-icon>
                      <span class="uud-role-card__name">{{ roleLabel(r.name) }}</span>
                      <v-icon
                        v-if="form.role_ids.includes(r.id)"
                        size="18"
                        class="ml-auto"
                        color="primary"
                      >mdi-check-circle</v-icon>
                    </div>
                    <div class="uud-role-card__desc">{{ roleDesc(r.name) }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Sucursales -->
            <div class="uud-section">
              <div class="uud-section__head">
                <v-icon size="16" color="primary">mdi-store</v-icon>
                <span class="uud-section__title">Sucursales habilitadas</span>
                <v-chip
                  size="x-small"
                  :color="isSuperAdminSelected ? 'primary' : undefined"
                  :variant="isSuperAdminSelected ? 'flat' : 'tonal'"
                  class="ml-2"
                >
                  {{ isSuperAdminSelected || allBranchesSelected ? 'Todas' : form.branch_ids.length }}
                </v-chip>
                <v-spacer />
                <v-btn
                  v-if="!isSuperAdminSelected && !allBranchesSelected"
                  size="x-small"
                  variant="text"
                  @click="selectAllBranches"
                >
                  <v-icon start size="14">mdi-select-all</v-icon>
                  Seleccionar todas
                </v-btn>
                <v-btn
                  v-else-if="!isSuperAdminSelected && allBranchesSelected"
                  size="x-small"
                  variant="text"
                  @click="form.branch_ids = []"
                >
                  <v-icon start size="14">mdi-select-off</v-icon>
                  Limpiar
                </v-btn>
              </div>

              <!-- Banner explicativo cuando hay super_admin: el filtro no aplica. -->
              <div v-if="isSuperAdminSelected" class="uud-super-banner">
                <v-icon size="18" color="primary">mdi-shield-crown</v-icon>
                <div>
                  <div class="uud-super-banner__title">El rol Super admin ignora el filtro de sucursales</div>
                  <div class="uud-super-banner__text">
                    Habilitamos automáticamente todas las sucursales en este perfil para que coincida con el ámbito real.
                    Si querés un acceso acotado a una sucursal, sacale Super admin y dejale Admin o Encargado.
                  </div>
                </div>
              </div>
              <div v-else class="uud-section__hint">
                Restringen las operaciones por sucursal. Si necesitás acceso global, usá el rol <b>Super admin</b>.
              </div>

              <div v-if="!(branches || []).length" class="uud-empty">
                <v-icon size="24">mdi-store-off</v-icon>
                <span>No hay sucursales configuradas.</span>
              </div>

              <div
                v-else
                class="uud-branches"
                :class="{ 'is-disabled': isSuperAdminSelected }"
              >
                <label
                  v-for="b in branches"
                  :key="b.id"
                  class="uud-branch-chip"
                  :class="{
                    'is-active': isSuperAdminSelected || form.branch_ids.includes(b.id),
                  }"
                >
                  <input
                    type="checkbox"
                    :value="b.id"
                    :disabled="isSuperAdminSelected"
                    v-model="form.branch_ids"
                    class="uud-role-checkbox"
                  />
                  <v-icon size="14">mdi-store</v-icon>
                  <span>{{ b.name }}</span>
                  <v-icon
                    v-if="isSuperAdminSelected || form.branch_ids.includes(b.id)"
                    size="14"
                    color="primary"
                    class="ml-1"
                  >mdi-check-circle</v-icon>
                </label>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- ── CONTRASEÑA ── -->
          <v-tabs-window-item value="password" class="uud-pane">
            <!-- CREATE: contraseña inicial -->
            <div v-if="mode === 'create'" class="uud-section">
              <div class="uud-section__head">
                <v-icon size="16" color="primary">mdi-lock-outline</v-icon>
                <span class="uud-section__title">Contraseña inicial</span>
              </div>
              <div class="uud-section__hint">
                Mínimo 8 caracteres. El usuario podrá cambiarla luego.
              </div>

              <div class="uud-pass-grid">
                <div>
                  <label class="uud-label">Contraseña <span class="uud-required">*</span></label>
                  <v-text-field
                    v-model="form.password"
                    :type="showPass ? 'text' : 'password'"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Mínimo 8 caracteres"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPass = !showPass"
                    autocomplete="new-password"
                  />
                </div>
                <div>
                  <label class="uud-label">Confirmar contraseña</label>
                  <v-text-field
                    v-model="passwordConfirm"
                    :type="showPass ? 'text' : 'password'"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Repetir"
                    prepend-inner-icon="mdi-lock-check-outline"
                    :error="!!passwordConfirm && passwordConfirm !== form.password"
                    autocomplete="new-password"
                  />
                  <div v-if="passwordConfirm && passwordConfirm !== form.password" class="uud-hint-error">
                    Las contraseñas no coinciden.
                  </div>
                </div>
              </div>

              <div class="uud-strength" v-if="form.password">
                <div class="uud-strength__bar">
                  <div
                    class="uud-strength__fill"
                    :class="`uud-strength__fill--${strength.level}`"
                    :style="{ width: strength.pct + '%' }"
                  />
                </div>
                <div class="uud-strength__lbl" :class="`uud-strength__lbl--${strength.level}`">
                  {{ strength.label }}
                </div>
              </div>

              <ul class="uud-rules">
                <li :class="{ ok: form.password.length >= 8 }">
                  <v-icon size="14">{{ form.password.length >= 8 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                  Mínimo 8 caracteres
                </li>
                <li :class="{ ok: /[A-Z]/.test(form.password) }">
                  <v-icon size="14">{{ /[A-Z]/.test(form.password) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                  Al menos una mayúscula
                </li>
                <li :class="{ ok: /[0-9]/.test(form.password) }">
                  <v-icon size="14">{{ /[0-9]/.test(form.password) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                  Al menos un número
                </li>
                <li :class="{ ok: /[^A-Za-z0-9]/.test(form.password) }">
                  <v-icon size="14">{{ /[^A-Za-z0-9]/.test(form.password) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                  Al menos un símbolo (opcional pero recomendado)
                </li>
              </ul>
            </div>

            <!-- EDIT: reset password -->
            <div v-else class="uud-section">
              <div class="uud-section__head">
                <v-icon size="16" color="warning">mdi-lock-reset</v-icon>
                <span class="uud-section__title">Restablecer contraseña</span>
              </div>
              <div class="uud-section__hint">
                Se cambia al instante. El usuario tendrá que entrar con la nueva contraseña.
              </div>

              <div class="uud-pass-grid">
                <div>
                  <label class="uud-label">Nueva contraseña <span class="uud-required">*</span></label>
                  <v-text-field
                    v-model="pass.newPass"
                    :type="showPass ? 'text' : 'password'"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Mínimo 8 caracteres"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPass = !showPass"
                    autocomplete="new-password"
                  />
                </div>
                <div>
                  <label class="uud-label">Confirmar contraseña</label>
                  <v-text-field
                    v-model="pass.newPass2"
                    :type="showPass ? 'text' : 'password'"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Repetir"
                    prepend-inner-icon="mdi-lock-check-outline"
                    :error="!!pass.newPass2 && pass.newPass2 !== pass.newPass"
                    autocomplete="new-password"
                  />
                </div>
              </div>

              <div class="uud-strength" v-if="pass.newPass">
                <div class="uud-strength__bar">
                  <div
                    class="uud-strength__fill"
                    :class="`uud-strength__fill--${strengthReset.level}`"
                    :style="{ width: strengthReset.pct + '%' }"
                  />
                </div>
                <div class="uud-strength__lbl" :class="`uud-strength__lbl--${strengthReset.level}`">
                  {{ strengthReset.label }}
                </div>
              </div>

              <div class="uud-actions-inline">
                <v-btn
                  variant="flat"
                  color="warning"
                  rounded="lg"
                  prepend-icon="mdi-lock-reset"
                  :loading="pass.loading"
                  :disabled="!canResetPassword"
                  @click="onResetPassword"
                >
                  Actualizar contraseña
                </v-btn>
                <div v-if="pass.msg" class="uud-pass-msg" :class="{ 'is-error': pass.isError }">
                  <v-icon size="14">{{ pass.isError ? 'mdi-alert-circle' : 'mdi-check-circle' }}</v-icon>
                  {{ pass.msg }}
                </div>
              </div>
            </div>
          </v-tabs-window-item>

        </v-tabs-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="uud-footer">
        <div class="uud-footer__hint">
          <v-icon size="14" color="medium-emphasis">mdi-information-outline</v-icon>
          <span>{{ footerHint }}</span>
        </div>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-content-save"
          :loading="loading"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ mode === "create" ? "Crear usuario" : "Guardar cambios" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { UsersService } from "@/app/services/users.service";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  item: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  initialTab: { type: String, default: "identity" },
});

const emit = defineEmits(["update:open", "save"]);

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const tab = ref("identity");
const showPass = ref(false);
const passwordConfirm = ref("");

const form = reactive({
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  is_active: true,
  role_ids: [],
  branch_ids: [],
});

const pass = reactive({
  newPass: "",
  newPass2: "",
  loading: false,
  msg: "",
  isError: false,
});

watch(
  () => [props.open, props.item, props.mode, props.initialTab],
  () => {
    if (!props.open) return;

    const u = props.item || {};
    form.first_name = u.first_name || "";
    form.last_name = u.last_name || "";
    form.username = u.username || "";
    form.email = u.email || "";
    form.password = "";
    form.is_active = typeof u.is_active === "boolean" ? u.is_active : true;

    form.role_ids = Array.isArray(u.role_ids)
      ? [...u.role_ids]
      : Array.isArray(u.roles)
      ? u.roles.map((r) => (typeof r === "object" ? r.id : null)).filter(Boolean)
      : [];

    form.branch_ids = Array.isArray(u.branch_ids)
      ? [...u.branch_ids]
      : Array.isArray(u.branches)
      ? u.branches.map((b) => (typeof b === "object" ? b.id : null)).filter(Boolean)
      : [];

    passwordConfirm.value = "";
    showPass.value = false;

    pass.newPass = "";
    pass.newPass2 = "";
    pass.msg = "";
    pass.isError = false;
    pass.loading = false;

    tab.value = props.initialTab || "identity";
  },
  { immediate: true }
);

function close() {
  openLocal.value = false;
}

/* Helpers visuales */
const initials = computed(() => {
  const src = [form.first_name, form.last_name].filter(Boolean).join(" ") || form.username || form.email;
  const s = String(src || "").trim();
  if (!s) return "";
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
});

const avatarColor = computed(() => {
  const src = (form.username || form.email || "x").toLowerCase();
  let hash = 0;
  for (let i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
  const palette = [
    "linear-gradient(135deg, #3b82f6, #2563eb)",
    "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    "linear-gradient(135deg, #06b6d4, #0891b2)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #f59e0b, #d97706)",
    "linear-gradient(135deg, #ec4899, #db2777)",
    "linear-gradient(135deg, #6366f1, #4f46e5)",
  ];
  return palette[hash % palette.length];
});

function roleLabel(r) {
  const map = {
    super_admin: "Super admin",
    admin: "Admin",
    manager: "Encargado",
    cashier: "Cajero",
  };
  const key = String(r || "").toLowerCase();
  return map[key] || r;
}
function roleIcon(r) {
  const map = {
    super_admin: "mdi-crown-outline",
    admin: "mdi-shield-crown-outline",
    manager: "mdi-account-tie-outline",
    cashier: "mdi-cash-register",
  };
  return map[String(r || "").toLowerCase()] || "mdi-account-circle-outline";
}
function roleDesc(r) {
  const map = {
    super_admin: "Acceso total, incluye configuración crítica y gestión de usuarios.",
    admin: "Acceso al panel admin, reportes, configuración y cajas.",
    manager: "Encargado de sucursal: supervisa cajas y operaciones del día.",
    cashier: "Opera el POS y maneja la caja del turno.",
  };
  return map[String(r || "").toLowerCase()] || "Rol personalizado.";
}

const allBranchesSelected = computed(() =>
  (props.branches || []).length > 0 &&
  props.branches.every((b) => form.branch_ids.includes(b.id))
);

function selectAllBranches() {
  form.branch_ids = (props.branches || []).map((b) => b.id);
}

// Nombres (lowercase) de los roles seleccionados, para chequeos de UX.
const selectedRoleNames = computed(() => {
  const byId = new Map((props.roles || []).map((r) => [r.id, String(r.name || "").toLowerCase()]));
  return form.role_ids
    .map((id) => byId.get(id))
    .filter(Boolean);
});

// El rol super_admin ignora el filtro de sucursales (acceso global). Lo detectamos
// para mostrar un banner explicativo, autoseleccionar todas las sucursales y
// evitar la inconsistencia de "veo Rivadavia habilitada pero accedo a todo".
const isSuperAdminSelected = computed(() =>
  selectedRoleNames.value.some((n) => ["super_admin", "superadmin"].includes(n))
);

// Cuando se activa super_admin, garantizamos que TODAS las sucursales queden
// habilitadas en user_branches. Así el form no miente y el backend recibe el
// scope coherente con el rol.
watch(isSuperAdminSelected, (isSuper) => {
  if (!isSuper) return;
  if (!props.branches?.length) return;
  if (allBranchesSelected.value) return;
  form.branch_ids = props.branches.map((b) => b.id);
});

/* Password strength */
function computeStrength(pwd) {
  const s = String(pwd || "");
  let score = 0;
  if (s.length >= 8) score += 1;
  if (s.length >= 12) score += 1;
  if (/[A-Z]/.test(s)) score += 1;
  if (/[0-9]/.test(s)) score += 1;
  if (/[^A-Za-z0-9]/.test(s)) score += 1;

  if (s.length === 0) return { level: "empty", label: "", pct: 0 };
  if (score <= 1) return { level: "weak", label: "Débil", pct: 25 };
  if (score === 2) return { level: "medium", label: "Media", pct: 50 };
  if (score === 3) return { level: "good", label: "Buena", pct: 75 };
  return { level: "strong", label: "Fuerte", pct: 100 };
}
const strength = computed(() => computeStrength(form.password));
const strengthReset = computed(() => computeStrength(pass.newPass));

/* Validations */
const canSubmit = computed(() => {
  if (!form.username?.trim() || !form.email?.trim()) return false;
  if (props.mode === "create") {
    if (!form.password || form.password.length < 8) return false;
    if (passwordConfirm.value && passwordConfirm.value !== form.password) return false;
  }
  return true;
});

const canResetPassword = computed(() => {
  return pass.newPass.length >= 8 && pass.newPass === pass.newPass2 && !pass.loading;
});

const footerHint = computed(() => {
  if (props.mode === "create") {
    if (!form.username || !form.email) return "Completá usuario y email.";
    if (!form.password || form.password.length < 8) return "Definí una contraseña (mín. 8 caracteres).";
    return "Listo para crear.";
  }
  return "Los cambios se aplican al guardar.";
});

function submit() {
  emit("save", {
    first_name: form.first_name || null,
    last_name: form.last_name || null,
    username: form.username,
    email: form.email,
    password: props.mode === "create" ? form.password : undefined,
    is_active: form.is_active,
    role_ids: form.role_ids || [],
    branch_ids: form.branch_ids || [],
  });
}

async function onResetPassword() {
  pass.msg = "";
  pass.isError = false;

  if (pass.newPass.length < 8) {
    pass.msg = "La contraseña debe tener al menos 8 caracteres.";
    pass.isError = true;
    return;
  }
  if (pass.newPass !== pass.newPass2) {
    pass.msg = "Las contraseñas no coinciden.";
    pass.isError = true;
    return;
  }

  try {
    pass.loading = true;
    const id = props?.item?.id;
    if (!id) throw new Error("Usuario inválido");

    const resp = await UsersService.resetPassword(id, { password: pass.newPass });
    pass.msg = resp?.message || "Contraseña actualizada correctamente";
    pass.isError = false;
    pass.newPass = "";
    pass.newPass2 = "";
  } catch (e) {
    pass.msg = e?.response?.data?.message || e?.message || "Error actualizando contraseña";
    pass.isError = true;
  } finally {
    pass.loading = false;
  }
}
</script>

<style scoped>
.uud {
  overflow: hidden;
}

/* Header */
.uud-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
}
.uud-head__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 500;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.2);
}
.uud-head__text { min-width: 0; }
.uud-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.15;
  margin: 0;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.uud-subtitle {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

/* Tabs */
.uud-tabs {
  padding: 0 12px;
}
.uud-tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
  font-size: 13px;
  padding: 0 14px;
}

/* Body */
.uud-body {
  max-height: 65vh;
  padding: 0;
}
.uud-pane {
  padding: 20px;
}

/* Grid common */
.uud-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 14px;
}
.uud-col { min-width: 0; }
.uud-col-full { grid-column: 1 / -1; }

.uud-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-bottom: 6px;
}
.uud-required { color: rgb(var(--v-theme-error)); font-weight: 500; }
.uud-hint {
  font-size: 11px;
  opacity: 0.55;
  margin-top: 4px;
  font-weight: 500;
}
.uud-hint-error {
  font-size: 11px;
  color: rgb(var(--v-theme-error));
  margin-top: 4px;
  font-weight: 400;
}

.uud-switch-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.uud-switch-title {
  font-weight: 500;
  font-size: 13.5px;
}
.uud-switch-sub {
  font-size: 11.5px;
  opacity: 0.65;
  line-height: 1.4;
}

/* Section */
.uud-section {
  margin-bottom: 22px;
}
.uud-section:last-child { margin-bottom: 0; }
.uud-section__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.uud-section__title {
  font-size: 12.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.uud-section__hint {
  font-size: 11.5px;
  opacity: 0.6;
  margin-bottom: 10px;
  font-weight: 500;
}
.uud-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  font-size: 12.5px;
  opacity: 0.65;
}

/* Roles */
.uud-roles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.uud-role-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.uud-role-card {
  display: flex;
  align-items: stretch;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
  position: relative;
}
.uud-role-card:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgba(var(--v-theme-on-surface), 0.25);
}
.uud-role-card.is-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}
.uud-role-card__body {
  flex: 1;
  min-width: 0;
}
.uud-role-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.uud-role-card__name {
  font-weight: 500;
  font-size: 13.5px;
}
.uud-role-card__desc {
  font-size: 11.5px;
  opacity: 0.7;
  line-height: 1.4;
}
.uud-role-card--super_admin.is-active {
  border-color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.05);
}
.uud-role-card--admin.is-active {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}
.uud-role-card--manager.is-active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}
.uud-role-card--cashier.is-active {
  border-color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.05);
}

/* Branches */
.uud-branches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.uud-branch-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 400;
  transition: all 0.15s;
  position: relative;
}
.uud-branch-chip:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.uud-branch-chip.is-active {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}

/* Sucursales bloqueadas (cuando el rol super_admin las activa todas). */
.uud-branches.is-disabled {
  pointer-events: none;
  opacity: 0.85;
}
.uud-branches.is-disabled .uud-branch-chip {
  cursor: not-allowed;
}

/* Banner cuando se seleccionó super_admin. */
.uud-super-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 6px 0 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.07);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}
.uud-super-banner__title {
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 2px;
}
.uud-super-banner__text {
  font-size: 12px;
  line-height: 1.4;
  opacity: 0.85;
}

/* Password */
.uud-pass-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.uud-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.uud-strength__bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}
.uud-strength__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.2s, background 0.2s;
}
.uud-strength__fill--weak     { background: rgb(var(--v-theme-error)); }
.uud-strength__fill--medium   { background: #f59e0b; }
.uud-strength__fill--good     { background: #3b82f6; }
.uud-strength__fill--strong   { background: rgb(var(--v-theme-success)); }
.uud-strength__lbl {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  min-width: 60px;
  text-align: right;
}
.uud-strength__lbl--weak     { color: rgb(var(--v-theme-error)); }
.uud-strength__lbl--medium   { color: #d97706; }
.uud-strength__lbl--good     { color: #2563eb; }
.uud-strength__lbl--strong   { color: rgb(var(--v-theme-success)); }

.uud-rules {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 14px;
}
.uud-rules li {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  opacity: 0.6;
  font-weight: 500;
}
.uud-rules li.ok {
  color: rgb(var(--v-theme-success));
  opacity: 1;
  font-weight: 400;
}

.uud-actions-inline {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.uud-pass-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: rgb(var(--v-theme-success));
  font-weight: 400;
}
.uud-pass-msg.is-error { color: rgb(var(--v-theme-error)); }

/* Footer */
.uud-footer {
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.uud-footer__hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  opacity: 0.7;
  font-weight: 500;
}

@media (max-width: 720px) {
  .uud-grid { grid-template-columns: 1fr; }
  .uud-pass-grid { grid-template-columns: 1fr; }
  .uud-rules { grid-template-columns: 1fr; }
}
</style>
