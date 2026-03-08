<!-- ✅ COPY-PASTE FINAL COMPLETO -->
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

      <v-card class="scm-card" elevation="16" rounded="xl">
        <div class="scm-mega">
          <!-- LEFT -->
          <aside class="scm-left">
            <div class="scm-left-head">
              <div class="scm-left-kicker">Explorar</div>
              <div class="scm-left-title">Categorías</div>
            </div>

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

                <div class="scm-left-meta">
                  <span
                    v-if="(childrenByParent[c.id] || []).length"
                    class="scm-left-badge"
                  >
                    {{ (childrenByParent[c.id] || []).length }}
                  </span>

                  <v-icon
                    size="18"
                    class="scm-left-chevron"
                    v-if="(childrenByParent[c.id] || []).length"
                  >
                    mdi-chevron-right
                  </v-icon>
                </div>
              </button>
            </div>
          </aside>

          <!-- RIGHT -->
          <section class="scm-right">
            <div class="scm-right-head">
              <div>
                <div class="scm-right-kicker">Navegación</div>
                <div class="scm-right-title">
                  {{ hoverParent?.name || "Elegí una categoría" }}
                </div>
              </div>

              <button
                v-if="hoverParent"
                type="button"
                class="scm-seeall"
                @click="pickParent(hoverParent)"
              >
                Ver todo
                <v-icon size="16">mdi-arrow-right</v-icon>
              </button>
            </div>

            <div v-if="groupedHoverChildren.length" class="scm-groups">
              <div
                v-for="g in groupedHoverChildren"
                :key="g.key"
                class="scm-group"
              >
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
                    <span class="scm-sub-dot"></span>
                    <span class="scm-sub-text">{{ s.name }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="scm-empty">
              <div class="scm-empty-box">
                <v-icon size="18">mdi-shape-outline</v-icon>
                <span>No hay subcategorías para este rubro.</span>
              </div>
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

    <v-navigation-drawer
      v-model="mobileCats"
      location="left"
      temporary
      width="320"
      class="scm-drawer"
    >
      <div class="scm-drawer-head">
        <div>
          <div class="scm-drawer-kicker">Explorar</div>
          <div class="scm-drawer-title">Categorías</div>
        </div>

        <v-btn icon variant="text" @click="mobileCats = false">
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
            <div class="scm-acc-parent-main">
              <span class="scm-acc-title">{{ p.name }}</span>
              <span
                v-if="(childrenByParent[p.id] || []).length"
                class="scm-acc-badge"
              >
                {{ (childrenByParent[p.id] || []).length }}
              </span>
            </div>

            <v-icon size="16">
              {{ openParentId === Number(p.id) ? "mdi-chevron-up" : "mdi-chevron-down" }}
            </v-icon>
          </button>

          <v-expand-transition>
            <div
              v-show="openParentId === Number(p.id)"
              class="scm-acc-children"
            >
              <button
                v-for="c in (childrenByParent[p.id] || [])"
                :key="c.id"
                type="button"
                class="scm-acc-child"
                @click="pickChildMobile(c)"
              >
                <span class="scm-acc-child-dot"></span>
                <span>{{ c.name }}</span>
              </button>

              <button
                type="button"
                class="scm-acc-all"
                @click="pickParentMobile(p)"
              >
                Ver todo {{ p.name }}
              </button>

              <div
                v-if="!(childrenByParent[p.id] || []).length"
                class="scm-acc-empty"
              >
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import {
  getPublicParentCategories,
  getPublicSubcategoriesMap,
} from "@/modules/shop/service/shop.taxonomy.api";

const router = useRouter();
const route = useRoute();
const { smAndDown } = useDisplay();

const isMobile = computed(() => !!smAndDown.value);

const menu = ref(false);
const mobileCats = ref(false);

const hoverParentId = ref(null);
const openParentId = ref(null);

const parentsList = ref([]);
const subMap = ref({});

const parents = computed(() =>
  (parentsList.value || []).slice().sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "es")
  )
);

const childrenByParent = computed(() => subMap.value || {});

const hoverParent = computed(
  () =>
    parents.value.find(
      (x) => Number(x.id) === Number(hoverParentId.value)
    ) || null
);

const hoverChildren = computed(() => {
  const pid = Number(hoverParentId.value || 0);
  if (!pid) return [];
  return (childrenByParent.value[pid] || []).slice().sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "es")
  );
});

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

  return Array.from(groups.entries()).map(([title, list]) => ({
    key: title,
    title,
    items: list,
  }));
});

function buildChildQuery(parentId, subId) {
  const nq = { ...route.query };
  nq.category_id = String(parentId);
  nq.subcategory_id = String(subId);
  nq.sub = String(subId);
  nq.page = "1";
  return nq;
}

