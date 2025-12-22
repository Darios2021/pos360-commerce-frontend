<template>
  <v-card class="rounded-xl" elevation="1">
    <v-card-text class="d-flex align-center justify-space-between">
      <div>
        <div class="text-caption text-medium-emphasis">{{ title }}</div>

        <div class="text-h6 font-weight-black">
          <span v-if="!loading">{{ value }}</span>
          <v-skeleton-loader v-else type="text" width="120" />
        </div>
      </div>

      <v-avatar color="primary" variant="tonal" size="44">
        <v-icon :icon="icon" />
      </v-avatar>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  title: { type: String, default: "" },
  value: { type: [String, Number], default: "—" },
  icon: { type: String, default: "mdi-information-outline" },
  loading: { type: Boolean, default: false },
});
</script>
