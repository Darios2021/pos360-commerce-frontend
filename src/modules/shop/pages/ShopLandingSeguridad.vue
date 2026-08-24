<!-- src/modules/shop/pages/ShopLandingSeguridad.vue -->
<!--
  Landing de SEGURIDAD ELECTRONICA (/shop/seguridad).

  Antes traia productos con search:"camara seguridad", que dejaba afuera
  alarmas y cerco perimetral y colaba cosas de otras categorias. Ahora
  consulta la categoria real (SEGURIDAD ELECTRONICA, id 11) con sus tres
  subcategorias, y arma los kits sobre esos mismos productos.
-->
<template>
  <v-container fluid class="shop-page pa-0">

    <!-- ── HERO ── -->
    <section class="hero-fullbleed">
      <div class="hero-inner">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="hero-kicker">San Juan Seguridad</div>
            <h1 class="hero-title">Protegé lo que<br>más importa</h1>
            <p class="hero-sub">
              Videovigilancia, alarmas y cerco perimetral para hogares y
              empresas. Kits armados y listos para instalar, o cada
              componente por separado.
            </p>
            <div class="d-flex ga-2 flex-wrap mt-4">
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Instalación incluida
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Acceso remoto
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Garantía oficial
              </v-chip>
            </div>
          </div>
          <div class="hero-right">
            <img
              src="https://storage-files.cingulado.org/pos360/media/1773003110927-1897e885ea435e0d.webp"
              alt="Seguridad electrónica"
              class="hero-img"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="content pt-6">

      <!-- ── KITS ── -->
      <div class="sec-head">
        <div>
          <div class="text-h6 font-weight-black">Kits armados</div>
          <div class="text-body-2 text-medium-emphasis">
            Combinaciones que funcionan entre sí, con todo el material de instalación.
          </div>
        </div>
      </div>

      <div v-if="cargandoKits" class="product-grid mb-10">
        <v-skeleton-loader v-for="n in 4" :key="n" type="image,article" />
      </div>
      <div v-else-if="kits.length" class="product-grid mb-10">
        <ProductCard v-for="k in kits" :key="k.product_id" :p="k" />
      </div>
      <v-alert v-else type="info" variant="tonal" rounded="lg" class="mb-10">
        Todavía no hay kits cargados en esta categoría.
      </v-alert>

      <!-- ── SERVICIOS ── -->
      <div class="text-h6 font-weight-black mb-4">Soluciones de Seguridad</div>
      <div class="services-grid mb-10">
        <v-card v-for="s in services" :key="s.title" variant="flat" rounded="lg" class="pa-5">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="primary" size="44" rounded="lg">
              <v-icon color="white">{{ s.icon }}</v-icon>
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold">{{ s.title }}</div>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ s.desc }}</div>
        </v-card>
      </div>

      <!-- ── CATALOGO ── -->
      <div class="sec-head">
        <div>
          <div class="text-h6 font-weight-black">Catálogo de Seguridad</div>
          <div class="text-body-2 text-medium-emphasis">
            {{ total }} productos en la categoría
          </div>
        </div>
      </div>

      <!-- Subcategorias reales -->
      <div class="subs-row mb-4">
        <v-chip
          :variant="subSel === null ? 'flat' : 'tonal'"
          :color="subSel === null ? 'primary' : undefined"
          label
          @click="elegirSub(null)"
        >
          Todo
        </v-chip>
        <v-chip
          v-for="s in subcategorias"
          :key="s.id"
          :variant="subSel === s.id ? 'flat' : 'tonal'"
          :color="subSel === s.id ? 'primary' : undefined"
          label
          @click="elegirSub(s.id)"
        >
          {{ titulizar(s.name) }}
        </v-chip>
      </div>

      <!-- Marcas reales de la categoria -->
      <div v-if="marcas.length" class="d-flex align-center ga-2 flex-wrap mb-6">
        <span class="text-caption text-medium-emphasis font-weight-medium">Marcas:</span>
        <v-chip
          v-for="b in marcas"
          :key="b.name"
          size="small"
          :variant="marcaSel === b.name ? 'flat' : 'tonal'"
          color="primary"
          label
          @click="elegirMarca(b.name)"
        >
          {{ titulizar(b.name) }} ({{ b.n }})
        </v-chip>
      </div>

      <div v-if="cargando" class="product-grid mb-6">
        <v-skeleton-loader v-for="n in 8" :key="n" type="image,article" />
      </div>
      <div v-else-if="items.length" class="product-grid mb-6">
        <ProductCard v-for="p in items" :key="p.product_id" :p="p" />
      </div>
      <v-alert v-else type="info" variant="tonal" rounded="lg" class="mb-6">
        No hay productos para ese filtro.
      </v-alert>

      <div v-if="hayMas" class="d-flex justify-center mb-10">
        <v-btn variant="tonal" color="primary" size="large" rounded="lg" :loading="cargandoMas" @click="verMas">
          Ver más productos
        </v-btn>
      </div>

      <!-- ── CTA ── -->
      <v-card class="cta-card" variant="flat" rounded="lg">
        <div class="pa-8 text-center">
          <v-icon size="48" color="white" class="mb-3">mdi-shield-lock</v-icon>
          <div class="text-h5 font-weight-black text-white mb-2">¿Necesitás un sistema a medida?</div>
          <div class="text-body-1 mb-5" style="color:rgba(255,255,255,0.8)">
            Nuestro equipo evalúa tu espacio y te diseña la solución más eficiente. Primera consulta sin cargo.
          </div>
          <v-btn color="white" variant="flat" rounded="lg" size="large" :href="WHATSAPP" target="_blank">
            <v-icon start>mdi-whatsapp</v-icon>
            Hablar con un especialista
          </v-btn>
        </div>
      </v-card>

    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

