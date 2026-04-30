<!-- /admin/shop/branding — Hub con cards de acceso a cada sub-sección -->

<template>
  <v-container class="mx-auto" style="max-width: 1100px">
    <AppPageHeader
      icon="mdi-storefront-outline"
      title="Branding y configuración"
      subtitle="Gestioná la imagen, los datos de contacto y los puntos físicos del shop. Cada sección abajo controla un aspecto distinto del shop público y de los emails CRM."
    />

    <v-row dense>
      <v-col v-for="card in cards" :key="card.name" cols="12" md="6">
        <v-card
          rounded="xl"
          variant="tonal"
          class="pa-4 hub-card"
          :to="card.to"
          link
        >
          <div class="d-flex align-start ga-3">
            <v-avatar
              size="44"
              rounded="lg"
              :color="card.color"
              variant="tonal"
            >
              <v-icon size="22">{{ card.icon }}</v-icon>
            </v-avatar>

            <div class="flex-grow-1 min-w-0">
              <div class="text-subtitle-1 font-weight-medium hub-card-title">{{ card.title }}</div>
              <div class="text-body-2 text-medium-emphasis mt-1 hub-card-desc">{{ card.desc }}</div>
              <div v-if="card.meta" class="text-caption text-medium-emphasis mt-2 hub-card-meta">
                <v-icon size="12" class="me-1">mdi-information-outline</v-icon>
                {{ card.meta }}
              </div>
            </div>

            <v-icon class="hub-card-arrow text-medium-emphasis">mdi-chevron-right</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const cards = [
  {
    name: "identity",
    to: { name: "shopBrandingIdentity" },
    icon: "mdi-storefront-outline",
    color: "primary",
    title: "Identidad visual",
    desc: "Nombre del shop, logo, favicon e imagen para previews de WhatsApp / redes (OG).",
    meta: "Aparece en el header del shop y en los previews al compartir links.",
  },
  {
    name: "theme",
    to: { name: "shopBrandingTheme" },
    icon: "mdi-palette-outline",
    color: "purple",
    title: "Tema de colores",
    desc: "Color primary (header, footer, botones) y secondary (acentos, links).",
    meta: "Se aplica al shop público sin redeploy.",
  },
  {
    name: "branches",
    to: { name: "adminBranches" },
    icon: "mdi-map-marker-multiple-outline",
    color: "success",
    title: "Sucursales",
    desc: "Puntos físicos de retiro y venta, con ubicación geográfica para el mapa del checkout.",
    meta: "Cada sucursal se carga con su lat/lng en un mapa real. El cliente las ve al elegir retiro.",
  },
  {
    name: "contact",
    to: { name: "shopBrandingContact" },
    icon: "mdi-card-account-mail-outline",
    color: "warning",
    title: "Contacto del negocio",
    desc: "Dirección principal, teléfonos visibles, horarios, tagline. Se usa en el pie de los emails CRM.",
    meta: "Una sola dirección — son los datos institucionales del shop, no de cada sucursal.",
  },
  {
    name: "social",
    to: { name: "shopBrandingSocial" },
    icon: "mdi-share-variant-outline",
    color: "pink",
    title: "Íconos de redes sociales",
    desc: "Subí los íconos custom (PNG cuadrado) para Instagram, Facebook, WhatsApp, etc.",
    meta: "Si no subís ninguno, los emails usan iniciales coloreadas como fallback.",
  },
];
</script>

<style scoped>
.min-w-0 { min-width: 0; }

.hub-card {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
}
.hub-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
}

.hub-card-title {
  letter-spacing: -0.005em;
  line-height: 1.25;
}

.hub-card-desc {
  line-height: 1.45;
}

.hub-card-meta {
  font-style: italic;
  line-height: 1.4;
  display: flex;
  align-items: center;
}

.hub-card-arrow {
  transition: transform 0.18s ease;
  flex-shrink: 0;
}
.hub-card:hover .hub-card-arrow {
  transform: translateX(3px);
}
</style>
