<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/account/ShopAccountFavorites.vue -->
<template>
  <section class="fav">
    <div class="fav-head">
      <div class="fav-h-title">Favoritos</div>
      <div class="fav-h-sub">Productos que guardaste para ver después.</div>
    </div>

    <v-alert v-if="err" type="error" variant="tonal" class="mb-3">
      {{ err }}
    </v-alert>

    <div v-if="loading" class="fav-loading">
      <v-progress-circular indeterminate />
      <div class="text-caption" style="opacity:.75">Cargando…</div>
    </div>

    <div v-else-if="!items.length" class="fav-empty">
      <v-icon size="28">mdi-heart-outline</v-icon>
      <div class="fav-empty-title">Todavía no tenés favoritos</div>
      <div class="fav-empty-sub">Tocá el ♥ en un producto para guardarlo.</div>
      <v-btn class="mt-3" color="primary" @click="goShop">Ir a la tienda</v-btn>
    </div>

    <div v-else class="fav-grid">
      <article v-for="p in items" :key="p.product_id || p.id" class="fav-card">
        <button class="fav-media" type="button" @click="openProduct(p)">
          <img v-if="p.image_url" :src="p.image_url" alt="" loading="lazy" />
          <div v-else class="fav-empty-media">Sin imagen</div>
        </button>

        <div class="fav-body">
          <div class="fav-title" :title="p.name || ''">{{ p.name || "—" }}</div>
          <div class="fav-price" v-if="p.price != null">{{ money(p.price) }}</div>

          <div class="fav-actions">
            <v-btn size="small" variant="tonal" @click="openProduct(p)">Ver</v-btn>
            <v-btn size="small" variant="text" color="error" @click="remove(p)">
              Quitar
            </v-btn>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getMyFavorites, removeFavorite } from "@/modules/shop/service/shop.account.public.api";

const router = useRouter();
const loading = ref(false);
const err = ref("");
const items = ref([]);

function goShop() {
  router.push("/shop");
}

function openProduct(p) {
  const id = p.product_id || p.id;
  if (!id) return;
  router.push(`/shop/product/${id}`);
}

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

async function remove(p) {
  const id = p.product_id || p.id;
  if (!id) return;

  // optimista
  const prev = items.value.slice();
  items.value = items.value.filter((x) => (x.product_id || x.id) !== id);

  try {
    await removeFavorite(id);
  } catch (e) {
    items.value = prev;
    err.value = e?.friendlyMessage || e?.message || String(e);
  }
}

onMounted(async () => {
  loading.value = true;
  err.value = "";
  try {
    const r = await getMyFavorites();
    items.value = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
  } catch (e) {
    err.value = e?.friendlyMessage || e?.message || String(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.fav-head { margin-bottom: 10px; }
.fav-h-title { font-size: 18px; font-weight: 900; }
.fav-h-sub { font-size: 12px; opacity: .75; }

.fav-loading {
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 28px 0;
}

.fav-empty {
  background: #fff;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
  text-align: center;
}

.fav-empty-title { font-weight: 900; margin-top: 8px; }
.fav-empty-sub { font-size: 12px; opacity: .75; margin-top: 2px; }

.fav-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 720px) {
  .fav-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.fav-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
  display: grid;
  grid-template-rows: auto 1fr;
}

.fav-media {
  border: 0;
  padding: 0;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f4f4f4;
  cursor: pointer;
}
.fav-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fav-empty-media {
  height: 100%;
  display: grid;
  place-items: center;
  opacity: .6;
  font-size: 12px;
}

.fav-body { padding: 10px 10px 12px; }
.fav-title {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  min-height: 32px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.fav-price { margin-top: 6px; font-weight: 900; }

.fav-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
</style>
