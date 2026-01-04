<!-- src/modules/shop/components/ShopHeader.vue -->
<template>
  <header class="ml-header">
    <!-- ================= TOP (ML main row) ================= -->
    <div class="ml-top">
      <div class="ml-inner">
        <!-- ✅ SOLO LOGO (sin título) -->
        <router-link to="/shop" class="ml-logo" aria-label="POS360 Store">
          <v-avatar size="32" class="ml-logo-avatar" color="white">
            <v-icon color="primary" size="18">mdi-storefront</v-icon>
          </v-avatar>
        </router-link>

        <div class="ml-search">
          <ShopSearchBox
            :branchId="branchId"
            :mode="route.name === 'shopCategory' ? 'category' : 'home'"
            :categoryId="route.name === 'shopCategory' ? Number(route.params.id || 0) : null"
          />
        </div>

        <!-- DESKTOP actions -->
        <nav v-if="!isMobile" class="ml-actions">
          <router-link class="ml-link" to="/shop">Inicio</router-link>
          <router-link class="ml-link" to="/auth/login">Ingresá</router-link>
          <router-link class="ml-cart" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22">mdi-cart-outline</v-icon>
          </router-link>
        </nav>

        <!-- MOBILE actions -->
        <div v-else class="ml-actions-mobile">
          <v-btn icon variant="text" class="ml-icon-btn" @click="mobileDrawer = true" aria-label="Menú">
            <v-icon size="22">mdi-menu</v-icon>
          </v-btn>

          <router-link class="ml-cart" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22">mdi-cart-outline</v-icon>
          </router-link>
        </div>
      </div>
    </div>

    <!-- ================= BOTTOM ================= -->
    <div class="ml-bottom">
      <div class="ml-inner ml-inner-bottom">
        <!-- DESKTOP: mega menú categorías -->
        <v-menu
          v-if="!isMobile"
          v-model="menu"
          location="bottom start"
          :close-on-content-click="false"
          open-on-hover
          offset="8"
        >
          <template #activator="{ props }">
            <button class="ml-cat-btn" v-bind="props" type="button">
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
                    <v-icon size="18" v-if="(childrenByParent[c.id] || []).length">
                      mdi-chevron-right
                    </v-icon>
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
                    type="button"
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

        <!-- ✅ MOBILE: SOLO "Categorías" (sin "Enviar a") -->
        <div v-else class="ml-mobile-row2">
          <button class="ml-pill ml-cat-mobile-btn" type="button" @click="mobileCats = true">
            <span>Categorías</span>
            <v-icon size="16">mdi-chevron-down</v-icon>
          </button>
        </div>

        <!-- Hint desktop -->
        <div v-if="!isMobile" class="ml-hint">
          Buscá productos, agregalos al carrito y elegí sucursal al finalizar.
        </div>
      </div>
    </div>

    <!-- ================= MOBILE DRAWER (menú general) ================= -->
    <v-navigation-drawer
      v-model="mobileDrawer"
      location="right"
      temporary
      width="320"
      class="ml-drawer"
    >
      <div class="ml-drawer-head">
        <div class="ml-drawer-title">Menú</div>
        <v-btn icon variant="text" @click="mobileDrawer = false" aria-label="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-list density="comfortable" nav class="ml-drawer-list">
        <v-list-item to="/shop" title="Inicio" prepend-icon="mdi-home-outline" @click="mobileDrawer = false" />
        <v-list-item title="Categorías" prepend-icon="mdi-shape-outline" @click="openCatsFromMenu" />
        <v-list-item to="/shop/cart" title="Carrito" prepend-icon="mdi-cart-outline" @click="mobileDrawer = false" />
        <v-list-item to="/auth/login" title="Ingresá" prepend-icon="mdi-account-outline" @click="mobileDrawer = false" />
      </v-list>

      <div class="ml-drawer-foot">
        <div class="text-caption text-medium-emphasis">
          Buscá productos, agregalos al carrito y elegí sucursal al finalizar.
        </div>
      </div>
    </v-navigation-drawer>

    <!-- ================= MOBILE CATEGORIES (Accordion ML REAL) ================= -->
    <v-navigation-drawer
      v-model="mobileCats"
      location="left"
      temporary
      width="320"
      class="ml-drawer"
    >
      <div class="ml-drawer-head">
        <div class="ml-drawer-title">Categorías</div>
        <v-btn icon variant="text" @click="mobileCats = false" aria-label="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <div class="ml-acc">
        <div v-for="p in parents" :key="p.id" class="ml-acc-item">
          <button
            type="button"
            class="ml-acc-parent"
            :class="{ open: openParentId === Number(p.id) }"
            @click="toggleParent(p)"
          >
            <div class="ml-acc-left">
              <v-icon size="16" class="ml-acc-ico">mdi-format-list-bulleted</v-icon>
              <span class="ml-acc-title">{{ p.name }}</span>
            </div>

            <v-icon size="16" class="ml-acc-chevron">
              {{ openParentId === Number(p.id) ? "mdi-chevron-up" : "mdi-chevron-down" }}
            </v-icon>
          </button>

          <v-expand-transition>
            <div v-show="openParentId === Number(p.id)" class="ml-acc-children">
              <button
                v-for="c in (childrenByParent[p.id] || [])"
                :key="c.id"
                type="button"
                class="ml-acc-child"
                @click="pickChildMobile(c)"
              >
                {{ c.name }}
              </button>

              <button type="button" class="ml-acc-all" @click="pickParentMobile(p)">
                Ver todo {{ p.name }}
              </button>

              <div v-if="!(childrenByParent[p.id] || []).length" class="ml-acc-empty">
                No hay subcategorías para este rubro.
              </div>
            </div>
          </v-expand-transition>
        </div>
      </div>

      <div class="px-4 pb-6 pt-2 text-caption text-medium-emphasis">
        Elegí una categoría o subcategoría para filtrar el catálogo.
      </div>
    </v-navigation-drawer>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { getPublicCategoriesAll } from "@/modules/shop/service/shop.taxonomy.api";
