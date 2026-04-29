<!--
  ShopCompleteProfileDialog
  -------------------------
  Dialog persistente que aparece cuando el cliente está logueado pero
  `profile_completed = false` en el backend. Bloquea la operación normal
  del shop (favoritos, checkout, etc.) hasta que complete:
    - Nombre
    - Apellido
    - Teléfono (Argentina)
    - Password (mínimo 8, una mayúscula, un número) + repetir

  El email es readonly (es la identidad de Google).
  No se puede cerrar con ESC ni clic afuera. La única salida es completar
  el perfil o cerrar sesión (botón inferior).
-->
<template>
  <v-dialog
    v-model="open"
    persistent
    max-width="540"
    scrollable
    :fullscreen="$vuetify?.display?.smAndDown"
    transition="dialog-bottom-transition"
  >
    <v-card class="scp" rounded="lg" elevation="0">
      <!-- Header con icono + título -->
      <div class="scp-head">
        <div class="scp-head__icon">
          <v-icon size="22">mdi-shield-account-outline</v-icon>
        </div>
        <div class="scp-head__text">
          <div class="scp-head__title">Completá tu perfil</div>
          <div class="scp-head__sub">Para comprar y guardar favoritos necesitamos algunos datos.</div>
        </div>
      </div>

      <v-divider />

      <!-- Body: formulario -->
      <v-form ref="formRef" v-model="valid" @submit.prevent="onSubmit" class="scp-body">
        <!-- Nombres -->
        <div class="scp-row scp-row--two">
          <v-text-field
            v-model="form.first_name"
            label="Nombre"
            variant="outlined"
            density="comfortable"
            autocomplete="given-name"
            :rules="rulesRequired('Nombre')"
            :disabled="loading"
            hide-details="auto"
          />
          <v-text-field
            v-model="form.last_name"
            label="Apellido"
            variant="outlined"
            density="comfortable"
            autocomplete="family-name"
            :rules="rulesRequired('Apellido')"
            :disabled="loading"
            hide-details="auto"
          />
        </div>

        <!-- Email readonly -->
        <v-text-field
          v-model="form.email"
          label="Email"
          variant="outlined"
          density="comfortable"
          readonly
          persistent-hint
          hint="Asociado a tu cuenta de Google"
          prepend-inner-icon="mdi-email-outline"
          hide-details="auto"
          class="scp-readonly"
        />

        <!-- Teléfono -->
        <v-text-field
          v-model="form.phone"
          label="Teléfono"
          placeholder="Ej: 11 5555 5555"
          variant="outlined"
          density="comfortable"
          autocomplete="tel"
          :rules="rulesPhone"
          :disabled="loading"
          prepend-inner-icon="mdi-phone-outline"
          hide-details="auto"
        />

        <v-divider class="scp-sep" />

        <!-- Password -->
        <div class="scp-pass-title">
          <v-icon size="16" color="primary">mdi-lock-outline</v-icon>
          Elegí una contraseña
          <span class="scp-pass-title__hint">Te servirá para entrar también sin Google.</span>
        </div>

        <v-text-field
          v-model="form.password"
          :label="'Contraseña'"
          variant="outlined"
          density="comfortable"
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
          autocomplete="new-password"
          :type="showPass ? 'text' : 'password'"
          :rules="rulesPasswordRepeat"
          :disabled="loading"
          hide-details="auto"
        />

        <!-- Checklist de requisitos -->
        <div class="scp-pass-checks">
          <div class="scp-check" :class="{ 'is-ok': passLen }">
            <v-icon size="14">{{ passLen ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
            Mínimo 8 caracteres
          </div>
          <div class="scp-check" :class="{ 'is-ok': passUpper }">
            <v-icon size="14">{{ passUpper ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
            Una mayúscula
          </div>
          <div class="scp-check" :class="{ 'is-ok': passDigit }">
            <v-icon size="14">{{ passDigit ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
            Un número
          </div>
        </div>

        <!-- Error global -->
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          density="compact"
          class="scp-error"
        >
          {{ errorMsg }}
        </v-alert>
      </v-form>

      <v-divider />

      <!-- Footer con acciones -->
      <div class="scp-foot">
        <v-btn
          variant="text"
          size="small"
          :disabled="loading"
          @click="onLogout"
        >
          Cerrar sesión
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="flat"
          size="large"
          :loading="loading"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          Guardar y continuar
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "completed"]);

const auth = useShopAuthStore();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const formRef = ref(null);
const valid = ref(false);
const loading = ref(false);
const showPass = ref(false);
const errorMsg = ref("");

const form = reactive({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_repeat: "",
});

/* Hidrata el form cuando se abre con los datos que ya tengamos del customer */
watch(
  () => [props.modelValue, auth.customer?.id],
  () => {
    if (!props.modelValue) return;
    const c = auth.customer || {};
    form.first_name = c.first_name || "";
    form.last_name = c.last_name || "";
    form.email = c.email || "";
    form.phone = c.phone || "";
    form.password = "";
    form.password_repeat = "";
    errorMsg.value = "";
  },
  { immediate: true }
);

/* Validaciones */
function rulesRequired(label) {
  return [
    (v) => (!!v && String(v).trim().length >= 2) || `${label} es requerido`,
  ];
}

const rulesPhone = [
  (v) => !!v || "Teléfono es requerido",
  (v) => String(v || "").replace(/\D/g, "").length >= 8 || "Teléfono inválido",
];

const passLen = computed(() => String(form.password || "").length >= 8);
const passUpper = computed(() => /[A-Z]/.test(form.password || ""));
const passDigit = computed(() => /[0-9]/.test(form.password || ""));

const rulesPassword = [
  (v) => !!v || "Contraseña es requerida",
  (v) => (v || "").length >= 8 || "Mínimo 8 caracteres",
  (v) => /[A-Z]/.test(v || "") || "Debe tener una mayúscula",
  (v) => /[0-9]/.test(v || "") || "Debe tener un número",
];

const rulesPasswordRepeat = [
  (v) => !!v || "Repetí la contraseña",
  (v) => v === form.password || "Las contraseñas no coinciden",
];

const canSubmit = computed(
  () =>
    !loading.value &&
    !!form.first_name?.trim() &&
    !!form.last_name?.trim() &&
    !!form.phone &&
    passLen.value &&
    passUpper.value &&
    passDigit.value &&
    form.password === form.password_repeat
);

async function onSubmit() {
  errorMsg.value = "";
  const v = await formRef.value?.validate?.();
  if (v && v.valid === false) return;

  loading.value = true;
  try {
    await auth.updateProfile({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone,
      password: form.password,
    });
    emit("completed");
    emit("update:modelValue", false);
  } catch (e) {
    errorMsg.value = friendly(e);
  } finally {
    loading.value = false;
  }
}

async function onLogout() {
  try {
    await auth.logout();
  } finally {
    emit("update:modelValue", false);
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
/* Paleta explícita: el dialog vive fuera del .scope-shop (Vuetify lo
   teleporta al body), así que no podemos confiar en las CSS vars del
   theme runtime. Usamos colores fijos consistentes con la cuenta. */
.scp {
  background: #ffffff;
  color: #111827;
  overflow: hidden;
}

.scp-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 22px 18px;
}
.scp-head__icon {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(20, 136, 209, 0.12);
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.scp-head__text { flex: 1 1 auto; min-width: 0; }
.scp-head__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: #111827;
}
.scp-head__sub {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
  line-height: 1.35;
}

.scp-body {
  padding: 18px 22px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  max-height: 65vh;
  background: #ffffff;
}
.scp-row--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.scp-readonly :deep(.v-field) {
  background: #f5f5f7;
}
.scp-sep { margin: 4px 0 2px; opacity: 0.6; }

.scp-pass-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;
  color: #111827;
}
.scp-pass-title__hint {
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin-left: 2px;
}

.scp-pass-checks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 10px;
  margin-top: 2px;
}
.scp-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.1;
}
.scp-check.is-ok { color: #00853f; }

.scp-error { margin-top: 4px; }

.scp-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: #fafafa;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

@media (max-width: 600px) {
  .scp-row--two { grid-template-columns: 1fr; }
  .scp-pass-checks { grid-template-columns: 1fr 1fr; }
  .scp-body { max-height: none; }
}
</style>
