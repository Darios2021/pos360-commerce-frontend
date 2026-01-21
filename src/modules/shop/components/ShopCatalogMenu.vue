<template>
  <div class="scm-root" :class="{ mobile: isMobile }">
    <!-- DESKTOP -->
    <v-menu
      v-if="!isMobile"
      v-model="menu"
      location="bottom start"
      :close-on-content-click="false"
      open-on-hover
      offset="12"
      transition="fade-transition"
    >
      <template #activator="{ props }">
        <button class="scm-trigger" v-bind="props" type="button" aria-label="Categorías">
          <span class="scm-trigger-text">Categorías</span>
          <v-icon size="16" class="scm-trigger-ico">mdi-chevron-down</v-icon>
        </button>
      </template>

      <v-card class="scm-card" elevation="14" rounded="xl">
        <div class="scm-mega">
          <!-- LEFT (rubro) -->
          <aside class="scm-left">
            <div class="scm-left-title">Categorías</div>

            <div class="scm-left-list">
              <button
                v-for="c in parents"
                :key="c.id"
                class="scm-left-item"
                :class="{ active: hoverParentId === Number(c.id) }"
                type="button"
                @mouseenter="hoverParentId = Number(c.id)"
                @focus="hoverParentId = Number(c.id)"
                @click="pickParent(c)"
              >
                <span class="scm-left-text">{{ c.name }}</span>
                <v-icon size="18" class="scm-left-chevron" v-if="(childrenByParent[c.id] || []).length">
                  mdi-chevron-right
                </v-icon>
              </button>
            </div>
          </aside>

          <!-- RIGHT (subrubros estilo ML) -->
          <section class="scm-right">
            <div class="scm-right-head">
              <div class="scm-right-title">{{ hoverParent?.name || "Elegí una categoría" }}</div>

              <button v-if="hoverParent" type="button" class="scm-seeall" @click="pickParent(hoverParent)">
                Ver todo
                <v-icon size="16">mdi-arrow-right</v-icon>
              </button>
            </div>

            <div v-if="groupedHoverChildren.length" class="scm-groups">
              <div v-for="g in groupedHoverChildren" :key="g.key" class="scm-group">
                <div class="scm-group-title">{{ g.title }}</div>

                <div class="scm-group-items">
                  <button
                    v-for="s in g.items"
                    :key="s.id"
                    type="button"
                    class="scm-sub"
                    @click="pickChild(s)"
                    :title="s.name"
                  >
                    {{ s.name }}
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="scm-empty">
              <div class="text-caption text-medium-emphasis">No hay subcategorías para este rubro.</div>
            </div>
          </section>
        </div>
      </v-card>
    </v-menu>

    <!-- MOBILE -->
    <button v-else class="scm-trigger" type="button" @click="mobileCats = true">
      <span class="scm-trigger-text">Categorías</span>
      <v-icon size="16" class="scm-trigger-ico">mdi-chevron-down</v-icon>
    </button>

    <v-navigation-drawer v-model="mobileCats" location="left" temporary width="320" class="scm-drawer">
      <div class="scm-drawer-head">
        <div class="scm-drawer-title">Categorías</div>
        <v-btn icon variant="text" @click="mobileCats = false" aria-label="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <div class="scm-acc">
        <div v-for="p in parents" :key="p.id" class="scm-acc-item">
          <button
            type="button"
            class="scm-acc-parent"
            :class="{ open: openParentId === Number(p.id) }"
            @click="toggleParent(p)"
          >
            <span class="scm-acc-title">{{ p.name }}</span>
            <v-icon size="16" class="scm-acc-chevron">
              {{ openParentId === Number(p.id) ? "mdi-chevron-up" : "mdi-chevron-down" }}
            </v-icon>
          </button>

          <v-expand-transition>
            <div v-show="openParentId === Number(p.id)" class="scm-acc-children">
              <button
                v-for="c in (childrenByParent[p.id] || [])"
                :key="c.id"
                type="button"
                class="scm-acc-child"
                @click="pickChildMobile(c)"
              >
                {{ c.name }}
              </button>

              <button type="button" class="scm-acc-all" @click="pickParentMobile(p)">
                Ver todo {{ p.name }}
              </button>

              <div v-if="!(childrenByParent[p.id] || []).length" class="scm-acc-empty">
                No hay subcategorías para este rubro.
              </div>
            </div>
          </v-expand-transition>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { getPublicParentCategories, getPublicSubcategoriesMap } from "@/modules/shop/service/shop.taxonomy.api";