// SEGURIDAD ELECTRONICA en la taxonomia del shop.
const CATEGORIA_SEGURIDAD = 11;
const POR_PAGINA = 24;
const WHATSAPP = "https://wa.me/5492646000000";

const cargando = ref(true);
const cargandoMas = ref(false);
const cargandoKits = ref(true);

const items = ref([]);
const total = ref(0);
const page = ref(1);

const subcategorias = ref([]);
const subSel = ref(null);
const marcaSel = ref(null);

// Los kits son productos con is_kit=1: se muestran con la misma ProductCard
// que el resto del sitio y se compran por el flujo normal de producto.
const kits = ref([]);

const marcas = ref([]);
const hayMas = computed(() => items.value.length < total.value);

const MINUSCULAS = new Set(["de", "del", "la", "el", "y", "con", "para", "en"]);

function titulizar(s) {
  const txt = String(s || "").toLowerCase().trim();
  if (!txt) return "";
  return txt
    .split(/\s+/)
    .map((w, i) => (i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

async function traer({ reset = false } = {}) {
  if (reset) {
    page.value = 1;
    cargando.value = true;
  } else {
    cargandoMas.value = true;
  }

  try {
    const r = await getCatalog({
      category_id: CATEGORIA_SEGURIDAD,
      subcategory_id: subSel.value,
      include_children: subSel.value == null ? 1 : 0,
      brands: marcaSel.value || "",
      in_stock: 0,
      page: page.value,
      limit: POR_PAGINA,
    });

    // Los kits ya tienen su propia seccion arriba: no se repiten en la grilla.
    const nuevos = (Array.isArray(r?.items) ? r.items : []).filter(
      (p) => !(p?.is_kit === true || Number(p?.is_kit) === 1)
    );
    items.value = reset ? nuevos : [...items.value, ...nuevos];
    total.value = Number(r?.total || 0);
  } catch {
    if (reset) {
      items.value = [];
      total.value = 0;
    }
  } finally {
    cargando.value = false;
    cargandoMas.value = false;
  }
}

function verMas() {
  page.value += 1;
  traer();
}

function elegirSub(id) {
  subSel.value = subSel.value === id ? null : id;
  marcaSel.value = null;
  traer({ reset: true });
}

function elegirMarca(name) {
  marcaSel.value = marcaSel.value === name ? null : name;
  traer({ reset: true });
}

// Una sola pasada por la categoria entera para dos cosas: separar los kits
// del resto y contar las marcas reales. El catalogo visible se pide aparte
// porque se pagina y se filtra.
async function traerKitsYMarcas() {
  try {
    const r = await getCatalog({
      category_id: CATEGORIA_SEGURIDAD,
      include_children: 1,
      in_stock: 0,
      page: 1,
      limit: 200,
    });
    const todos = Array.isArray(r?.items) ? r.items : [];

    kits.value = todos.filter((p) => p?.is_kit === true || Number(p?.is_kit) === 1);

    const cont = new Map();
    for (const p of todos) {
      const b = String(p.brand || "").trim();
      if (!b) continue;
      cont.set(b, (cont.get(b) || 0) + 1);
    }
    marcas.value = [...cont.entries()]
      .map(([name, n]) => ({ name, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8);
  } catch {
    kits.value = [];
  } finally {
    cargandoKits.value = false;
  }
}

const services = [
  { icon: "mdi-cctv",             title: "Videovigilancia",         desc: "Cámaras Turbo HD e IP con visión nocturna a color, acceso remoto y grabación local." },
  { icon: "mdi-alarm-light",      title: "Sistemas de Alarma",      desc: "Centrales cableadas e inalámbricas con sensores de movimiento, apertura y sirenas." },
  { icon: "mdi-fence",            title: "Cerco Perimetral",        desc: "Energizadores, hilo electroplástico y todo el herraje para cerrar el perímetro." },
  { icon: "mdi-fire",             title: "Detección de Incendio",   desc: "Centrales, detectores de humo, avisadores manuales y sirenas con estrobo." },
  { icon: "mdi-server-network",   title: "Racks y Redes",           desc: "Switches PoE, gabinetes murales, bandejas y organizadores para la instalación." },
  { icon: "mdi-tools",            title: "Instalación Profesional", desc: "Técnicos certificados con garantía de instalación y soporte post-venta." },
];

onMounted(async () => {
  traerKitsYMarcas();
  try {
    subcategorias.value = await getPublicCategoryChildren(CATEGORIA_SEGURIDAD);
  } catch {
    subcategorias.value = [];
  }
  await traer({ reset: true });
});
</script>

<style scoped>
.shop-page { --shop-max: 1200px; padding: 0 !important; background: #ebebeb !important; }

.content {
  width: min(var(--shop-max, 1200px), calc(100% - 32px));
  margin: 0 auto;
  padding-bottom: 24px;
}

.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

/* Hero full-bleed */
.hero-fullbleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  background: #02498b;
  border-radius: 0 0 14px 14px;
  overflow: hidden;
}
.hero-inner {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  align-items: center;
  gap: 24px;
}
.hero-kicker { font-size: 11px; letter-spacing: 2px; font-weight: 400; opacity: .7; color: white; text-transform: uppercase; margin-bottom: 10px; }
.hero-title { margin: 0 0 12px; color: white; font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.1; font-weight: 500; }
.hero-sub { margin: 0; color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.6; max-width: 480px; }
.hero-right { display: flex; justify-content: flex-end; align-items: center; }
.hero-img { width: 400px; height: 200px; object-fit: contain; }

/* Subcategorias */
.subs-row { display: flex; gap: 8px; flex-wrap: wrap; }

/* Grilla de productos: misma definicion que ShopCategory, para que las
   tarjetas midan igual en las dos pantallas */
.product-grid{
  display:grid !important;
  gap:12px !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  margin: 0 auto !important;
}
.product-grid .grid-item,
.product-grid .grid-item > *{
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}
@media (max-width: 1100px){
  .product-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
}
@media (max-width: 960px){
  .product-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
}

/* Services */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

/* CTA */
.cta-card { background: linear-gradient(135deg, #02498b 0%, #013066 100%) !important; margin-bottom: 32px; }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-right { display: none; }
}
@media (max-width: 600px) {
  .hero-inner { padding: 28px 0; }
}
</style>
