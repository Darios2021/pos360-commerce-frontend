<!-- src/modules/shop/pages/ShopEmpresa.vue -->
<!--
  Portada institucional (/shop/empresa).

  San Juan Tecnologia no vende solo productos: tiene tres unidades, y hasta
  ahora las tres vivian escondidas en un renglon del menu. Esta pantalla las
  pone adelante, con la tienda como una seccion mas.

  ⚠ Direccion de prueba. La portada definitiva es la raiz del dominio, y eso
  se decide en pos360-edge (hoy "/" redirige a "/shop/"). Esta ruta existe para
  poder verla funcionando sin tocar el proxy.

  Todo lo que muestra sale del catalogo: los kits de SEGURIDAD ELECTRONICA (11),
  el abono de MONITOREO (88) y la mano de obra (subcategoria 67). Nada escrito
  a mano: si un dato no esta cargado, el bloque no se dibuja.
-->
<template>
  <v-container fluid class="shop-page pa-0">

    <!-- ── HERO ── -->
    <section class="hero-fullbleed">
      <div class="hero-inner">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="hero-kicker">San Juan Tecnología</div>
            <h1 class="hero-title">Equipamos y protegemos<br>casas y empresas</h1>
            <p class="hero-sub">
              Seguridad electrónica, sistemas y servicio técnico, con la tienda
              completa en línea.
            </p>
            <div class="d-flex ga-2 flex-wrap mt-4">
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Instalación incluida
              </v-chip>
              <v-chip v-if="abono" color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Monitoreo 24 horas
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Garantía oficial
              </v-chip>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-art">
              <v-icon size="110" color="rgba(255,255,255,0.5)">mdi-cctv</v-icon>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="content pt-6">

      <!-- ── TRES UNIDADES ── -->
      <div class="sec-head">
        <div>
          <div class="text-h6 font-weight-black">Tres unidades, una empresa</div>
          <div class="text-body-2 text-medium-emphasis">
            Cada una con su catálogo y su forma de contratación.
          </div>
        </div>
      </div>

      <div class="unidades-grid mb-10">
        <v-card
          v-for="u in unidades"
          :key="u.title"
          variant="flat"
          rounded="lg"
          class="pa-5 unidad-card"
          :class="{ 'is-lead': u.lead }"
          :to="u.to"
        >
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="primary" size="44" rounded="lg">
              <v-icon color="white">{{ u.icon }}</v-icon>
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold">{{ u.title }}</div>
          </div>
          <div class="text-body-2 text-medium-emphasis mb-3">{{ u.desc }}</div>
          <div class="text-body-2 font-weight-bold text-primary">{{ u.meta }}</div>
        </v-card>
      </div>

      <!-- ── KITS CON ABONO ── -->
      <template v-if="kits.length">
        <div class="sec-head">
          <div>
            <div class="text-h6 font-weight-black">Kits de seguridad con abono</div>
            <div class="text-body-2 text-medium-emphasis">
              El equipo se paga una vez. El monitoreo, mes a mes.
            </div>
          </div>
          <router-link class="ver-todo" :to="{ name: 'shopLandingSeguridad' }">
            Ver los {{ kitsTotal }} kits
          </router-link>
        </div>

        <div class="product-grid mb-10">
          <ProductCard v-for="k in kits" :key="k.product_id" :p="k" :abono="abonoTexto" />
        </div>
      </template>

      <!-- ── ABONO EL OJO ── -->
      <v-card v-if="abono" class="abono-card mb-10" variant="flat" rounded="lg">
        <div class="abono-inner">
          <div class="abono-left">
            <div class="abono-kicker">Abono de monitoreo</div>
            <div class="abono-title">EL OJO. Monitoreo y vigilancia 24/7</div>
            <div class="abono-desc">
              Conexión ininterrumpida del sistema de alarma con la central técnica,
              para la detección temprana de incidentes.
            </div>
            <div class="abono-price-row">
              <span class="abono-price">$ {{ fmtMoney(abono.monto) }}</span>
              <span class="abono-per">por mes</span>
              <span v-if="abono.lista > abono.monto" class="abono-list">
                $ {{ fmtMoney(abono.lista) }}
              </span>
            </div>
            <v-btn
              class="mt-4"
              color="white"
              variant="flat"
              rounded="lg"
              size="large"
              :to="{ name: 'shopProduct', params: { id: abono.producto.product_id } }"
            >
              Ver el abono
            </v-btn>
          </div>
          <div class="abono-right">
            <div v-for="(paso, i) in abonoPasos" :key="paso" class="abono-step">
              <span class="abono-step-n">{{ i + 1 }}</span>
              <span>{{ paso }}</span>
            </div>
          </div>
        </div>
      </v-card>

      <!-- ── MANO DE OBRA ── -->
      <template v-if="manoDeObra.length">
        <div class="sec-head">
          <div>
            <div class="text-h6 font-weight-black">Instalación a cargo de la empresa</div>
            <div class="text-body-2 text-medium-emphasis">
              La mano de obra tiene precio de lista, igual que el equipo.
            </div>
          </div>
        </div>

        <div class="obra-grid mb-10">
          <v-card
            v-for="o in manoDeObra"
            :key="o.product_id"
            variant="flat"
            rounded="lg"
            class="pa-5 obra-card"
            :to="{ name: 'shopProduct', params: { id: o.product_id } }"
          >
            <v-avatar color="primary" size="44" rounded="lg">
              <v-icon color="white">mdi-account-hard-hat</v-icon>
            </v-avatar>
            <div class="obra-name">{{ o.name }}</div>
            <div class="obra-price">
              <div class="obra-price-now">$ {{ fmtMoney(precioVigente(o)) }}</div>
              <div v-if="toNum(o.price_list) > precioVigente(o)" class="obra-price-old">
                $ {{ fmtMoney(o.price_list) }}
              </div>
            </div>
          </v-card>
        </div>
      </template>

      <!-- ── LA TIENDA ── -->
      <div class="sec-head">
        <div>
          <div class="text-h6 font-weight-black">La tienda</div>
          <div class="text-body-2 text-medium-emphasis">{{ tiendaResumen }}</div>
        </div>
        <router-link class="ver-todo" to="/shop/categories">Ver todas las categorías</router-link>
      </div>

      <div class="cats-grid mb-10">
        <v-card
          v-for="c in categoriasDestacadas"
          :key="c.id"
          variant="flat"
          rounded="lg"
          class="pa-5 cat-card"
          :to="{ name: 'shopCategory', params: { id: c.id } }"
        >
          <div class="cat-name">{{ c.name }}</div>
        </v-card>
      </div>

    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicParentCategories } from "@/modules/shop/service/shop.taxonomy.api";
