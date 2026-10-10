<!-- src/modules/shop/components/ShopLineasBar.vue -->
<!-- Franja superior con las cuatro lineas del negocio, por prioridad: la tienda
     primero y activa, despues seguridad electronica, servicio tecnico y
     desarrollo. Va arriba de la cabecera y no es fija: al bajar se va y queda
     la cabecera de la tienda como siempre. Reemplaza a los tres enlaces que
     estaban mezclados con Categorias en la barra de navegacion. -->
<template>
  <div class="lineas">
    <div class="lineas-in">
      <nav class="lineas-nav" aria-label="San Juan Tecnología">
        <router-link
          v-for="l in lineas"
          :key="l.name"
          :to="{ name: l.name }"
          class="lineas-a"
          :class="{ on: activa === l.name }"
        >{{ l.t }}</router-link>
      </nav>
      <a href="#shop-sucursales" class="lineas-suc" @click.prevent="irASucursales">
        <v-icon size="15">mdi-map-marker-outline</v-icon>
        Sucursales Rivadavia y Chimbas · Lun a Vie 9 a 13 y 17 a 21 hs
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const lineas = [
  { t: "Tienda", name: "shopHome" },
  { t: "Seguridad electrónica", name: "shopLandingSeguridad" },
  { t: "Servicio técnico", name: "shopLandingServicioTecnico" },
  { t: "Desarrollo de software", name: "shopLandingSistemas" },
];

const otras = new Set(lineas.slice(1).map((l) => l.name));
const activa = computed(() => (otras.has(route.name) ? route.name : "shopHome"));

function irASucursales() {
  const el = document.getElementById("shop-sucursales");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<style scoped>
.lineas {
  background: #011e3d;
  color: #fff;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.lineas-in {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.lineas-nav {
  display: flex;
  height: 100%;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.lineas-nav::-webkit-scrollbar { display: none; }
.lineas-a {
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: color 0.2s;
}
.lineas-a:hover { color: #fff; }
.lineas-a.on {
  color: #fff;
  font-weight: 600;
  border-bottom-color: #3fa9f5;
}
.lineas-suc {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  white-space: nowrap;
}
.lineas-suc:hover { color: #fff; }

@media (max-width: 960px) {
  .lineas-in { padding: 0 8px; gap: 0; }
  .lineas-suc { display: none; }
}
</style>
