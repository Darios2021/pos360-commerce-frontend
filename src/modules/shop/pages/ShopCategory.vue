<!-- src/modules/shop/pages/ShopCategory.vue -->
<template>
  <v-container fluid class="py-6 shop-container">
    <div class="shop-inner">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
        <div>
          <v-btn to="/shop" variant="text" class="mb-2">
            <v-icon start>mdi-arrow-left</v-icon> Volver
          </v-btn>

          <div class="text-h4 font-weight-black">
            {{ parentName }}
          </div>

          <div class="text-body-2 text-medium-emphasis">
            Filtrá por subrubros como MercadoLibre.
          </div>
        </div>

        <div class="d-flex ga-2 align-center flex-wrap">
          <v-text-field
            v-model="localQ"
            density="comfortable"
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar dentro de la categoría…"
            hide-details
            style="min-width: 320px; max-width: 560px"
            @keyup.enter="applySearch"
          />
          <v-btn variant="tonal" @click="applySearch">Buscar</v-btn>

          <v-btn to="/shop/cart" color="primary" variant="tonal">
            Carrito ({{ cartCount }})
          </v-btn>
        </div>
      </div>

      <v-row class="ga-4">
        <v-col cols="12" md="3" lg="2">
          <v-card class="rounded-xl filter-card" variant="outlined">
            <v-card-title class="font-weight-bold">Filtros</v-card-title>
            <v-card-text>
              <div class="text-caption text-medium-emphasis mb-2">Subrubros</div>

              <v-chip
                class="mb-2"
                :color="!selectedChildId ? 'primary' : undefined"
                :variant="!selectedChildId ? 'flat' : 'tonal'"
                @click="setChild(null)"
              >
                Todos
              </v-chip>

              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="sc in children"
                  :key="sc.id"
                  class="text-uppercase"
                  :color="selectedChildId === sc.id ? 'primary' : undefined"
                  :variant="selectedChildId === sc.id ? 'flat' : 'tonal'"
                  @click="setChild(sc.id)"
                >
                  {{ sc.name }}
                </v-chip>
              </div>

              <v-divider class="my-4" />

              <v-switch
                v-model="onlyStock"
                density="compact"
                color="primary"
                hide-details
                label="Solo con stock"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="9" lg="10">
          <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
            <div class="text-h6 font-weight-bold">
              Productos
              <span class="text-caption text-medium-emphasis" v-if="total">
                ({{ total }})
              </span>
            </div>

            <v-btn variant="tonal" :loading="loading" @click="fetchCatalog">
              Actualizar
            </v-btn>
          </div>

          <div v-if="loading" class="product-grid">
            <div v-for="n in 12" :key="n">
              <v-skeleton-loader type="image, article" />
            </div>
          </div>

          <v-alert v-else-if="!items.length" type="info" variant="tonal">
            No hay productos para mostrar con estos filtros.
          </v-alert>

          <div v-else class="product-grid">
            <v-card
              v-for="p in items"
              :key="p.product_id"
              class="rounded-xl product-card"
              variant="outlined"
            >
              <v-img :src="p.image_url" height="180" cover class="rounded-t-xl" />

              <v-card-text class="pt-3">
                <div class="text-h6 font-weight-black mb-1">
                  $ {{ fmtMoney(finalPrice(p)) }}
                </div>

                <div class="font-weight-bold text-uppercase product-title">
                  {{ p.name }}
                </div>

                <div class="text-caption text-medium-emphasis mt-2">
                  {{ p.category_name || "—" }}
                  <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                </div>
              </v-card-text>

              <v-card-actions class="px-4 pb-4">
                <v-btn variant="text" @click="goProduct(p.product_id)">Ver</v-btn>
                <v-spacer />
                <v-btn
                  color="primary"
                  variant="text"
                  :disabled="p.track_stock && Number(p.stock_qty) <= 0"
                  @click="addToCart(p)"
                >
                  Agregar
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>

          <div v-if="pages > 1" class="d-flex justify-center align-center ga-2 mt-6">
            <v-btn variant="tonal" :disabled="page <= 1 || loading" @click="prevPage">Anterior</v-btn>
            <div class="text-caption text-medium-emphasis">Página {{ page }} / {{ pages }}</div>
            <v-btn variant="tonal" :disabled="page >= pages || loading" @click="nextPage">Siguiente</v-btn>
          </div>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const parentId = computed(() => Number(route.params.id || 0));

