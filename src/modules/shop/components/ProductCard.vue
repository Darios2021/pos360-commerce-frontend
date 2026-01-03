<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="ml-card" variant="flat" rounded="xl">
    <button class="ml-media" type="button" @click="openProduct" :title="p?.name || ''">
      <img v-if="img" :src="img" alt="" />
      <div v-else class="ml-media-empty">Sin imagen</div>
    </button>

    <div class="ml-body">
      <!-- Título -->
      <div class="ml-title" :title="p?.name || ''">
        {{ p?.name || "—" }}
      </div>

      <!-- Meta -->
      <div class="ml-meta" :title="metaText">
        {{ metaText }}
      </div>

      <!-- Precio + acción -->
      <div class="ml-foot">
        <div class="ml-price">
          $ {{ fmtMoney(priceValue(p)) }}
        </div>

        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="ml-btn"
          :disabled="p?.track_stock && Number(p?.stock_qty || 0) <= 0"
          @click.stop="$emit('add', p)"
        >
          Agregar
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const props = defineProps({
  p: { type: Object, required: true },
});

defineEmits(["add"]);

const router = useRouter();
const route = useRoute();

const img = computed(() => String(props.p?.image_url || "").trim());

const metaText = computed(() => {
  const brand = String(props.p?.brand || "").trim();
  const model = String(props.p?.model || "").trim();
  const cat = String(props.p?.category_name || "").trim();
  const sub = String(props.p?.subcategory_name || "").trim();

  const parts = [];
  if (brand) parts.push(brand);
  if (model) parts.push(model);
  if (sub) parts.push(sub);
  else if (cat) parts.push(cat);

  return parts.length ? parts.join(" · ") : "—";
});

function priceValue(p) {
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function openProduct() {
  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";
  router.push({
    name: "shopProduct",
    params: { id: String(props.p?.product_id) },
    query: { branch_id },
  });
}
</script>

<style scoped>
/* ====== ML style: borde suave + sombra leve ====== */
.ml-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);         /* ✅ contorno MUY suave */
  box-shadow: 0 1px 2px rgba(0,0,0,.06);     /* ✅ sombra sutil */
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

.ml-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0,0,0,.10);
  box-shadow: 0 10px 22px rgba(0,0,0,.10);   /* ✅ hover ML */
}

/* ====== Imagen ====== */
.ml-media {
  border: 0;
  padding: 10px;
  width: 100%;
  height: 190px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ml-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;                        /* ✅ no recorta */
  display: block;
}

.ml-media-empty {
  font-size: 12px;
  opacity: .55;
}

/* ====== Body ====== */
.ml-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 150px;                          /* ✅ todas iguales */
}

.ml-title {
  font-weight: 650;                           /* ✅ ML no tan “negro” */
  letter-spacing: -0.1px;
  line-height: 1.2;
  min-height: 2.4em;                          /* 2 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #111;
}

.ml-meta {
  font-size: 12px;
  opacity: .72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ====== Footer ====== */
.ml-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ml-price {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.3px;
  color: #111;
  white-space: nowrap;
}

/* ✅ botón discreto estilo ML */
.ml-btn {
  border-radius: 12px;
  font-weight: 800;
  padding-inline: 12px;
  box-shadow: none !important;
}

/* responsive */
@media (max-width: 600px) {
  .ml-media { height: 170px; }
  .ml-price { font-size: 18px; }
}
</style>
