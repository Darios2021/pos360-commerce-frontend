<script setup>
import { useAuthStore } from "./app/store/auth.store";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const logout = () => {
  auth.logout();
  router.push({ name: "login" });
};
</script>

<template>
  <v-app>
    <v-app-bar elevation="1">
      <v-app-bar-title class="font-weight-bold">POS360</v-app-bar-title>
      <v-spacer />

      <v-chip
        v-if="auth.user"
        class="mr-3"
        label
      >
        {{ auth.user.username }} · {{ (auth.user.roles || []).join(", ") }}
      </v-chip>

      <v-btn v-if="auth.isAuthed" variant="text" @click="logout">
        Salir
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