const selectedChildId = ref(route.query.sub ? Number(route.query.sub) : null);
const onlyStock = ref(String(route.query.stock ?? "1") !== "0");
const localQ = ref(String(route.query.q || ""));
const page = ref(Number(route.query.page || 1));
const limit = ref(24);

const loading = ref(false);
const items = ref([]);
const total = ref(0);

const children = ref([]);
const parentName = computed(() => `Categoría #${parentId.value}`);

const pages = computed(() => {
  const t = Number(total.value || 0);
  const l = Number(limit.value || 24);
  return t ? Math.max(1, Math.ceil(t / l)) : 1;
});

const cartCount = computed(() => cart.count);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function finalPrice(p) {
  const d = Number(p.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p.price_list || 0);
  if (l > 0) return l;
  return Number(p.price || 0);
}

function goProduct(id) {
  router.push({ name: "shopProduct", params: { id } });
}

function addToCart(p) {
  cart.add(p, 1);
}

function setChild(id) {
  selectedChildId.value = id ? Number(id) : null;
  page.value = 1;
  syncQuery();
}

function applySearch() {
  page.value = 1;
  syncQuery();
}

function syncQuery() {
  const nq = {
    ...route.query,
    q: String(localQ.value || "").trim() || undefined,
    sub: selectedChildId.value ? String(selectedChildId.value) : undefined,
    stock: onlyStock.value ? "1" : "0",
    page: String(page.value),
  };
  Object.keys(nq).forEach((k) => (nq[k] === undefined ? delete nq[k] : null));
  router.replace({ name: "shopCategory", params: { id: parentId.value }, query: nq });
}

async function fetchCatalog() {
  loading.value = true;
  try {
    const r = await getCatalog({
      search: String(route.query.q || ""),
      in_stock: onlyStock.value ? 1 : 0,
      page: page.value,
      limit: limit.value,
      category_id: selectedChildId.value ? null : parentId.value,
      subcategory_id: selectedChildId.value ? selectedChildId.value : null,
      include_children: selectedChildId.value ? null : 1,
    });

    items.value = Array.isArray(r.items) ? r.items : [];
    total.value = Number(r.total || 0);
  } catch (e) {
    console.error("❌ fetchCatalog(Category)", e);
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function nextPage() {
  if (page.value < pages.value) {
    page.value += 1;
    syncQuery();
  }
}
function prevPage() {
  if (page.value > 1) {
    page.value -= 1;
    syncQuery();
  }
}

async function bootstrap() {
  try {
    children.value = await getPublicCategoryChildren(parentId.value);
  } catch (e) {
    console.error("❌ children", e);
    children.value = [];
  }

  selectedChildId.value = route.query.sub ? Number(route.query.sub) : null;
  onlyStock.value = String(route.query.stock ?? "1") !== "0";
  localQ.value = String(route.query.q || "");
  page.value = Number(route.query.page || 1);

  await fetchCatalog();
}

onMounted(bootstrap);
watch(() => parentId.value, bootstrap);

watch(
  () => route.query,
  () => {
    selectedChildId.value = route.query.sub ? Number(route.query.sub) : null;
    onlyStock.value = String(route.query.stock ?? "1") !== "0";
    localQ.value = String(route.query.q || "");
    page.value = Number(route.query.page || 1);
    fetchCatalog();
  }
);

watch(onlyStock, () => {
  page.value = 1;
  syncQuery();
});
</script>

<style scoped>
.shop-inner {
  width: 100%;
  max-width: 1850px;
  margin: 0 auto;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
  align-items: start;
}

.product-card {
  width: 100%;
  max-width: 340px;
}

.product-title {
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.filter-card {
  position: sticky;
  top: 90px;
}
@media (max-width: 960px) {
  .filter-card { position: static; }
  .product-card { max-width: 100%; }
}
</style>
