<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <v-container fluid class="pa-6 pos-sale-detail">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h4 font-weight-black">Venta #{{ sale?.id ?? id }}</div>
        <div class="text-caption text-medium-emphasis">Detalle completo</div>
      </div>

      <v-btn variant="tonal" @click="$router.back()">
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>
    </div>

    <!-- Card principal -->
    <v-card class="rounded-xl elevation-3">
      <v-card-text v-if="loading" class="py-10 d-flex justify-center">
        <v-progress-circular indeterminate />
      </v-card-text>

      <v-card-text v-else-if="!sale">
        <v-alert type="warning" variant="tonal" class="rounded-xl">
          Venta no encontrada.
        </v-alert>
      </v-card-text>

      <v-card-text v-else>
        <!-- Top: cliente + totales -->
        <div class="d-flex flex-wrap align-start justify-space-between ga-6">
          <!-- Cliente -->
          <div class="min-w-320">
            <div class="text-caption text-medium-emphasis mb-1">Cliente</div>
            <div class="text-h5 font-weight-black">{{ sale.customer_name || "Consumidor Final" }}</div>

            <div class="text-caption text-medium-emphasis mt-4 mb-1">Fecha</div>
            <div class="text-body-1 font-weight-medium">{{ dt(sale.sold_at || sale.created_at) }}</div>

            <div class="d-flex flex-wrap ga-2 mt-4">
              <v-chip size="small" variant="tonal" :color="statusColor(sale.status)">
                {{ sale.status || "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" :color="payColor(topPaymentMethod)">
                {{ methodLabel(topPaymentMethod) }}
              </v-chip>

              <v-chip size="small" variant="tonal" color="primary">
                Sucursal: {{ sale.branch?.name || sale.branch_id || "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" color="primary">
                Usuario: {{ userLabel(sale) }}
              </v-chip>
            </div>

            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-chip v-if="sale.customer_doc" size="small" variant="tonal">
                <v-icon start size="16">mdi-card-account-details-outline</v-icon>
                {{ sale.customer_doc }}
              </v-chip>
              <v-chip v-if="sale.customer_phone" size="small" variant="tonal">
                <v-icon start size="16">mdi-phone</v-icon>
                {{ sale.customer_phone }}
              </v-chip>
            </div>

            <div v-if="sale.note" class="mt-4">
              <div class="text-caption text-medium-emphasis mb-1">Nota</div>
              <div class="text-body-2">{{ sale.note }}</div>
            </div>
          </div>

          <!-- Totales -->
          <div class="flex-1 min-w-360">
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-body-2">Subtotal</div>
                <div class="text-body-2">Descuento</div>
                <div class="text-body-2">Impuestos</div>
              </div>
              <div class="text-right">
                <div class="text-body-2 font-weight-bold">{{ money(sale.subtotal) }}</div>
                <div class="text-body-2 font-weight-bold">{{ money(sale.discount_total) }}</div>
                <div class="text-body-2 font-weight-bold">{{ money(sale.tax_total) }}</div>
              </div>
            </div>

            <v-divider class="my-4" />

            <div class="d-flex justify-space-between align-center">
              <div class="text-h6 font-weight-black">TOTAL</div>
              <div class="text-h5 font-weight-black">{{ money(sale.total) }}</div>
            </div>

            <div class="d-flex justify-space-between mt-3">
              <div>
                <div class="text-body-2">Pagado</div>
                <div class="text-body-2">Vuelto</div>
              </div>
              <div class="text-right">
                <div class="text-body-2 font-weight-bold">{{ money(sale.paid_total) }}</div>
                <div class="text-body-2 font-weight-bold">{{ money(sale.change_total) }}</div>
              </div>
            </div>
          </div>
        </div>

        <v-divider class="my-6" />

        <!-- Productos -->
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-1 font-weight-bold">Productos</div>
          <div class="text-caption text-medium-emphasis">
            items: {{ (sale.items || []).length }}
          </div>
        </div>

        <v-data-table
          :headers="itemsHeaders"
          :items="sale.items || []"
          item-key="id"
          class="rounded-xl"
          density="comfortable"
        >
          <template #item.product="{ item }">
            <div class="d-flex align-center ga-3">
              <v-avatar size="54" rounded="lg" class="thumb" @click="openImage(item)">
                <v-img v-if="imgUrl(item)" :src="imgUrl(item)" cover />
                <v-icon v-else>mdi-image-off-outline</v-icon>
              </v-avatar>

              <div class="min-w-0">
                <div class="text-body-1 font-weight-black text-truncate">
                  {{ productName(item) }}
                </div>

                <div class="text-caption text-medium-emphasis mt-1 d-flex flex-wrap ga-2">
                  <span><b>SKU:</b> {{ productSku(item) }}</span>
                  <span v-if="productBrand(item) !== '—'"><b>Marca:</b> {{ productBrand(item) }}</span>
                  <span v-if="productModel(item) !== '—'"><b>Modelo:</b> {{ productModel(item) }}</span>
                </div>

                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip size="x-small" variant="tonal">
                    Cat: {{ categoryLabel(item) }}
                  </v-chip>

                  <v-chip size="x-small" variant="tonal" :color="trackStock(item) ? 'indigo' : 'grey'">
                    {{ trackStock(item) ? "Control stock" : "Sin stock" }}
                  </v-chip>

                  <v-chip size="x-small" variant="tonal" v-if="warehouseLabel(item) !== '—'">
                    Depósito: {{ warehouseLabel(item) }}
                  </v-chip>
                </div>
              </div>
            </div>
          </template>

          <template #item.qty="{ item }">
            <div class="font-weight-black">{{ number(item.quantity) }}</div>
          </template>

          <template #item.unit="{ item }">
            <div class="font-weight-bold">{{ money(item.unit_price) }}</div>
          </template>

          <template #item.total="{ item }">
            <div class="font-weight-black">{{ money(item.line_total) }}</div>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-2 justify-end">
              <v-btn size="small" variant="tonal" color="primary" @click="goToProduct(item.product_id)">
                <v-icon start>mdi-cube-outline</v-icon>
                Perfil
              </v-btn>
            </div>
          </template>

          <template #bottom />
        </v-data-table>

        <!-- Pagos -->
        <v-divider class="my-6" />
        <div class="text-subtitle-1 font-weight-bold mb-2">Pagos</div>

        <div v-if="(sale.payments || []).length" class="d-flex flex-column ga-2">
          <div
            v-for="p in sale.payments"
            :key="p.id"
            class="d-flex justify-space-between align-center"
          >
            <div class="text-body-2 font-weight-medium">
              {{ methodLabel(p.method) }}
              <span v-if="p.paid_at" class="text-caption text-medium-emphasis"> · {{ dt(p.paid_at) }}</span>
            </div>
            <div class="text-body-2 font-weight-black">{{ money(p.amount) }}</div>
          </div>
        </div>

        <v-alert v-else type="info" variant="tonal" class="rounded-xl">
          Sin pagos registrados.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Dialog imagen -->
    <v-dialog v-model="imageDialog" max-width="860">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="font-weight-black">{{ productName(imageItem) }}</div>
          <v-btn icon variant="text" @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-img
            v-if="imgUrl(imageItem)"
            :src="imgUrl(imageItem)"
            cover
            style="max-height:540px; border-radius: 14px;"
          />
          <v-alert v-else type="info" variant="tonal" class="rounded-xl">
            Este producto no tiene imagen asociada.
          </v-alert>

          <div class="d-flex ga-2 mt-4">
            <v-btn
              variant="tonal"
              color="primary"
              @click="goToProduct(imageItem?.product_id)"
              :disabled="!imageItem?.product_id"
            >
              <v-icon start>mdi-cube-outline</v-icon>
              Ver producto
            </v-btn>

            <v-btn variant="tonal" @click="copyText(imgUrl(imageItem) || '')" :disabled="!imgUrl(imageItem)">
              <v-icon start>mdi-link-variant</v-icon>
              Copiar URL
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";

const route = useRoute();
const router = useRouter();

const id = computed(() => Number(route.params.id || 0));
const loading = ref(false);

// ✅ el backend devuelve: { sale, refunds, exchanges }
const payload = ref(null);
const sale = computed(() => payload.value?.sale || null);

const snack = ref({ show: false, text: "" });

const imageDialog = ref(false);
const imageItem = ref(null);

const itemsHeaders = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Cant.", key: "qty", sortable: false, width: 110 },
  { title: "Unit.", key: "unit", sortable: false, width: 160 },
  { title: "Total", key: "total", sortable: false, width: 160 },
  { title: "", key: "actions", sortable: false, width: 140 },
];

const topPaymentMethod = computed(() => {
  const p = sale.value?.payments?.[0]?.method;
  return String(p || "").toUpperCase();
});

// ===== Helpers UI =====
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  return val ? new Date(val).toLocaleString("es-AR") : "—";
}
function number(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

// ===== labels =====
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta / Débito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "CARD") return "indigo";
  if (x === "TRANSFER") return "purple";
  if (x === "QR") return "cyan";
  return "grey";
}
function statusColor(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "green";
  if (x === "CANCELLED") return "red";
  if (x === "REFUNDED") return "orange";
  if (x === "DRAFT") return "blue";
  return "grey";
}
function userLabel(s) {
  const u = s?.user || null;
  return u?.name || u?.full_name || u?.email || u?.username || (s?.user_id ? `#${s.user_id}` : "—");
}

// ===== Product getters (usa include del backend) =====
function p(item) {
  return item?.product || null;
}
function productName(item) {
  return item?.product_name_snapshot || p(item)?.name || p(item)?.title || "Producto";
}
function productSku(item) {
  return item?.product_sku_snapshot || p(item)?.sku || p(item)?.code || "—";
}
function productBrand(item) {
  return p(item)?.brand || "—";
}
function productModel(item) {
  return p(item)?.model || "—";
}
function trackStock(item) {
  return !!p(item)?.track_stock;
}
function warehouseLabel(item) {
  return item?.warehouse?.name || (item?.warehouse_id ? `#${item.warehouse_id}` : "—");
}
function categoryLabel(item) {
  const cat = p(item)?.category || null;
  if (!cat) return "—";
  const parent = cat?.parent?.name ? ` / ${cat.parent.name}` : "";
  return `${cat.name || "—"}${parent}`;
}
function imgUrl(item) {
  const imgs = p(item)?.images || [];
  const first = Array.isArray(imgs) && imgs.length ? imgs[0] : null;
  return first?.url || first?.public_url || first?.path || "";
}

// ===== actions =====
function goToProduct(pid) {
  const n = Number(pid || 0);
  if (!n) return;
  router.push({ name: "productProfile", params: { id: n } });
}

function openImage(item) {
  imageItem.value = item || null;
  imageDialog.value = true;
}

async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    snack.value = { show: true, text: "Copiado" };
  } catch {
    snack.value = { show: true, text: "No se pudo copiar" };
  }
}

// ===== Load =====
async function load() {
  loading.value = true;
  payload.value = null;
  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando venta");
    payload.value = data.data || null; // ✅ { sale, refunds, exchanges }
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error" };
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(id, () => load());
</script>

<style scoped>
.pos-sale-detail {
  background: radial-gradient(1200px 600px at 30% 0%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(900px 500px at 80% 10%, rgba(255,255,255,.04), transparent 60%),
              rgba(0,0,0,.02);
}

.min-w-0 { min-width: 0; }
.min-w-320 { min-width: 320px; }
.min-w-360 { min-width: 360px; }

.thumb {
  cursor: zoom-in;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
}
</style>
