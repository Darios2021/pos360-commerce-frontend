<!--
  ShopAccountProfile (ML-like)
  ----------------------------
  Página de "Perfil". Estilo ML: card blanca limpia, secciones claras
  (Datos personales / Contraseña), botones primary al pie. Email readonly.
-->
<template>
  <section class="prof">
    <header class="prof-head">
      <h1 class="prof-head__title">Perfil</h1>
    </header>

    <v-alert
      v-if="!auth.isProfileComplete"
      type="warning"
      variant="tonal"
      density="compact"
      class="prof-warn"
      icon="mdi-alert-circle-outline"
    >
      Completá tus datos para seguir comprando.
    </v-alert>

    <v-form ref="formRef" v-model="valid" @submit.prevent="onSubmit" class="prof-card">
      <!-- Datos personales -->
      <div class="prof-section">
        <div class="prof-section__title">Datos personales</div>

        <div class="prof-grid prof-grid--two">
          <v-text-field
            v-model="form.first_name"
            label="Nombre"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            :rules="rulesRequired('Nombre')"
            :disabled="loading"
            hide-details="auto"
          />
          <v-text-field
            v-model="form.last_name"
            label="Apellido"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            :rules="rulesRequired('Apellido')"
            :disabled="loading"
            hide-details="auto"
          />
        </div>

        <v-text-field
          v-model="form.email"
          label="Email"
          variant="outlined"
          density="comfortable"
          bg-color="grey-lighten-4"
          readonly
          prepend-inner-icon="mdi-email-outline"
          hide-details="auto"
        />

        <v-text-field
          v-model="form.phone"
          label="Teléfono"
          placeholder="Ej: 11 5555 5555"
          variant="outlined"
          density="comfortable"
          bg-color="white"
          :rules="rulesPhone"
          :disabled="loading"
          prepend-inner-icon="mdi-phone-outline"
          hide-details="auto"
        />
      </div>

      <v-divider />

      <!-- Contraseña -->
      <div class="prof-section">
        <div class="prof-section__title">Contraseña</div>
        <p v-if="needsPassword" class="prof-section__hint">
          Elegí una contraseña para tu cuenta.
        </p>

        <div class="prof-grid prof-grid--two">
          <v-text-field
            v-model="form.password"
            label="Nueva contraseña"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            autocomplete="new-password"
            :type="showPass ? 'text' : 'password'"
            :rules="rulesPassword"
            :disabled="loading"
            :append-inner-icon="showPass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="showPass = !showPass"
            hide-details="auto"
          />
          <v-text-field
            v-model="form.password_repeat"
            label="Repetir contraseña"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            autocomplete="new-password"
            :type="showPass ? 'text' : 'password'"
            :rules="rulesPasswordRepeat"
            :disabled="loading"
            hide-details="auto"
          />
        </div>

        <div v-if="form.password" class="prof-checks">
          <span class="prof-check" :class="{ 'is-ok': passLen }">
            <v-icon size="14">{{ passLen ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
            8 caracteres mínimo
          </span>
          <span class="prof-check" :class="{ 'is-ok': passUpper }">
            <v-icon size="14">{{ passUpper ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
            Una mayúscula
          </span>
          <span class="prof-check" :class="{ 'is-ok': passDigit }">
            <v-icon size="14">{{ passDigit ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
            Un número
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="prof-foot">
        <v-alert v-if="errorMsg"   type="error"   variant="tonal" density="compact">{{ errorMsg }}</v-alert>
        <v-alert v-if="successMsg" type="success" variant="tonal" density="compact">{{ successMsg }}</v-alert>

        <div class="prof-foot__actions">
          <v-btn
            class="prof-btn prof-btn--cancel"
            variant="outlined"
            rounded="lg"
            :disabled="loading"
            @click="resetForm"
          >
            Cancelar
          </v-btn>
          <v-btn
            class="prof-btn prof-btn--save"
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="loading"
            :disabled="!canSubmit"
            type="submit"
          >
            Guardar cambios
          </v-btn>
        </div>
      </div>
    </v-form>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const auth = useShopAuthStore();

const formRef = ref(null);
const valid = ref(false);
const loading = ref(false);
const showPass = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

const form = reactive({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_repeat: "",
});

const needsPassword = computed(() => !auth.isProfileComplete);

function hydrate() {
  const c = auth.customer || {};
  form.first_name = c.first_name || "";
  form.last_name = c.last_name || "";
  form.email = c.email || "";
  form.phone = c.phone || "";
  form.password = "";
  form.password_repeat = "";
  errorMsg.value = "";
  successMsg.value = "";
}

watch(() => auth.customer?.id, hydrate, { immediate: true });

function resetForm() { hydrate(); }

function rulesRequired(label) {
  return [(v) => (!!v && String(v).trim().length >= 2) || `${label} es requerido`];
}
const rulesPhone = [
  (v) => !!v || "Teléfono es requerido",
  (v) => String(v || "").replace(/\D/g, "").length >= 8 || "Teléfono inválido",
];

const passLen   = computed(() => String(form.password || "").length >= 8);
const passUpper = computed(() => /[A-Z]/.test(form.password || ""));
const passDigit = computed(() => /[0-9]/.test(form.password || ""));

const rulesPassword = [
  (v) => {
    if (!v && !needsPassword.value) return true;
    if (!v) return "Contraseña es requerida";
    if (v.length < 8) return "Mínimo 8 caracteres";
    if (!/[A-Z]/.test(v)) return "Debe tener una mayúscula";
    if (!/[0-9]/.test(v)) return "Debe tener un número";
    return true;
  },
];
const rulesPasswordRepeat = [
  (v) => {
    if (!form.password) return true;
    if (!v) return "Repetí la contraseña";
    if (v !== form.password) return "Las contraseñas no coinciden";
    return true;
  },
];

const canSubmit = computed(() => {
  if (loading.value) return false;
  if (!form.first_name?.trim() || !form.last_name?.trim() || !form.phone) return false;
  if (needsPassword.value) {
    return passLen.value && passUpper.value && passDigit.value && form.password === form.password_repeat;
  }
  if (form.password) {
    return passLen.value && passUpper.value && passDigit.value && form.password === form.password_repeat;
  }
  return true;
});

async function onSubmit() {
  errorMsg.value = "";
  successMsg.value = "";
  const v = await formRef.value?.validate?.();
  if (v && v.valid === false) return;

  loading.value = true;
  try {
    await auth.updateProfile({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone,
      password: form.password || undefined,
    });
    successMsg.value = "Datos actualizados correctamente.";
    form.password = "";
    form.password_repeat = "";
  } catch (e) {
    errorMsg.value = friendly(e);
  } finally {
    loading.value = false;
  }
}

function friendly(e) {
  const code = e?.data?.error || e?.friendlyMessage || e?.message || "";
  const map = {
    FIRST_NAME_REQUIRED: "El nombre es requerido.",
    LAST_NAME_REQUIRED: "El apellido es requerido.",
    PHONE_INVALID: "Ingresá un teléfono válido (mínimo 8 dígitos).",
    PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
    PASSWORD_NEEDS_UPPER: "La contraseña debe tener al menos una mayúscula.",
    PASSWORD_NEEDS_DIGIT: "La contraseña debe tener al menos un número.",
    NOT_LOGGED_IN: "Tu sesión expiró, volvé a entrar.",
  };
  return map[code] || "No pudimos guardar los datos. Intentá nuevamente.";
}
</script>

<style scoped>
.prof { color: #111827; }

.prof-head { margin: 0 0 16px; }
.prof-head__title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: #111827;
}
.prof-head__sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}

.prof-warn { margin-bottom: 14px; }

@media (max-width: 600px) {
  /* Tab arriba ya dice "Perfil" — evitar duplicación */
  .prof-head { display: none; }
}

.prof-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.10);
  overflow: hidden;
}

.prof-section {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.prof-section__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111827;
}
.prof-section__hint {
  margin: -8px 0 0;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.4;
}

.prof-grid--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.prof-checks {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 4px;
}
.prof-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}
.prof-check.is-ok { color: #00853f; }

.prof-foot {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px 22px;
  background: #fafafa;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.prof-foot__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Botones del perfil — pill, peso medio, sin caps forzadas */
.prof-btn {
  text-transform: none !important;
  letter-spacing: -0.005em !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  height: 44px !important;
  min-width: 130px !important;
  padding: 0 22px !important;
  box-shadow: none !important;
}
.prof-btn--save {
  box-shadow: 0 4px 14px -4px rgba(20, 136, 209, 0.4) !important;
}
.prof-btn--save:active {
  box-shadow: 0 2px 6px -2px rgba(20, 136, 209, 0.4) !important;
}
.prof-btn--cancel {
  border-color: rgba(0, 0, 0, 0.14) !important;
  color: rgba(0, 0, 0, 0.7) !important;
}
.prof-btn--cancel:hover { background: rgba(0, 0, 0, 0.04) !important; }

@media (max-width: 600px) {
  .prof-grid--two { grid-template-columns: 1fr; }
  .prof-section { padding: 18px 18px; }
  .prof-foot { padding: 14px 18px 20px; }
  .prof-foot__actions {
    flex-direction: row;
    gap: 8px;
  }
  .prof-foot__actions .prof-btn {
    flex: 1;
    min-width: 0 !important;
  }
  .prof-foot__actions .prof-btn--cancel { flex: 0 0 auto; min-width: 96px !important; }
}
</style>