import { getAbonoMonitoreo, lineaAbono, precioVigente } from "@/modules/shop/service/abono.api";
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const CATEGORIA_SEGURIDAD = 11;
const SUB_MANO_DE_OBRA = 67;

// Los cinco kits que ya existen como producto pero todavia no tienen is_kit=1
// puesto en el backoffice. Mismo criterio que la landing de seguridad.
const KITS_POR_ID = new Set([466, 588, 589, 603, 604]);

// Categorias que abren la tienda desde la portada. Son ids reales del catalogo.
const CATS_DESTACADAS = [7, 2, 53, 9];

const kits = ref([]);
const kitsTotal = ref(0);
const manoDeObra = ref([]);
const abono = ref(null);
const categoriasDestacadas = ref([]);
const totalProductos = ref(0);
const totalCategorias = ref(0);

const abonoTexto = computed(() => lineaAbono(abono.value, fmtMoney));

const tiendaResumen = computed(() => {
  if (!totalProductos.value) return "Electro hogar, audio, telefonía e informática.";
  const cats = totalCategorias.value ? ` en ${totalCategorias.value} categorías` : "";
  return `${totalProductos.value} productos${cats}.`;
});

const abonoPasos = [
  "El sensor detecta el evento",
  "La central técnica recibe la señal",
  "El operador verifica",
  "Aviso inmediato al titular",
];

const unidades = computed(() => [
  {
    icon: "mdi-shield-home",
    title: "San Juan Seguridad",
    desc: "Cámaras, alarmas y cerco perimetral. Kits armados con instalación y abono de monitoreo.",
    meta: totalSeguridad.value ? `${totalSeguridad.value} productos` : "Ver la unidad",
    to: { name: "shopLandingSeguridad" },
    lead: true,
  },
  {
    icon: "mdi-server-network",
    title: "San Juan Sistemas",
    desc: "Redes, racks y equipamiento. Cableado estructurado, switches PoE y soporte.",
    meta: "Ver la unidad",
    to: { name: "shopLandingSistemas" },
  },
  {
    icon: "mdi-tools",
    title: "San Juan Servicio Técnico",
    desc: "Reparación de equipos, con precio del arreglo al instante y orden de trabajo.",
    meta: "Ver la unidad",
    to: { name: "shopLandingServicioTecnico" },
  },
]);

const totalSeguridad = ref(0);

const MINUSCULAS = new Set(["de", "del", "la", "el", "y", "con", "para", "en"]);

