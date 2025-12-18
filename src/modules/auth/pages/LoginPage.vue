<!-- src/modules/auth/pages/LoginPage.vue -->
<template>
  <v-container fluid class="auth-bg">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="10" md="6" lg="4" xl="3">
        <v-card class="mx-auto" rounded="xl" elevation="2">
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
              />
              <v-text-field
                v-model="password"
                label="Contraseña"
                type="password"
                variant="outlined"
                density="comfortable"
              />

              <v-btn class="mt-4" block color="primary" size="large" type="submit" :loading="loading">
                ENTRAR
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
}
</style>
