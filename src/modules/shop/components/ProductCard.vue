<!-- src/modules/shop/components/ProductCard.vue -->
<template>
  <v-card class="p-card" variant="flat">
    <div class="p-img" @click="open" role="button" tabindex="0">
      <v-img :src="p.image_url" height="210" cover />

      <div class="p-badges">
        <!-- ✅ Badge solo para OFERTA / NUEVO (NO “DESCUENTO” global) -->
        <span v-if="badgeText" class="p-badge p-badge--green">{{ badgeText }}</span>
      </div>
    </div>

    <div class="p-body">
      <div class="p-price-row">
        <div class="p-price">$ {{ fmtMoney(finalPrice) }}</div>

        <!-- ✅ el % OFF queda acá (sin badge gigante) -->
        <span v-if="offPct" class="p-off">{{ offPct }}% OFF</span>
      </div>

      <div v-if="showOld" class="p-old">
        $ {{ fmtMoney(oldPrice) }}
      </div>

      <div class="p-name" :title="p.name">
        {{ p.name }}
      </div>

      <div class="p-meta">
        {{ p.category_name || "—" }}
        <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
      </div>

      <div v-if="freeShip" class="p-ship">Envío gratis</div>

      <div class="p-actions">
        <v-btn variant="text" class="p-btn" @click="open">Ver</v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          class="p-btn p-btn--primary"
          :disabled="p.track_stock && Number(p.stock_qty) <= 0"
          @click="$emit('add', p)"
        >
          Agregar
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  p: { type: Object, required: true },
});
defineEmits(["add"]);

const router = useRouter();

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

const finalPrice = computed(() => {
  const d = toNum(props.p.price_discount);
  if (d > 0) return d;
  const l = toNum(props.p.price_list);
  if (l > 0) return l;
  return toNum(props.p.price);
});

const oldPrice = computed(() => {
  const l = toNum(props.p.price_list);
  const base = l > 0 ? l : toNum(props.p.price);
  return base;
});

const showOld = computed(() => {
  const d = toNum(props.p.price_discount);
  const o = oldPrice.value;
  return d > 0 && o > d;
});

const offPct = computed(() => {
  if (!showOld.value) return 0;
  const o = oldPrice.value;
  const d = toNum(props.p.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
});

// ✅ badge SOLO oferta/nuevo
const badgeText = computed(() => {
  if (props.p.is_promo) return "OFERTA";
  if (props.p.is_new) return "NUEVO";
  return "";
});

const freeShip = computed(() => Boolean(props.p.free_shipping) || Boolean(props.p.is_free_shipping));

function open() {
  router.push({ name: "shopProduct", params: { id: props.p.product_id } });
}
</script>

<style scoped>
.p-card {
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,.06);
  background: #fff;
  box-shadow: 0 10px 24px rgba(0,0,0,.06);
  overflow: hidden;
  transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
}
.p-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(0,0,0,.10);
  border-color: rgba(0,0,0,.10);
}

.p-img { position: relative; cursor: pointer; }

.p-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
}

.p-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 950;
  box-shadow: 0 10px 20px rgba(0,0,0,.12);
}
.p-badge--green { background: rgba(0,166,80,.95); color: #fff; }

.p-body { padding: 12px 12px 10px; }

.p-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.p-price {
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.3px;
  line-height: 1.1;
}
.p-old {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.62;
  text-decoration: line-through;
}
.p-off {
  font-size: 12px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
}

.p-name {
  margin-top: 10px;
  font-weight: 900;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.p-meta {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.70;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.p-ship {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 950;
  color: #00a650;
}

.p-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.p-btn { font-weight: 950; letter-spacing: 0.2px; }
.p-btn--primary { color: #1a73e8; }
</style>