function titulizar(s) {
  const txt = String(s || "").toLowerCase().trim();
  if (!txt) return "";
  return txt
    .split(/\s+/)
    .map((w, i) => (i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(n) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(toNum(n));
}

function esKit(p) {
  if (p?.is_kit === true || Number(p?.is_kit) === 1) return true;
  return KITS_POR_ID.has(Number(p?.product_id));
}

// Una sola pasada por SEGURIDAD ELECTRONICA: de ahi salen los kits de la
// portada y la mano de obra. La categoria no entra en una pagina (la API topea
// el limit en 100), asi que se recorre entera.
async function traerSeguridad() {
  try {
    const todos = [];
    let pagina = 1;
    let paginas = 1;
    do {
      const r = await getCatalog({
        category_id: CATEGORIA_SEGURIDAD,
        include_children: 1,
        in_stock: 0,
        page: pagina,
        limit: 100,
      });
      const lote = Array.isArray(r?.items) ? r.items : [];
      todos.push(...lote);
      paginas = Number(r?.pages || 1);
      totalSeguridad.value = Number(r?.total || 0);
      pagina += 1;
      if (!lote.length) break;
    } while (pagina <= paginas && pagina <= 10);

    const todosLosKits = todos.filter(esKit);
    kitsTotal.value = todosLosKits.length;
    kits.value = todosLosKits.slice(0, 4);

    manoDeObra.value = todos
      .filter((p) => Number(p.subcategory_id) === SUB_MANO_DE_OBRA && precioVigente(p) > 0)
      .slice(0, 2);
  } catch {
    kits.value = [];
    manoDeObra.value = [];
  }
}

async function traerTienda() {
  try {
    const r = await getCatalog({ page: 1, limit: 1 });
    totalProductos.value = Number(r?.total || 0);
  } catch {
    totalProductos.value = 0;
  }

  try {
    // Solo las categorias raiz: las subcategorias no se cuentan como rubro.
    const cats = await getPublicParentCategories();
    const arr = Array.isArray(cats) ? cats : (cats?.items || []);
    totalCategorias.value = arr.length;
    categoriasDestacadas.value = CATS_DESTACADAS
      .map((id) => arr.find((c) => Number(c.id) === id))
      .filter(Boolean)
      .map((c) => ({ id: c.id, name: titulizar(c.name) }));
  } catch {
    categoriasDestacadas.value = [];
  }
}

onMounted(() => {
  traerSeguridad();
  traerTienda();
  getAbonoMonitoreo().then((r) => { abono.value = r; });
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

.ver-todo {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
.ver-todo:hover { text-decoration: underline; text-underline-offset: 3px; }

/* ===== HERO ===== */
.hero-fullbleed { background: rgb(var(--v-theme-primary)); }

.hero-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 40px;
  align-items: center;
}

.hero-kicker {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 44.8px;
  line-height: 49.28px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 12px;
}

.hero-sub {
  font-size: 16px;
  line-height: 25.6px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  max-width: 560px;
}

.hero-art {
  height: 240px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== UNIDADES ===== */
.unidades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.unidad-card { border: 1px solid rgba(0, 0, 0, 0.06); }
.unidad-card.is-lead { border: 2px solid rgb(var(--v-theme-primary)); }

/* ===== PRODUCTOS ===== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

/* ===== ABONO ===== */
.abono-card { background: linear-gradient(135deg, #02498b 0%, #013066 100%) !important; }

.abono-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 40px;
  padding: 32px;
  align-items: center;
}

.abono-left { min-width: 0; }
.abono-kicker {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 10px;
}
.abono-title { font-size: 28px; line-height: 34px; font-weight: 700; color: #fff; margin-bottom: 10px; }
.abono-desc { font-size: 16px; line-height: 25.6px; color: rgba(255, 255, 255, 0.85); }

.abono-price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.abono-price { font-size: 32px; font-weight: 700; color: #fff; }
.abono-per { font-size: 16px; color: rgba(255, 255, 255, 0.85); }
.abono-list { font-size: 13px; color: rgba(255, 255, 255, 0.55); text-decoration: line-through; }

.abono-right { display: flex; flex-direction: column; gap: 8px; min-width: 0; }

.abono-step {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}
.abono-step-n { font-size: 16px; font-weight: 700; color: #fff; width: 20px; flex-shrink: 0; }

/* ===== MANO DE OBRA ===== */
.obra-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.obra-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.obra-name { flex: 1 1 auto; min-width: 0; font-size: 14px; line-height: 21px; font-weight: 600; }
.obra-price { text-align: right; flex-shrink: 0; }
.obra-price-now { font-size: 20px; font-weight: 700; color: #1a1a1a; }
.obra-price-old { font-size: 12px; color: rgba(0, 0, 0, 0.42); text-decoration: line-through; }

/* ===== CATEGORIAS ===== */
.cats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.cat-card { border: 1px solid rgba(0, 0, 0, 0.06); }
.cat-name { font-size: 14px; font-weight: 600; }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-right { display: none; }
  .hero-title { font-size: 33px; line-height: 40px; }
  .abono-inner { grid-template-columns: 1fr; gap: 24px; padding: 24px; }
  .abono-title { font-size: 24px; line-height: 30px; }
}
</style>