const router = useRouter();
const route = useRoute();

const { smAndDown } = useDisplay();
const isMobile = computed(() => !!smAndDown.value);

const menu = ref(false);
const mobileCats = ref(false);

const hoverParentId = ref(null);
const openParentId = ref(null);

// ✅ rubros + subrubros reales
const parentsList = ref([]);
const subMap = ref({});

const parents = computed(() =>
  (parentsList.value || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"))
);

const childrenByParent = computed(() => subMap.value || {});

const hoverParent = computed(() => parents.value.find((x) => Number(x.id) === Number(hoverParentId.value)) || null);

const hoverChildren = computed(() => {
  const pid = Number(hoverParentId.value || 0);
  if (!pid) return [];
  return (childrenByParent.value[pid] || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
});

// ✅ Agrupación opcional estilo ML (si no hay group => "Subcategorías")
function getGroupLabel(s) {
  return (
    s?.group_name ||
    s?.group ||
    s?.section ||
    s?.section_name ||
    s?.family ||
    s?.family_name ||
    ""
  );
}

const groupedHoverChildren = computed(() => {
  const items = hoverChildren.value || [];
  if (!items.length) return [];

  const groups = new Map();
  for (const s of items) {
    const label = String(getGroupLabel(s) || "").trim() || "Subcategorías";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(s);
  }

  const arr = Array.from(groups.entries()).map(([title, list]) => ({
    key: title,
    title,
    items: (list || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es")),
  }));

  arr.sort((a, b) => {
    if (a.title === "Subcategorías" && b.title !== "Subcategorías") return 1;
    if (b.title === "Subcategorías" && a.title !== "Subcategorías") return -1;
    return String(a.title).localeCompare(String(b.title), "es");
  });

  return arr;
});

/** ✅ helper: construir query EXACTA requerida */
function buildChildQuery(parentId, subId) {
  const nq = { ...route.query };

  // siempre seteamos estos 4
  nq.category_id = String(parentId);
  nq.subcategory_id = String(subId);
  nq.sub = String(subId);
  nq.page = "1";

  return nq;
}

function buildParentQuery(parentId) {
  const nq = { ...route.query };

  // al entrar a un rubro: limpiar subcategoría y reset page
  nq.category_id = String(parentId);
  delete nq.subcategory_id;
  delete nq.sub;
  nq.page = "1";

  return nq;
}

// ===============================
// Navegación (DESKTOP)
// ===============================
function pickParent(c) {
  const pid = Number(c?.id || 0);
  if (!pid) return;

  const nq = buildParentQuery(pid);
  router.push({ name: "shopCategory", params: { id: pid }, query: nq });
  menu.value = false;
}

function pickChild(s) {
  const subId = Number(s?.id || 0);
  const parentId = Number(s?.category_id || 0) || Number(hoverParentId.value || 0);
  if (!subId || !parentId) return;

  const nq = buildChildQuery(parentId, subId);
  router.push({ name: "shopCategory", params: { id: parentId }, query: nq });
  menu.value = false;
}

// ===============================
// Navegación (MOBILE)
// ===============================
function toggleParent(p) {
  const id = Number(p?.id || 0);
  if (!id) return;
  openParentId.value = openParentId.value === id ? null : id;
}

async function pickParentMobile(p) {
  const pid = Number(p?.id || 0);
  if (!pid) return;

  const nq = buildParentQuery(pid);
  await router.push({ name: "shopCategory", params: { id: pid }, query: nq });
  mobileCats.value = false;
}

async function pickChildMobile(s) {
  const subId = Number(s?.id || 0);
  const parentId = Number(s?.category_id || 0);
  if (!subId || !parentId) return;

  const nq = buildChildQuery(parentId, subId);
  await router.push({ name: "shopCategory", params: { id: parentId }, query: nq });
  mobileCats.value = false;
}

onMounted(async () => {
  parentsList.value = await getPublicParentCategories();
  subMap.value = await getPublicSubcategoriesMap(parentsList.value);

  const first = parents.value[0];
  if (first) {
    hoverParentId.value = Number(first.id);
    openParentId.value = Number(first.id);
  }
});
</script>

<style scoped>
/* (mantené tus styles actuales; no cambio nada de UI acá) */
.scm-root { display: inline-flex; align-items: center; }
.scm-trigger {
  appearance: none; border: 0; background: transparent; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 750; font-size: 13px; opacity: 0.92;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.scm-trigger:hover { opacity: 1; background: rgba(255, 255, 255, 0.08); }
.scm-trigger-ico { color: rgba(255, 255, 255, 0.78); }

.scm-card {
  position: relative;
  width: min(1120px, calc(100vw - 40px));
  background: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.scm-mega {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 460px;
  max-height: calc(100vh - 160px);
}
.scm-left { background: #fff; border-right: 1px solid rgba(0, 0, 0, 0.08); padding: 12px 10px; overflow: hidden; }
.scm-left-title { font-weight: 950; font-size: 13px; color: rgba(0,0,0,.72); padding: 6px 10px 10px; }
.scm-left-list { display: flex; flex-direction: column; gap: 2px; max-height: 400px; overflow: auto; padding-right: 4px; }
.scm-left-item {
  width: 100%; border: 0; background: transparent; cursor: pointer;
  border-radius: 10px; padding: 10px 10px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  transition: background .15s ease;
}
.scm-left-item:hover { background: rgba(0,0,0,.04); }
.scm-left-item.active { background: rgba(20,136,209,.10); outline: 1px solid rgba(20,136,209,.18); }
.scm-left-text { font-weight: 850; font-size: 13px; color: rgba(0,0,0,.80); text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.scm-left-chevron { color: rgba(0,0,0,.35); }

.scm-right { padding: 18px 18px 16px; background: #fff; overflow: auto; }
.scm-right-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,.08); margin-bottom: 12px;
}
.scm-right-title { font-weight: 500; font-size: 22px; color: rgba(0,0,0,.70); }
.scm-seeall {
  border: 0; background: transparent; color: rgba(20,136,209,.95);
  font-weight: 850; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: 10px;
}
.scm-seeall:hover { background: rgba(20,136,209,.08); }

.scm-groups { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; padding-top: 6px; }
.scm-group-title { font-weight: 700; font-size: 14px; color: rgba(0,0,0,.72); margin-bottom: 10px; }
.scm-group-items { display: flex; flex-direction: column; gap: 10px; }
.scm-sub { border: 0; background: transparent; cursor: pointer; text-align: left; padding: 0;
  color: rgba(0,0,0,.55); font-weight: 500; font-size: 13px; line-height: 1.15; }
.scm-sub:hover { color: rgba(20,136,209,.95); text-decoration: underline; text-underline-offset: 4px; }

.scm-drawer :deep(.v-navigation-drawer__content) { padding: 12px; background: #fff; color: rgba(0,0,0,.8); }
.scm-drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 4px 10px; }
.scm-drawer-title { font-weight: 950; font-size: 16px; color: rgba(0,0,0,.85); }

.scm-acc { padding: 10px 6px; }
.scm-acc-item { margin-bottom: 8px; }
.scm-acc-parent {
  width: 100%; border: 1px solid rgba(0,0,0,.10); background: rgba(0,0,0,.02);
  border-radius: 14px; padding: 10px 10px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  cursor: pointer; color: rgba(0,0,0,.85);
}
.scm-acc-parent.open { background: rgba(20,136,209,.08); border-color: rgba(20,136,209,.20); }
.scm-acc-title { font-weight: 850; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.scm-acc-children { padding: 8px 6px 2px 14px; display: flex; flex-direction: column; gap: 8px; }
.scm-acc-child { text-align: left; border: 0; background: transparent; padding: 6px 4px; cursor: pointer;
  color: rgba(0,0,0,.68); font-weight: 700; font-size: 13px; }
.scm-acc-child:hover { color: rgba(20,136,209,.95); text-decoration: underline; text-underline-offset: 4px; }
.scm-acc-all {
  margin-top: 6px; text-align: left;
  border: 1px solid rgba(0,0,0,.10); background: rgba(0,0,0,.02);
  padding: 10px 12px; border-radius: 14px; cursor: pointer;
  font-weight: 900; font-size: 13px; color: rgba(0,0,0,.78);
}
.scm-acc-all:hover { background: rgba(20,136,209,.08); border-color: rgba(20,136,209,.20); }
.scm-acc-empty { padding: 10px 6px; color: rgba(0,0,0,.55); font-size: 12px; }

@media (max-width: 1100px) {
  .scm-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 960px) {
  .scm-card { width: 92vw; }
  .scm-mega { grid-template-columns: 1fr; }
  .scm-left { border-right: 0; border-bottom: 1px solid rgba(0,0,0,.08); }
  .scm-groups { grid-template-columns: 1fr; }
}
</style>