function buildParentQuery(parentId) {
  const nq = { ...route.query };
  nq.category_id = String(parentId);
  delete nq.subcategory_id;
  delete nq.sub;
  nq.page = "1";
  return nq;
}

function pickParent(c) {
  const pid = Number(c?.id || 0);
  if (!pid) return;

  router.push({
    name: "shopCategory",
    params: { id: pid },
    query: buildParentQuery(pid),
  });

  menu.value = false;
}

function pickChild(s) {
  const subId = Number(s?.id || 0);
  const parentId = Number(s?.category_id || hoverParentId.value || 0);
  if (!subId || !parentId) return;

  router.push({
    name: "shopCategory",
    params: { id: parentId },
    query: buildChildQuery(parentId, subId),
  });

  menu.value = false;
}

function toggleParent(p) {
  const id = Number(p?.id || 0);
  openParentId.value = openParentId.value === id ? null : id;
}

async function pickParentMobile(p) {
  const pid = Number(p?.id || 0);
  if (!pid) return;

  await router.push({
    name: "shopCategory",
    params: { id: pid },
    query: buildParentQuery(pid),
  });

  mobileCats.value = false;
}

async function pickChildMobile(s) {
  const subId = Number(s?.id || 0);
  const parentId = Number(s?.category_id || 0);
  if (!subId || !parentId) return;

  await router.push({
    name: "shopCategory",
    params: { id: parentId },
    query: buildChildQuery(parentId, subId),
  });

  mobileCats.value = false;
}

function ensureDesktopDefaultSelection() {
  if (!isMobile.value && !hoverParentId.value && parents.value.length) {
    hoverParentId.value = Number(parents.value[0].id);
  }
}

watch(menu, (val) => {
  if (val) ensureDesktopDefaultSelection();
});

watch(
  () => parents.value,
  () => {
    ensureDesktopDefaultSelection();
  },
  { deep: true }
);

onMounted(async () => {
  parentsList.value = await getPublicParentCategories();
  subMap.value = await getPublicSubcategoriesMap(parentsList.value);

  hoverParentId.value = parents.value.length ? Number(parents.value[0].id) : null;
  openParentId.value = null;
});
</script>

<style scoped>
.scm-root {
  display: inline-flex;
  align-items: center;
}

/* trigger */
.scm-trigger {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 520;
  font-size: 13px;
  letter-spacing: 0.01em;
  transition:
    opacity 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.scm-trigger:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}

.scm-trigger:active {
  transform: translateY(1px);
}

.scm-trigger-text {
  font-weight: 520;
}

.scm-trigger-ico {
  color: rgba(255, 255, 255, 0.76);
}

/* card */
.scm-card {
  position: relative;
  width: min(1120px, calc(100vw - 40px));
  background: linear-gradient(180deg, #ffffff 0%, #fcfcfd 100%) !important;
  border: 1px solid rgba(14, 24, 38, 0.08);
  box-shadow:
    0 16px 40px rgba(10, 24, 40, 0.14),
    0 2px 10px rgba(10, 24, 40, 0.06);
  overflow: hidden;
}

.scm-mega {
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: 500px;
  max-height: calc(100vh - 150px);
}

/* left */
.scm-left {
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(244, 247, 250, 0.98) 100%);
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  padding: 14px 12px;
  overflow: hidden;
}

.scm-left-head {
  padding: 6px 10px 12px;
}

.scm-left-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.42);
  margin-bottom: 4px;
}

.scm-left-title {
  font-weight: 560;
  font-size: 20px;
  line-height: 1.1;
  color: rgba(17, 24, 39, 0.88);
}

.scm-left-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 420px;
  overflow: auto;
  padding-right: 6px;
}

.scm-left-list::-webkit-scrollbar {
  width: 8px;
}

.scm-left-list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.18);
  border-radius: 999px;
}

.scm-left-item {
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  border-radius: 14px;
  padding: 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.scm-left-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(15, 23, 42, 0.06);
  transform: translateX(2px);
}

.scm-left-item.active {
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.08) 0%, rgba(21, 101, 192, 0.12) 100%);
  border-color: rgba(21, 101, 192, 0.18);
  box-shadow: inset 0 0 0 1px rgba(21, 101, 192, 0.06);
}

.scm-left-text {
  font-weight: 520;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.86);
  text-align: left;
  line-height: 1.2;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scm-left-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.scm-left-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.65);
  font-size: 11px;
  font-weight: 600;
}

.scm-left-item.active .scm-left-badge {
  background: rgba(21, 101, 192, 0.14);
  color: rgba(21, 101, 192, 0.9);
}

.scm-left-chevron {
  color: rgba(15, 23, 42, 0.34);
}

/* right */
.scm-right {
  padding: 22px 22px 18px;
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.04), transparent 24%),
    #ffffff;
  overflow: auto;
}