import ShopSearchBox from "@/modules/shop/components/ShopSearchBox.vue";

const router = useRouter();
const route = useRoute();
const cart = useShopCartStore();

const { smAndDown } = useDisplay();
const isMobile = computed(() => !!smAndDown.value);

const menu = ref(false);

const mobileDrawer = ref(false);
const mobileCats = ref(false);

const allCats = ref([]);
const hoverParentId = ref(null);

// ✅ branch fijo como venís usando
const branchId = 3;

const parents = computed(() =>
  (allCats.value || [])
    .filter((x) => x && x.parent_id == null && Number(x.is_active ?? 1) === 1)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"))
);

const childrenByParent = computed(() => {
  const map = {};
  for (const c of allCats.value || []) {
    if (!c) continue;
    const pid = c.parent_id == null ? null : Number(c.parent_id);
    if (pid != null) {
      if (!map[pid]) map[pid] = [];
      if (Number(c.is_active ?? 1) === 1) map[pid].push(c);
    }
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
  }
  return map;
});

const hoverParent = computed(
  () => parents.value.find((x) => Number(x.id) === Number(hoverParentId.value)) || null
);

const hoverChildren = computed(() =>
  (childrenByParent.value[hoverParentId.value] || []).filter((x) => Number(x.is_active ?? 1) === 1)
);

/* ======================
   Desktop navigation
   ====================== */
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

/* ======================
   Mobile navigation
   ====================== */
function openCatsFromMenu() {
  mobileDrawer.value = false;
  mobileCats.value = true;
}

/* ✅ Accordion state (solo uno abierto) */
const openParentId = ref(null);

function toggleParent(p) {
  const id = Number(p?.id || 0);
  if (!id) return;
  openParentId.value = openParentId.value === id ? null : id;
}

async function pickParentMobile(p) {
  const nq = { ...route.query };
  delete nq.sub;
  delete nq.page;

  await router.push({ name: "shopCategory", params: { id: p.id }, query: nq });
  mobileCats.value = false;
}

async function pickChildMobile(s) {
  const parentId = s.parent_id ? Number(s.parent_id) : null;
  const nq = { ...route.query, sub: String(s.id) };
  delete nq.page;

  if (parentId) await router.push({ name: "shopCategory", params: { id: parentId }, query: nq });
  else await router.push({ name: "shopHome", query: nq });

  mobileCats.value = false;
}

onMounted(async () => {
  allCats.value = await getPublicCategoriesAll();

  const first = parents.value[0];
  if (first) {
    hoverParentId.value = first.id;
    openParentId.value = Number(first.id);
  }
});
</script>

<style scoped>
/* ✅ STICKY como ML */
.ml-header {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 60;
}

