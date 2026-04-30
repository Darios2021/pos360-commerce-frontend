<!--
  PromoSliderSeguridad — Wrapper sobre ShopProductBlock.
-->
<template>
  <div v-if="items.length || loading" class="promo-shell">
    <div v-if="loading && !items.length" class="promo-skel">
      <v-skeleton-loader type="image, article" />
    </div>
    <ShopProductBlock
      v-else-if="!error && items.length"
      :title="title"
      :subtitle="subtitle"
      icon="mdi-shield-check-outline"
      :view-all-to="viewAllRoute"
      :items="items"
      :page-size="perPage"
    />
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="my-2">
      No se pudieron cargar productos.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ShopProductBlock from "./ShopProductBlock.vue";

const props = defineProps({
  title:    { type: String, default: "Seguridad Electrónica" },
  subtitle: { type: String, default: "Cámaras, alarmas y control de acceso" },
  categoryId: { type: Number, default: 11 },
  limit:    { type: Number, default: 40 },
  perPage:  { type: Number, default: 6 },
});

const loading = ref(false);
const error   = ref("");
const items   = ref([]);

function trimSlash(s) { return String(s || "").replace(/\/+$/, ""); }
function normalizeBase(input) {
  let s = trimSlash(input);
  if (!s) return "/api/v1";
  if (s.startsWith("/")) return /^\/api\/v\d+$/i.test(s) ? s : s;
  try {
    const u = new URL(s);
    return /\/api\/v\d+/i.test(u.pathname) ? trimSlash(u.toString()) : trimSlash(u.origin + "/api/v1");
  } catch { return "/api/v1"; }
}

const baseRaw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
let basePath  = normalizeBase(baseRaw);
if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  const sameOrigin = ["1","true"].includes(String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim().toLowerCase());
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com" || sameOrigin) basePath = "/api/v1";
}

const api = axios.create({ baseURL: `${trimSlash(basePath)}/public`, timeout: 30000 });
api.interceptors.request.use((cfg) => {
  const h = cfg.headers || {};
  delete h["Cache-Control"]; delete h["cache-control"]; delete h["Pragma"]; delete h["pragma"];
  cfg.headers = h; return cfg;
});

const viewAllRoute = computed(() => ({
  name: "shopCategory",
  params: { id: String(props.categoryId) },
}));

async function fetchItems() {
  loading.value = true;
  error.value   = "";
  items.value   = [];
  try {
    const r = await api.get("/catalog", {
      params: { page: 1, limit: props.limit, category_id: props.categoryId },
    });
    items.value = Array.isArray(r.data?.items) ? r.data.items : [];
  } catch (e) {
    try {
      const r2 = await api.get("/catalog", { params: { page: 1, limit: props.limit, search: "camara seguridad" } });
      items.value = Array.isArray(r2.data?.items) ? r2.data.items : [];
    } catch (e2) {
      error.value = e2?.message || String(e2);
    }
  } finally {
    loading.value = false;
  }
}

onMounted(fetchItems);
</script>

<style scoped>
.promo-shell { display: block; }
.promo-skel {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 320px;
}
</style>
