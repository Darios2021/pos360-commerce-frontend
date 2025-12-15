<script setup>
import { ref } from "vue";
import { useAuthStore } from "../../../app/store/auth.store";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const identifier = ref("admin@360pos.local");
const password = ref("360pos1234");
const loading = ref(false);
const errorMsg = ref("");

const submit = async () => {
  errorMsg.value = "";
  loading.value = true;
  try {
    await auth.login({
      identifier: identifier.value,
      password: password.value,
    });
    await auth.me();
    router.push({ name: "home" });
  } catch {
    errorMsg.value = auth.error || "Error de login";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="xl" elevation="2" class="pa-6" max-width="520">
      <div class="text-h6 font-weight-bold mb-2">Ingresar</div>

      <v-alert
        v-if="errorMsg"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMsg }}
      </v-alert>

      <v-text-field
        v-model="identifier"
        label="Usuario o email"
        autocomplete="username"
      />

      <v-text-field
        v-model="password"
        label="Contraseña"
        type="password"
        autocomplete="current-password"
      />

      <v-btn
        class="mt-4"
        block
        color="primary"
        :loading="loading"
        @click="submit"
      >
        Entrar
      </v-btn>
    </v-card>
  </v-container>
</template>
