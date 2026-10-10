<!-- src/modules/shop/components/HomeSeguridadInstalacion.vue -->
<!-- Bloque de la portada para la segunda linea del negocio: los kits de
     seguridad de la tienda, con instalacion y monitoreo opcional con abono.
     Los kits salen del catalogo (categoria 11) con el mismo criterio que la
     landing de seguridad: is_kit=1 o la lista de ids. Sin kits no se dibuja. -->
<template>
  <section v-if="kits.length" class="seg">
    <div class="seg-txt">
      <div class="seg-kick">SAN JUAN SEGURIDAD</div>
      <h2>Kits de seguridad con instalación</h2>
      <p>Cámaras y alarmas de la tienda, instaladas por el equipo propio.</p>
      <ol class="seg-pasos">
        <li><span>1</span><div>Elección del kit</div></li>
        <li><span>2</span><div>Instalación en casa o comercio</div></li>
        <li><span>3</span><div>Monitoreo 24 horas<small>Opcional, con abono mensual</small></div></li>
      </ol>
      <div class="seg-acc">
        <a class="seg-btn" :href="whatsapp" target="_blank" rel="noopener">
          <v-icon size="18">mdi-whatsapp</v-icon>
          Pedir instalación
        </a>
        <router-link class="seg-link" :to="{ name: 'shopLandingSeguridad' }">Ver seguridad electrónica</router-link>
      </div>
    </div>
    <div class="seg-kits">
      <ProductCard v-for="k in kits" :key="k.product_id" :p="k" />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import ProductCard from "@/modules/shop/components/ProductCard.vue";

const CATEGORIA_SEGURIDAD = 11;
// Mismo criterio que ShopLandingSeguridad.vue
const KITS_POR_ID = new Set([466, 588, 589, 603, 604]);
const MAXIMO = 3;

const whatsapp =
  "https://wa.me/5492644392150?text=" +
  encodeURIComponent("Hola, quiero consultar por un kit de seguridad con instalación.");

const kits = ref([]);

function esKit(p) {
  if (p?.is_kit === true || Number(p?.is_kit) === 1) return true;
  return KITS_POR_ID.has(Number(p?.product_id));
}

onMounted(async () => {
  // La categoria no entra en una pagina (la API topea limit en 100) y los
  // kits quedan en la segunda: se recorren todas, como en la landing.
  try {
    const encontrados = [];
    let pagina = 1;
    let paginas = 1;
    do {
      const r = await getCatalog({ category_id: CATEGORIA_SEGURIDAD, include_children: 1, in_stock: 0, page: pagina, limit: 100 });
      const lote = Array.isArray(r?.items) ? r.items : [];
      encontrados.push(...lote.filter(esKit));
      paginas = Number(r?.pages || 1);
      pagina += 1;
      if (!lote.length) break;
    } while (pagina <= paginas && pagina <= 10 && encontrados.length < MAXIMO);
    kits.value = encontrados.slice(0, MAXIMO);
  } catch {
    kits.value = [];
  }
});
</script>

<style scoped>
.seg {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 32px;
  align-items: center;
  padding: 32px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(120deg, #011e3d 0%, #02498b 70%, #0b6fc0 100%);
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.seg-kick {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #8fcbf5;
}
.seg h2 {
  margin: 10px 0 12px;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: #fff;
}
.seg p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}
.seg-pasos {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0 24px;
  padding: 0;
  list-style: none;
}
.seg-pasos li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
}
.seg-pasos span {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  font-size: 13px;
  font-weight: 700;
}
.seg-pasos small {
  display: block;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.65);
}
.seg-acc {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 22px;
  border-radius: 10px;
  background: #25d366;
  color: #fff !important;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}
.seg-btn:hover { background: #1ebe5a; }
.seg-link {
  color: #fff !important;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.seg-kits {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  color: initial;
}

@media (max-width: 960px) {
  .seg {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 24px 16px;
  }
  .seg h2 { font-size: 25px; }
  .seg-pasos { margin: 16px 0 18px; }
  .seg-acc { flex-direction: column; align-items: stretch; gap: 12px; }
  .seg-btn { justify-content: center; }
  .seg-link { text-align: center; }
  .seg-kits {
    grid-template-columns: repeat(3, 72%);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .seg-kits > * { scroll-snap-align: start; }
}
</style>