.scm-right-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 18px;
}

.scm-right-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.42);
  margin-bottom: 5px;
}

.scm-right-title {
  font-weight: 540;
  font-size: 32px;
  line-height: 1.08;
  color: rgba(17, 24, 39, 0.82);
  letter-spacing: -0.02em;
}

.scm-seeall {
  border: 1px solid rgba(21, 101, 192, 0.14);
  background: rgba(21, 101, 192, 0.05);
  color: rgba(21, 101, 192, 0.95);
  font-weight: 560;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 12px;
  white-space: nowrap;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.scm-seeall:hover {
  background: rgba(21, 101, 192, 0.09);
  border-color: rgba(21, 101, 192, 0.22);
  transform: translateY(-1px);
}

/* groups */
.scm-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding-top: 4px;
}

.scm-group {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.86) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  padding: 16px 16px 14px;
  min-height: 140px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.scm-group:hover {
  transform: translateY(-2px);
  border-color: rgba(21, 101, 192, 0.12);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.scm-group-title {
  font-weight: 600;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.78);
  margin-bottom: 12px;
  letter-spacing: 0.01em;
}

.scm-group-items {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.scm-sub {
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  padding: 4px 0;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: rgba(17, 24, 39, 0.6);
  font-weight: 430;
  font-size: 14px;
  line-height: 1.22;
  transition: color 0.16s ease, transform 0.16s ease;
}

.scm-sub:hover {
  color: rgba(21, 101, 192, 0.95);
  transform: translateX(2px);
}

.scm-sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.4);
  margin-top: 7px;
  flex-shrink: 0;
}

.scm-sub-text {
  display: inline-block;
}

/* empty */
.scm-empty {
  padding-top: 10px;
}

.scm-empty-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px dashed rgba(15, 23, 42, 0.14);
  background: rgba(248, 250, 252, 0.7);
  padding: 14px 16px;
  border-radius: 16px;
  color: rgba(17, 24, 39, 0.58);
  font-size: 14px;
  font-weight: 450;
}

/* drawer */
.scm-drawer :deep(.v-navigation-drawer__content) {
  padding: 12px;
  background:
    linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
  color: rgba(0, 0, 0, 0.82);
}

.scm-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 4px 12px;
}

.scm-drawer-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.42);
  margin-bottom: 4px;
}

.scm-drawer-title {
  font-weight: 560;
  font-size: 22px;
  color: rgba(17, 24, 39, 0.86);
  line-height: 1.1;
}

.scm-acc {
  padding: 12px 4px;
}

.scm-acc-item {
  margin-bottom: 10px;
}

.scm-acc-parent {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.9);
  border-radius: 16px;
  padding: 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  color: rgba(17, 24, 39, 0.84);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.scm-acc-parent.open {
  background: rgba(21, 101, 192, 0.08);
  border-color: rgba(21, 101, 192, 0.18);
  box-shadow: inset 0 0 0 1px rgba(21, 101, 192, 0.04);
}

.scm-acc-parent-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.scm-acc-title {
  font-weight: 520;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scm-acc-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.66);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.scm-acc-children {
  padding: 10px 4px 4px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scm-acc-child {
  text-align: left;
  border: 0;
  background: transparent;
  padding: 7px 6px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: rgba(17, 24, 39, 0.68);
  font-weight: 430;
  font-size: 14px;
  line-height: 1.2;
  border-radius: 10px;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.scm-acc-child:hover {
  background: rgba(21, 101, 192, 0.05);
  color: rgba(21, 101, 192, 0.95);
  transform: translateX(2px);
}

.scm-acc-child-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.42);
  margin-top: 7px;
  flex-shrink: 0;
}

.scm-acc-all {
  margin-top: 6px;
  text-align: left;
  border: 1px solid rgba(21, 101, 192, 0.14);
  background: rgba(21, 101, 192, 0.05);
  padding: 11px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 550;
  font-size: 13px;
  color: rgba(21, 101, 192, 0.95);
  transition:
    background 0.16s ease,
    border-color 0.16s ease;
}

.scm-acc-all:hover {
  background: rgba(21, 101, 192, 0.09);
  border-color: rgba(21, 101, 192, 0.2);
}

.scm-acc-empty {
  padding: 10px 6px;
  color: rgba(17, 24, 39, 0.52);
  font-size: 12px;
}

/* responsive */
@media (max-width: 1100px) {
  .scm-groups {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scm-right-title {
    font-size: 28px;
  }
}

@media (max-width: 960px) {
  .scm-card {
    width: 92vw;
  }

  .scm-mega {
    grid-template-columns: 1fr;
  }

  .scm-left {
    border-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .scm-groups {
    grid-template-columns: 1fr;
  }
}
</style>