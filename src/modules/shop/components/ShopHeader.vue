<!-- src/modules/shop/components/ShopHeader.vue -->
<template>
  <header class="ml-header">
    <div class="ml-top">
      <div class="ml-inner">
        <router-link to="/shop" class="ml-logo">
          <v-avatar size="34" class="mr-2" color="white">
            <v-icon color="primary">mdi-storefront</v-icon>
          </v-avatar>
          <span class="ml-logo-text">POS360 Store</span>
        </router-link>

        <div class="ml-search">
          <!-- ✅ SearchBox ML -->
          <ShopSearchBox
            :branchId="branchId"
            :mode="route.name === 'shopCategory' ? 'category' : 'home'"
            :categoryId="route.name === 'shopCategory' ? Number(route.params.id || 0) : null"
          />
        </div>

        <nav class="ml-actions">
          <router-link class="ml-link" to="/shop">Inicio</router-link>
          <router-link class="ml-link" to="/auth/login">Ingresá</router-link>
          <router-link class="ml-cart" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon>mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else>mdi-cart-outline</v-icon>
          </router-link>
        </nav>
      </div>
    </div>

    <div class="ml-bottom">
      <div class="ml-inner">
        <v-menu
          v-model="menu"
          location="bottom start"
          :close-on-content-click="false"
          open-on-hover
          offset="8"
        >
          <template #activator="{ props }">
            <button class="ml-cat-btn" v-bind="props">
              Categorías
              <v-icon size="18" class="ml-cat-icon">mdi-chevron-down</v-icon>
            </button>
          </template>

          <v-card class="ml-cat-card" elevation="8" rounded="lg">
            <div class="ml-cat-grid">
              <!-- Left: rubros (padres) -->
              <v-list density="comfortable" class="ml-cat-left">
                <v-list-item
                  v-for="c in parents"
                  :key="c.id"
                  :active="hoverParentId === c.id"
                  @mouseenter="hoverParentId = c.id"
                  @click="pickParent(c)"
                >
                  <v-list-item-title>{{ c.name }}</v-list-item-title>
                  <template #append>
                    <v-icon size="18" v-if="(childrenByParent[c.id] || []).length">mdi-chevron-right</v-icon>
                  </template>
                </v-list-item>
              </v-list>

              <!-- Right: subrubros (hijos) -->
              <div class="ml-cat-right">
                <div class="ml-cat-right-title">
                  {{ hoverParent?.name || "Elegí una categoría" }}
                </div>

                <div class="ml-cat-right-items" v-if="hoverChildren.length">
                  <button
                    class="ml-subcat"
                    v-for="s in hoverChildren"
                    :key="s.id"
                    @click="pickChild(s)"
                  >
                    {{ s.name }}
                  </button>
                </div>

                <div class="ml-cat-empty" v-else>
                  <div class="text-caption text-medium-emphasis">
                    No hay subcategorías para este rubro.
                  </div>
                </div>
              </div>
            </div>
          </v-card>
        </v-menu>

        <div class="ml-hint">
          Buscá productos, agregalos al carrito y elegí sucursal al finalizar.
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { getPublicCategoriesAll } from "@/modules/shop/service/shop.taxonomy.api";
import ShopSearchBox from "@/modules/shop/components/ShopSearchBox.vue";

const router = useRouter();
const route = useRoute();
const cart = useShopCartStore();

const menu = ref(false);

const allCats = ref([]);
const hoverParentId = ref(null);

// ✅ si querés que sea dinámico por URL, lo enchufamos después.
// por ahora fijo como venís usando
const branchId = 3;

const parents = computed(() =>
  (allCats.value || [])
    .filter((x) => x && x.parent_id == null && Number(x.is_active ?? 1) === 1)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"))
);

const childrenByParent = computed(() => {
  const map = {};
  for (const c of allCats.value || []) {
    const pid = c?.parent_id == null ? null : Number(c.parent_id);
    if (pid != null) {
      if (!map[pid]) map[pid] = [];
      map[pid].push(c);
    }
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
  }
  return map;
});

const hoverParent = computed(() => parents.value.find((x) => Number(x.id) === Number(hoverParentId.value)) || null);
const hoverChildren = computed(() =>
  (childrenByParent.value[hoverParentId.value] || []).filter((x) => Number(x.is_active ?? 1) === 1)
);

function pickParent(c) {
  const nq = { ...route.query };
  delete nq.sub;
  delete nq.page;
  router.push({ name: "shopCategory", params: { id: c.id }, query: nq });
  menu.value = false;
}

function pickChild(s) {
  const parentId = s.parent_id ? Number(s.parent_id) : null;
  const nq = { ...route.query, sub: String(s.id) };
  delete nq.page;

  if (parentId) router.push({ name: "shopCategory", params: { id: parentId }, query: nq });
  else router.push({ name: "shopHome", query: nq });

  menu.value = false;
}

onMounted(async () => {
  allCats.value = await getPublicCategoriesAll();
  const first = parents.value[0];
  if (first) hoverParentId.value = first.id;
});
</script>

<style scoped>
.ml-header { width: 100%; }
.ml-top { background: #ffe600; }
.ml-bottom { background: #ffe600; padding-bottom: 10px; }
.ml-inner { max-width: 1300px; margin: 0 auto; padding: 10px 14px; display:flex; align-items:center; gap: 14px; }
.ml-logo { display:flex; align-items:center; text-decoration:none; color:#111; min-width: 170px; }
.ml-logo-text { font-weight: 900; }
.ml-search { flex: 1; }
.ml-actions { display:flex; gap: 12px; align-items:center; }
.ml-link { color:#111; text-decoration:none; font-weight:600; opacity:.85; }
.ml-link:hover { opacity: 1; text-decoration: underline; }
.ml-cart { color:#111; display:inline-flex; align-items:center; }
.ml-cat-btn { border:0; background:transparent; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap: 6px; color:#111; }
.ml-hint { font-size:12px; opacity:.8; margin-left:auto; }

.ml-cat-card { width: 720px; }
.ml-cat-grid { display:grid; grid-template-columns: 300px 1fr; }
.ml-cat-left { border-right:1px solid rgba(0,0,0,.08); max-height:420px; overflow:auto; }
.ml-cat-right { padding:14px; max-height:420px; overflow:auto; }
.ml-cat-right-title { font-weight: 900; margin-bottom: 10px; }
.ml-cat-right-items { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ml-subcat { text-align:left; border:1px solid rgba(0,0,0,.08); background:#fff; padding:10px 12px; border-radius:12px; cursor:pointer; font-weight:650; }
.ml-subcat:hover { border-color: rgba(0,0,0,.2); }
.ml-cat-empty { padding: 8px; }

@media (max-width: 960px) {
  .ml-inner { flex-wrap: wrap; }
  .ml-cat-card { width: 92vw; }
  .ml-cat-grid { grid-template-columns: 1fr; }
  .ml-cat-left { border-right: 0; border-bottom: 1px solid rgba(0,0,0,.08); }
  .ml-cat-right-items { grid-template-columns: 1fr; }
  .ml-hint { width: 100%; margin-left: 0; }
}
</style>
