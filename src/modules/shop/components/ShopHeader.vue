<!-- src/modules/shop/components/ShopHeader.vue -->
<template>
  <header class="ml-header">
    <!-- ================= ROW 1 (TOP): brand + search + actions ================= -->
    <div class="ml-row ml-row-top">
      <div class="ml-container ml-top-grid" :class="{ 'is-mobile': isMobile }">
        <router-link to="/shop" class="ml-brand" aria-label="San Juan Tecnología">
          <v-avatar size="34" class="ml-brand-ico">
            <v-icon size="18">mdi-storefront</v-icon>
          </v-avatar>

          <!-- ✅ En mobile ocultamos el texto para que el buscador NO quede anulado -->
          <span v-if="!isMobile" class="ml-brand-text">San Juan Tecnología</span>
        </router-link>

        <!-- ✅ Buscador “protagonista” (en mobile ocupa el espacio real) -->
        <div class="ml-search">
          <ShopSearchBox
            :branchId="branchId"
            :mode="route.name === 'shopCategory' ? 'category' : 'home'"
            :categoryId="route.name === 'shopCategory' ? Number(route.params.id || 0) : null"
          />
        </div>

        <!-- RIGHT (desktop): Ingresá / Mis compras / Carrito -->
        <div v-if="!isMobile" class="ml-top-actions">
          <router-link class="ml-top-link" to="/auth/login">
            <v-icon size="18" class="ml-top-ico">mdi-account-outline</v-icon>
            <span>Ingresá</span>
          </router-link>

          <router-link class="ml-top-link" to="/shop">Mis compras</router-link>

          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22">mdi-cart-outline</v-icon>
          </router-link>
        </div>

        <!-- RIGHT (mobile): menu + carrito (compactos para no comer al search) -->
        <div v-else class="ml-top-actions ml-top-actions-mobile">
          <v-btn
            icon
            variant="text"
            class="ml-icon-btn"
            @click="mobileDrawer = true"
            aria-label="Menú"
          >
            <v-icon size="22">mdi-menu</v-icon>
          </v-btn>

          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22">mdi-cart-outline</v-icon>
          </router-link>
        </div>
      </div>
    </div>

    <!-- ================= ROW 2 (BOTTOM): desktop nav / mobile “ML-like” ================= -->
    <div class="ml-row ml-row-bottom">
      <div class="ml-container ml-bottom-grid" :class="{ 'is-mobile': isMobile }">
        <!-- Desktop: ubicación opcional -->
        <button v-if="!isMobile" class="ml-loc" type="button">
          <v-icon size="16" class="ml-loc-ico">mdi-map-marker-outline</v-icon>
          <span class="ml-loc-text">
            <span class="ml-loc-top">Enviar a</span>
            <span class="ml-loc-bottom">San Juan</span>
          </span>
        </button>

        <!-- Desktop nav -->
        <nav v-if="!isMobile" class="ml-nav">
          <v-menu
            v-model="menu"
            location="bottom start"
            :close-on-content-click="false"
            open-on-hover
            offset="10"
          >
            <template #activator="{ props }">
              <button class="ml-nav-link ml-nav-cats" v-bind="props" type="button">
                Categorías
                <v-icon size="16" class="ml-nav-chevron">mdi-chevron-down</v-icon>
              </button>
            </template>

            <v-card class="ml-cat-card" elevation="10" rounded="xl">
              <div class="ml-cat-grid">
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

          <router-link class="ml-nav-link" to="/shop">Ofertas</router-link>
          <router-link class="ml-nav-link" to="/shop">Cupones</router-link>
          <router-link class="ml-nav-link" to="/shop">Supermercado</router-link>
          <router-link class="ml-nav-link" to="/shop">Moda</router-link>
          <router-link class="ml-nav-link" to="/shop">Ayuda</router-link>
        </nav>

        <!-- ✅ Mobile: estilo ML (location bar + categorías) -->
        <div v-else class="ml-mobile-stack">
      

          <div class="ml-mobile-row2">
            <button class="ml-pill ml-cat-mobile-btn" type="button" @click="mobileCats = true">
              <span>Categorías</span>
              <v-icon size="16">mdi-chevron-down</v-icon>
            </button>

            <div class="ml-hint-mobile">
              Buscá productos, agregalos al carrito y elegí sucursal al finalizar.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MOBILE DRAWER (menú general) ================= -->
    <v-navigation-drawer v-model="mobileDrawer" location="right" temporary width="320" class="ml-drawer">
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

    <!-- ================= MOBILE CATEGORIES (Accordion) ================= -->
    <v-navigation-drawer v-model="mobileCats" location="left" temporary width="320" class="ml-drawer">
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

function openCatsFromMenu() {
  mobileDrawer.value = false;
  mobileCats.value = true;
}

