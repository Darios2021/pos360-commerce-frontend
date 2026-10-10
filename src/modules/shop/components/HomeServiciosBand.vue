<!-- src/modules/shop/components/HomeServiciosBand.vue -->
<!-- Banda de la portada, antes del pie, para la tercera y cuarta linea del
     negocio: servicio tecnico y desarrollo de software. -->
<template>
  <section class="serv">
    <router-link class="serv-card" :to="{ name: 'shopLandingServicioTecnico' }">
      <span class="serv-ico"><v-icon size="24">mdi-wrench-outline</v-icon></span>
      <h3>Servicio técnico</h3>
      <p>Reparación y mantenimiento de equipos, con diagnóstico en el local.</p>
      <span class="serv-ver">Ver el servicio</span>
    </router-link>
    <router-link class="serv-card" :to="{ name: 'shopLandingSistemas' }">
      <span class="serv-ico"><v-icon size="24">mdi-code-tags</v-icon></span>
      <h3>Desarrollo de software</h3>
      <p>POS 360, VOBRA, SAZONIK y software a medida para comercios y empresas.</p>
      <span class="serv-ver">Ver los productos</span>
    </router-link>
  </section>
</template>

<style scoped>
.serv {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.serv-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.25s;
}
.serv-card:hover { box-shadow: 0 12px 28px rgba(2, 73, 139, 0.14); }
.serv-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #e8f2fb;
  color: #02498b;
}
.serv-card h3 {
  margin: 4px 0 0;
  font-size: 19px;
  font-weight: 700;
  color: #1f2024;
}
.serv-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
}
.serv-ver {
  margin-top: auto;
  font-size: 14px;
  font-weight: 600;
  color: #02498b;
}

@media (max-width: 700px) {
  .serv { grid-template-columns: 1fr; }
}
</style>
