<!-- src/modules/auth/pages/LoginPage.vue -->
<template>
  <v-container fluid class="auth-bg">
    <v-card class="login-card" rounded="xl" elevation="2">
      <v-card-title class="text-h6 font-weight-bold">Ingresar</v-card-title>
      <v-divider />
      <v-card-text class="pt-5">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="identifier"
            label="Usuario o email"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            autocomplete="username"
          />
          <v-text-field
            v-model="password"
            label="Contraseña"
            type="password"
            variant="outlined"
            density="comfortable"
            autocomplete="current-password"
          />

          <v-btn
            class="mt-4"
            block
            color="primary"
            size="large"
            type="submit"
            :loading="loading"
          >
            ENTRAR
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();

const identifier = ref("admin@360pos.local");
const password = ref("360pos1234");

const loading = ref(false);
const error = ref(null);

async function submit() {
  loading.value = true;
  error.value = null;
  try {
    await auth.login({ identifier: identifier.value, password: password.value });
    router.push({ name: "home" });
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "Error de login";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-bg {
  min-height: 100vh;
  padding: 24px;

  /* ✅ centrado robusto, sin depender de v-row/v-col */
  display: flex;
  align-items: center;
  justify-content: center;

  /* opcional: si querés un fondo suave */
  /* background: radial-gradient(circle at 30% 20%, rgba(20,136,209,.12), transparent 45%),
              radial-gradient(circle at 80% 70%, rgba(7,28,48,.10), transparent 45%),
              #fff; */
}

.login-card {
  width: 100%;
  max-width: 420px; /* ✅ evita que quede angosto o gigante */
}
</style>
