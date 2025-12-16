<template>
  <v-container class="py-8">
    <v-card class="mx-auto" max-width="900" rounded="xl" elevation="2">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">POS360 Frontend</div>
          <div class="text-caption text-medium-emphasis">
            Dashboard inicial (links rápidos).
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-6 d-flex ga-3 flex-wrap">
        <v-btn color="primary" prepend-icon="mdi-package-variant" @click="$router.push('/products')">
          IR A PRODUCTOS
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-warehouse" @click="$router.push('/stock')">
          IR A STOCK
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>
