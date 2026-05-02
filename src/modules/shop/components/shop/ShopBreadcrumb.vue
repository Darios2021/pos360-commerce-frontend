<!-- src/modules/shop/components/shop/ShopBreadcrumb.vue -->
<template>
  <nav class="bc" aria-label="Ruta de navegación">
    <a
      href="javascript:void(0)"
      class="bc-link bc-back"
      @click.prevent="goBack"
    >
      Volver
    </a>

    <span class="bc-pipe" aria-hidden="true">|</span>

    <template v-for="(it, idx) in items" :key="idx">
      <router-link
        v-if="it.to && idx < items.length - 1"
        :to="it.to"
        class="bc-link"
      >
        {{ it.title }}
      </router-link>
      <span v-else class="bc-link bc-current" aria-current="page">
        {{ it.title }}
      </span>

      <span
        v-if="idx < items.length - 1"
        class="bc-sep"
        aria-hidden="true"
      >
        ›
      </span>
    </template>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  product: { type: Object, default: null },
});

function pickName(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

function pickId(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const items = computed(() => {
  const p = props.product || {};

  const cat =
    pickName(p?.category_name) ||
    pickName(p?.Category?.name) ||
    pickName(p?.category?.name);

  const sub =
    pickName(p?.subcategory_name) ||
    pickName(p?.Subcategory?.name) ||
    pickName(p?.subcategory?.name);

  const catId =
    pickId(p?.category_id) ||
    pickId(p?.Category?.id) ||
    pickId(p?.category?.id);

  const subId =
    pickId(p?.subcategory_id) ||
    pickId(p?.Subcategory?.id) ||
    pickId(p?.subcategory?.id);

  const out = [{ title: "Inicio", to: "/shop" }];

  if (cat) {
    out.push({
      title: cat,
      to: catId ? `/shop/c/${catId}` : "/shop",
    });
  }
  if (sub) {
    out.push({
      title: sub,
      to: subId ? `/shop/c/${catId}?subcat=${subId}` : "/shop",
    });
  }

  return out;
});

function goBack() {
  // Si hay historial dentro del shop, volver. Si no, ir al home del shop.
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/shop");
  }
}
</script>

<style scoped>
.bc {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  font-size: 13px;
  line-height: 1.5;
  padding: 4px 0 8px;
}

.bc-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 400;
  letter-spacing: 0.005em;
  transition: text-decoration-color 0.12s, opacity 0.12s;
}
.bc-link:hover {
  text-decoration: underline;
}

.bc-back {
  font-weight: 460;
}

.bc-current {
  /* Página actual: mismo color que ML (azul, no link real). Si querés
     distinguirla más, podríamos bajar opacidad — por defecto la dejo
     idéntica al resto, como hace ML. */
  cursor: default;
  pointer-events: none;
}

.bc-pipe {
  color: rgba(0, 0, 0, 0.28);
  margin: 0 4px;
  user-select: none;
}

.bc-sep {
  color: rgba(0, 0, 0, 0.45);
  margin: 0 2px;
  font-size: 14px;
  user-select: none;
}
</style>