/* accordion */
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
.ml-header {
  --ml-blue: #1488d1;
  --ml-white: #ffffff;
  --ml-white-80: rgba(255, 255, 255, 0.8);
  --ml-white-65: rgba(255, 255, 255, 0.65);

  position: sticky;
  top: 0;
  z-index: 60;
  background: var(--ml-blue);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.ml-row {
  background: var(--ml-blue);
  color: var(--ml-white);
}
.ml-row-top {
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.ml-row-bottom {
  padding-bottom: 8px;
}

.ml-container {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  align-items: center;
  gap: 12px;
}

/* grids */
.ml-top-grid {
  grid-template-columns: auto 1fr auto;
  padding: 10px 0;
}

/* ✅ mobile: damos prioridad al search */
.ml-top-grid.is-mobile {
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 10px 0;
}

.ml-bottom-grid {
  grid-template-columns: auto 1fr;
  padding: 6px 0;
}
.ml-bottom-grid.is-mobile {
  grid-template-columns: 1fr;
}

/* brand */
.ml-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--ml-white);
  min-width: 0;
}
.ml-brand-ico {
  background: rgba(255, 255, 255, 0.16) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
}
.ml-brand-ico :deep(.v-icon) {
  color: var(--ml-white) !important;
}
.ml-brand-text {
  font-weight: 1000;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

/* search */
.ml-search {
  min-width: 0;
}
.ml-search :deep(.v-field) {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
}
.ml-search :deep(.v-field__input) {
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.ml-search :deep(input) {
  color: rgba(0, 0, 0, 0.78);
}
.ml-search :deep(input::placeholder) {
  color: rgba(0, 0, 0, 0.45);
  opacity: 1;
}
.ml-search :deep(.v-field__prepend-inner),
.ml-search :deep(.v-field__append-inner) {
  color: rgba(0, 0, 0, 0.55);
}

/* actions */
.ml-top-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ml-top-actions-mobile {
  gap: 8px;
}

.ml-top-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  font-size: 13px;
  font-weight: 850;
  padding: 8px 6px;
  border-radius: 10px;
  white-space: nowrap;
}
.ml-top-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  opacity: 1;
}
.ml-top-ico {
  color: #fff;
  opacity: 0.95;
}
.ml-top-icon {
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  opacity: 0.95;
}
.ml-top-icon :deep(.v-icon) {
  color: #fff !important;
}
.ml-top-icon:hover {
  opacity: 1;
}

.ml-icon-btn {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
}

/* bottom: desktop location */
.ml-loc {
  border: 0;
  background: transparent;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 14px;
  cursor: pointer;
}
.ml-loc:hover {
  background: rgba(255, 255, 255, 0.12);
}
.ml-loc-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.ml-loc-top {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.80);
}
.ml-loc-bottom {
  font-size: 12px;
  font-weight: 950;
}

/* nav */
.ml-nav {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.ml-nav-link {
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  padding: 8px 6px;
  border-radius: 10px;
  white-space: nowrap;
  opacity: 0.95;
}
.ml-nav-link:hover {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.ml-nav-cats {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
}
.ml-nav-chevron {
  opacity: 0.95;
  color: #fff;
}

/* mega menu */
.ml-cat-card {
  width: 740px;
  background: #fff !important;
  color: rgba(0, 0, 0, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.ml-cat-grid {
  display: grid;
  grid-template-columns: 310px 1fr;
}
.ml-cat-left {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  max-height: 420px;
  overflow: auto;
  background: transparent !important;
}
.ml-cat-left :deep(.v-list-item) {
  border-radius: 12px;
  margin: 3px 6px;
}
.ml-cat-left :deep(.v-list-item--active) {
  background: rgba(20, 136, 209, 0.12) !important;
}
.ml-cat-left :deep(.v-list-item-title) {
  font-weight: 900;
  color: rgba(0, 0, 0, 0.78);
}
.ml-cat-right {
  padding: 14px;
  max-height: 420px;
  overflow: auto;
}
.ml-cat-right-title {
  font-weight: 950;
  margin-bottom: 10px;
}
.ml-cat-right-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ml-subcat {
  text-align: left;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: rgba(0, 0, 0, 0.02);
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 850;
  color: rgba(0, 0, 0, 0.72);
}
.ml-subcat:hover {
  background: rgba(20, 136, 209, 0.10);
  border-color: rgba(20, 136, 209, 0.45);
}
.ml-cat-empty {
  padding: 8px;
}

/* ✅ mobile stack */
.ml-mobile-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ml-mobile-loc {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.20);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}
.ml-mobile-loc-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ml-mobile-loc-text {
  font-weight: 850;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.92;
}
.ml-mobile-loc-ico {
  opacity: 0.95;
}
.ml-mobile-loc-arrow {
  opacity: 0.9;
}

/* mobile row2 */
.ml-mobile-row2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.ml-pill {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 16px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 950;
  font-size: 12px;
  flex: 0 0 auto;
}
.ml-hint-mobile {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
  line-height: 1.15;
  max-width: 58%;
}

/* drawers */
.ml-drawer :deep(.v-navigation-drawer__content) {
  padding: 12px;
  background: var(--ml-blue);
  color: #fff;
}
.ml-drawer :deep(.v-list) {
  background: transparent !important;
}
.ml-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 4px 10px;
}
.ml-drawer-title {
  font-weight: 950;
  font-size: 16px;
  color: #fff;
}
.ml-drawer-foot {
  padding: 12px 6px 4px;
  color: rgba(255, 255, 255, 0.85);
}

/* accordion */
.ml-acc {
  padding: 10px 6px;
}
.ml-acc-item {
  margin-bottom: 8px;
}
.ml-acc-parent {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  padding: 10px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  color: #fff;
}
.ml-acc-parent.open {
  background: rgba(255, 255, 255, 0.22);
}
.ml-acc-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ml-acc-title {
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
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
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  font-size: 13px;
}
.ml-acc-child:hover {
  text-decoration: underline;
}
.ml-acc-all {
  margin-top: 6px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.16);
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 950;
  font-size: 13px;
  color: #fff;
}
.ml-acc-empty {
  padding: 10px 6px;
  color: rgba(255, 255, 255, 0.80);
  font-size: 12px;
}

@media (max-width: 960px) {
  .ml-cat-card {
    width: 92vw;
  }
  .ml-cat-grid {
    grid-template-columns: 1fr;
  }
  .ml-cat-left {
    border-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  .ml-cat-right-items {
    grid-template-columns: 1fr;
  }
}
</style>
