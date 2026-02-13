<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopCategories.vue -->
<template>
  <div class="mlc" data-page="shop-categories">
    <!-- barra interna (debajo del header sticky) -->
    <div class="mlc-topbar">
      <button class="mlc-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
      <div class="mlc-title">Categorías</div>
      <div class="mlc-topbar-spacer" />
    </div>

    <v-alert v-if="err" type="error" variant="tonal" class="mlc-alert">
      {{ err }}
    </v-alert>

    <!-- Layout ML: lista izq + grilla der -->
    <div class="mlc-body">
      <!-- LEFT: CATEGORÍAS PADRE -->
      <aside class="mlc-left" aria-label="Listado de categorías">
        <div v-if="loadingParents" class="mlc-left-loading">
          <v-progress-circular indeterminate size="18" />
          <span>Cargando…</span>
        </div>

        <button
          v-for="c in parents"
          :key="c.id"
          type="button"
          class="mlc-left-item"
          :class="{ active: Number(activeParentId) === Number(c.id) }"
          @click="selectParent(c.id)"
        >
          <span class="mlc-left-text">{{ c.name }}</span>
        </button>
      </aside>

      <!-- RIGHT: SUBCATEGORÍAS -->
      <main class="mlc-right" aria-label="Subcategorías">
        <div class="mlc-right-head">
          <div class="mlc-right-title">
            {{ activeParent?.name || "Categorías" }}
          </div>

          <!-- ✅ botón “Ver todo” (abre /shop/c/:parentId) -->
          <button
            v-if="activeParentId"
            type="button"
            class="mlc-seeall"
            @click="openParentAll()"
            aria-label="Ver todo"
          >
            Ver todo
            <v-icon size="18">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-if="loadingChildren" class="mlc-right-loading">
          <v-progress-circular indeterminate />
          <div class="text-caption" style="opacity:.75">Cargando categorías…</div>
        </div>

        <div v-else class="mlc-grid">
          <!-- ✅ SUBCATS -> navega a /shop/c/:parentId?sub=:subId -->
          <button
            v-for="s in children"
            :key="s.id"
            type="button"
            class="mlc-card"
            @click="openSubcategory(s.id)"
            :title="s.name"
          >
            <div class="mlc-icon">
              <img v-if="pickImage(s._raw)" :src="pickImage(s._raw)" alt="" loading="lazy" />
              <span v-else>{{ initials(s.name) }}</span>
            </div>
            <div class="mlc-name">{{ s.name }}</div>
          </button>

          <div v-if="!children.length" class="mlc-empty">
            No hay subcategorías para mostrar.
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getPublicCategoriesAll, getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";

const router = useRouter();

const loadingParents = ref(false);
const loadingChildren = ref(false);
const err = ref("");

const catsAll = ref([]);
const parents = ref([]);
const activeParentId = ref(null);

const children = ref([]);

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isTopLevel(c) {
  // soporta distintos formatos de API
  const pid = c?.parent_id ?? c?.parentId ?? c?.parent ?? null;
  const level = c?.level ?? c?.depth ?? null;
  if (level != null) return Number(level) === 0;
  return pid == null || pid === 0 || pid === "0" || pid === "";
}

function pickImage(c) {
  return c?.image_url || c?.image || c?.icon_url || c?.icon || c?.media?.image || "";
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "•";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = (parts[0] || "").slice(0, 1).toUpperCase();
  const b = (parts[1] || "").slice(0, 1).toUpperCase();
  return (a + b) || a || "•";
}

async function fetchParents() {
  loadingParents.value = true;
  err.value = "";
  try {
    const all = await getPublicCategoriesAll();
    catsAll.value = Array.isArray(all) ? all : [];

    const tops = catsAll.value.filter(isTopLevel);

    parents.value = tops
      .map((c) => ({ id: Number(c.id), name: String(c.name || "").trim() }))
      .filter((x) => x.id && x.name)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    // default: Tecnología si existe, sino el primero
    const tech =
      parents.value.find((p) => norm(p.name) === "tecnologia") ||
      parents.value.find((p) => norm(p.name).includes("tecnolog")) ||
      null;

    activeParentId.value = tech?.id || parents.value?.[0]?.id || null;
  } catch (e) {
    err.value = "No se pudieron cargar las categorías.";
    parents.value = [];
    activeParentId.value = null;
  } finally {
    loadingParents.value = false;
  }
}

