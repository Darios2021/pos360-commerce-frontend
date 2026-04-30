<!--
  ShopAccountFavorites (ML-like)
  ------------------------------
  Reusa el ProductCard del shop — mismas tarjetas que en el catálogo, sin
  reinventar UI. El usuario quita un favorito tocando el corazón (igual
  que en el shop), o usando el botón quitar del menú.
-->
<template>
  <section class="favs">
    <header class="favs-head">
      <div>
        <h1 class="favs-head__title">Favoritos</h1>
        <p v-if="items.length" class="favs-head__sub">
          {{ items.length }} producto{{ items.length === 1 ? '' : 's' }}
        </p>
      </div>
      <v-btn
        v-if="items.length"
        size="small"
        variant="text"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="reload"
      >
        Actualizar
      </v-btn>
    </header>

    <v-alert v-if="err" type="error" variant="tonal" density="compact" class="mb-4">
      {{ err }}
    </v-alert>

    <!-- Loading -->
    <div v-if="loading && !items.length" class="favs-skeletons">
      <div v-for="i in 8" :key="i" class="favs-skeleton" />
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="favs-empty">
      <div class="favs-empty__icon">
        <v-icon size="36">mdi-heart-outline</v-icon>
      </div>
      <div class="favs-empty__title">Todavía no tenés favoritos</div>
      <div class="favs-empty__sub">
        Tocá el corazón en cualquier producto para guardarlo y volver más tarde.
      </div>
      <v-btn class="mt-4" color="primary" prepend-icon="mdi-storefront-outline" @click="goShop">
        Ir a la tienda
      </v-btn>
    </div>

    <!-- Grid usando ProductCard del shop (mismo componente, sin deformar) -->
    <div v-else class="favs-grid">
      <ProductCard
        v-for="p in items"
        :key="p.product_id || p.id"
        :p="p"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getMyFavorites } from "@/modules/shop/service/shop.account.public.api";
import { useShopFavoritesStore } from "@/modules/shop/service/shopFavorites.store";
import ProductCard from "@/modules/shop/components/ProductCard.vue";

const router = useRouter();
const favs = useShopFavoritesStore();

const loading = ref(false);
const err = ref("");
const items = ref([]);

function goShop() { router.push("/shop"); }

async function reload() {
  loading.value = true;
  err.value = "";
  try {
    const r = await getMyFavorites();
    const list = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
    items.value = list;
    // refresca cache global de favoritos para que los corazones queden coherentes
    const next = new Set();
    for (const it of list) {
      const pid = Number(it.product_id || it.id);
      if (pid > 0) next.add(pid);
    }
    favs.ids = next;
    favs.booted = true;
  } catch (e) {
    err.value = e?.friendlyMessage || e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// Cuando el usuario quita un favorito desde el corazón del ProductCard,
// el store global lo elimina de `ids`. Sincronizamos la lista visible.
watch(
  () => favs.ids.size,
  () => {
    if (!items.value.length) return;
    items.value = items.value.filter((p) => {
      const pid = Number(p.product_id || p.id);
      return favs.ids.has(pid);
    });
  }
);

onMounted(reload);
</script>

<style scoped>
.favs { color: #111827; }

.favs-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
}
.favs-head__title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111827;
  margin: 0;
}
.favs-head__sub {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin: 2px 0 0;
}

/* ── Empty ───────────────────────────────────────────────────── */
.favs-empty {
  background: #ffffff;
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.10);
}
.favs-empty__icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(20, 136, 209, 0.10);
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.favs-empty__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111827;
}
.favs-empty__sub {
  margin-top: 6px;
  max-width: 380px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.45;
}

/* ── Skeletons ───────────────────────────────────────────────── */
.favs-skeletons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.favs-skeleton {
  aspect-ratio: 1 / 1.55;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 25%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: skel 1.2s linear infinite;
}
@keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@media (min-width: 720px)  { .favs-skeletons { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1100px) { .favs-skeletons { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

/* ── Grid de cards (mismas que el shop) ─────────────────────── */
.favs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 720px)  { .favs-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1100px) { .favs-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

/* ── Mobile: tab arriba ya dice "Favoritos" — quitar duplicado ── */
@media (max-width: 600px) {
  .favs-head__title { display: none; }
  .favs-head .v-btn { display: none; }  /* botón Actualizar */
  .favs-head { margin-bottom: 8px; align-items: center; justify-content: flex-start; }
  .favs-head__sub { font-size: 12px; }
  .favs-grid { gap: 8px; }
  .favs-empty { padding: 36px 20px; }
}
</style>