.ml-top { background: #ffe600; }
.ml-bottom { background: #ffe600; padding-bottom: 8px; }

.ml-inner {
  max-width: 1300px;
  margin: 0 auto;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ml-inner-bottom {
  padding-top: 6px;
  padding-bottom: 8px;
}

/* ✅ SOLO LOGO */
.ml-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: #111;
  flex: 0 0 auto;
}
.ml-logo-avatar {
  box-shadow: 0 2px 10px rgba(0,0,0,.10);
}

/* ✅ Search: más prolijo (evita “texto roto”) */
.ml-search {
  flex: 1;
  min-width: 0;
  display: flex;
}
.ml-search :deep(.v-field),
.ml-search :deep(.v-text-field),
.ml-search :deep(.v-input) {
  width: 100%;
}
.ml-search :deep(input) {
  font-size: 14px;
  line-height: 1.2;
}

/* forzamos que el placeholder nunca “salte” raro */
.ml-search :deep(input::placeholder) {
  opacity: .55;
}

/* si tu ShopSearchBox internamente usa v-text-field, esto ayuda al layout */
.ml-search :deep(.v-field__input) {
  min-height: 40px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.ml-search :deep(.v-field__outline) {
  border-radius: 14px;
}

/* Desktop actions */
.ml-actions { display: flex; gap: 12px; align-items: center; }
.ml-actions-mobile { display:flex; align-items:center; gap: 6px; }

.ml-link { color:#111; text-decoration:none; font-weight:700; opacity:.85; font-size: 13px; }
.ml-link:hover { opacity: 1; text-decoration: underline; }

.ml-cart { color:#111; display:inline-flex; align-items:center; }

.ml-icon-btn {
  border-radius: 12px;
  width: 40px;
  height: 40px;
}

.ml-cat-btn {
  border:0;
  background:transparent;
  font-weight:800;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap: 6px;
  color:#111;
  font-size: 13px;
}

.ml-hint { font-size:12px; opacity:.78; margin-left:auto; }

/* Mega menu desktop */
.ml-cat-card { width: 720px; }
.ml-cat-grid { display:grid; grid-template-columns: 300px 1fr; }
.ml-cat-left { border-right:1px solid rgba(0,0,0,.08); max-height:420px; overflow:auto; }
.ml-cat-right { padding:14px; max-height:420px; overflow:auto; }
.ml-cat-right-title { font-weight: 950; margin-bottom: 10px; }
.ml-cat-right-items { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ml-subcat {
  text-align:left;
  border:1px solid rgba(0,0,0,.08);
  background:#fff;
  padding:10px 12px;
  border-radius:12px;
  cursor:pointer;
  font-weight:750;
}
.ml-subcat:hover { border-color: rgba(0,0,0,.2); }
.ml-cat-empty { padding: 8px; }

/* ✅ Mobile row2: SOLO categorías y alineado prolijo */
.ml-mobile-row2 {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

/* Pill base */
.ml-pill {
  border: 1px solid rgba(0,0,0,.12);
  background: rgba(255,255,255,.22);
  box-shadow: 0 6px 16px rgba(0,0,0,.10);
  backdrop-filter: blur(6px);
  color: #111;
  border-radius: 16px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Categories pill */
.ml-cat-mobile-btn {
  cursor: pointer;
  font-weight: 900;
  font-size: 12px;
  white-space: nowrap;
}

/* Drawer base */
.ml-drawer :deep(.v-navigation-drawer__content) { padding: 12px; }
.ml-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 4px 10px;
}
.ml-drawer-title { font-weight: 950; font-size: 16px; }
.ml-drawer-list { padding-top: 6px; }
.ml-drawer-foot { padding: 12px 6px 4px; }

/* Accordion ML */
.ml-acc { padding: 10px 6px; }
.ml-acc-item { margin-bottom: 8px; }
.ml-acc-parent {
  width: 100%;
  border: 0;
  background: rgba(0,0,0,.03);
  border-radius: 12px;
  padding: 10px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  color: #111;
}
.ml-acc-parent.open { background: rgba(25,118,210,.08); }
.ml-acc-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.ml-acc-ico { opacity: .75; }
.ml-acc-title {
  font-weight: 850;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ml-acc-chevron { opacity: .7; }
.ml-acc-children {
  padding: 8px 6px 2px 34px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ml-acc-child {
  text-align: left;
  border: 0;
  background: transparent;
  padding: 6px 4px;
  cursor: pointer;
  color: rgba(0,0,0,.72);
  font-weight: 700;
  font-size: 13px;
}
.ml-acc-all {
  margin-top: 6px;
  text-align: left;
  border: 1px solid rgba(0,0,0,.10);
  background: rgba(255,255,255,.72);
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 950;
  font-size: 13px;
}
.ml-acc-empty { padding: 10px 6px; color: rgba(0,0,0,.55); font-size: 12px; }

@media (max-width: 960px) {
  .ml-inner { flex-wrap: wrap; }
  .ml-hint { width: 100%; margin-left: 0; }
  .ml-cat-card { width: 92vw; }
  .ml-cat-grid { grid-template-columns: 1fr; }
  .ml-cat-left { border-right: 0; border-bottom: 1px solid rgba(0,0,0,.08); }
  .ml-cat-right-items { grid-template-columns: 1fr; }

  /* ✅ en mobile le damos un toque más de altura al input para que se vea “ML” */
  .ml-search :deep(.v-field__input) {
    min-height: 42px;
    padding-top: 9px;
    padding-bottom: 9px;
  }
}

@media (max-width: 420px) {
  .ml-inner { padding: 8px 10px; gap: 10px; }
  .ml-pill { padding: 9px 10px; border-radius: 15px; }
  .ml-icon-btn { width: 38px; height: 38px; }

  /* ✅ placeholder y texto un poquito más chicos para que no “rompa” */
  .ml-search :deep(input) { font-size: 13px; }
}
</style>