async function fetchChildren(parentId) {
  loadingChildren.value = true;
  err.value = "";
  children.value = [];

  try {
    const kids = await getPublicCategoryChildren(Number(parentId));
    const arr = Array.isArray(kids) ? kids : [];

    children.value = arr
      .map((c) => ({
        id: Number(c.id),
        name: String(c.name || "").trim(),
        _raw: c,
      }))
      .filter((x) => x.id && x.name);
  } catch (e) {
    err.value = "No se pudieron cargar las subcategorías.";
    children.value = [];
  } finally {
    loadingChildren.value = false;
  }
}

function selectParent(id) {
  const pid = Number(id);
  if (!pid || pid === Number(activeParentId.value)) return;
  activeParentId.value = pid;
  fetchChildren(pid);
}

/**
 * ✅ VER TODO (padre completo)
 * /shop/c/:parentId
 */
function openParentAll() {
  const pid = Number(activeParentId.value);
  if (!pid) return;

  router.push({
    name: "shopCategory",
    params: { id: String(pid) },
    query: { page: "1" },
  });
}

/**
 * ✅ SUBCATEGORÍA:
 * /shop/c/:parentId?sub=:subId
 * (así lo entiende tu ShopCategory.vue)
 */
function openSubcategory(subId) {
  const pid = Number(activeParentId.value);
  const sid = Number(subId);
  if (!pid || !sid) return;

  router.push({
    name: "shopCategory",
    params: { id: String(pid) },
    query: { sub: String(sid), page: "1" },
  });
}

function goBack() {
  try {
    if (window.history.length > 1) window.history.back();
    else router.push({ name: "shopHome" });
  } catch {
    router.push({ name: "shopHome" });
  }
}

const activeParent = computed(() => parents.value.find((p) => Number(p.id) === Number(activeParentId.value)) || null);

onMounted(async () => {
  await fetchParents();
  if (activeParentId.value) await fetchChildren(activeParentId.value);
});
</script>

<style scoped>
.mlc {
  background: #f5f5f5;
  min-height: calc(100vh - 0px);
}

/* topbar (NO amarillo) */
.mlc-topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 46px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  display: grid;
  grid-template-columns: 46px 1fr 46px;
  align-items: center;
}

.mlc-back {
  width: 46px;
  height: 46px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0e2134;
  cursor: pointer;
}

.mlc-title {
  font-weight: 900;
  color: #0e2134;
  font-size: 15px;
}

.mlc-topbar-spacer {
  width: 46px;
}

.mlc-alert {
  margin: 12px 12px 0;
}

/* body ML */
.mlc-body {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0;
  min-height: calc(100vh - 46px);
}

/* left list */
.mlc-left {
  background: #ffffff;
  border-right: 1px solid rgba(0,0,0,0.08);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mlc-left-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-size: 12px;
  opacity: .8;
}

.mlc-left-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 12px 10px;
  cursor: pointer;
  border-left: 3px solid transparent;
  color: #0e2134;
  font-weight: 750;
  font-size: 12px;
  line-height: 1.1;
}

.mlc-left-item.active {
  background: #f3f7ff;
  border-left-color: rgb(var(--v-theme-primary));
  font-weight: 900;
}

.mlc-left-text {
  display: block;
  word-break: break-word;
}

/* right */
.mlc-right {
  background: #ffffff;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mlc-right-head {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mlc-right-title {
  font-weight: 900;
  color: #0e2134;
  font-size: 13px;
}

.mlc-seeall {
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-weight: 900;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.mlc-right-loading {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 20px;
}

/* grid */
.mlc-grid {
  padding: 14px 12px 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mlc-card {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: center;
  cursor: pointer;
}

.mlc-icon {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  margin: 0 auto;
  background: #f4f6f8;
  border: 1px solid rgba(0,0,0,0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #0e2134;
  font-weight: 900;
  font-size: 14px;
}

.mlc-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mlc-name {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.1;
  color: #0e2134;
  font-weight: 700;
}

.mlc-empty {
  grid-column: 1 / -1;
  padding: 18px 6px;
  text-align: center;
  font-size: 12px;
  opacity: .7;
}

@media (max-width: 600px) {
  .mlc-body { grid-template-columns: 120px 1fr; }
  .mlc-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding-bottom: 92px; /* bottom nav */
  }
  .mlc-icon { width: 54px; height: 54px; }
  .mlc-left-item { padding: 12px 8px; font-size: 12px; }
}
</style>
