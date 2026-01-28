<!-- src/modules/admin/pages/ShopOrdersView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1200px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Pedidos</div>
          <div class="text-caption text-medium-emphasis">
            Bandeja de pedidos del ecommerce (ecom_orders).
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="reload" :loading="loading">
            Recargar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- Filtros -->
      <div class="filters">
        <v-text-field
          v-model="filters.q"
          label="Buscar (código, email, cliente, id)"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          clearable
          @keyup.enter="reload"
        />

        <v-select
          v-model="filters.status"
          label="Estado (pedido)"
          :items="statusItems"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          clearable
        />

        <v-select
          v-model="filters.fulfillment_type"
          label="Entrega"
          :items="fulfillmentItems"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          clearable
        />

        <v-select
          v-model="filters.branch_id"
          label="Sucursal"
          :items="branchItems"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          clearable
        />

        <v-btn color="primary" variant="flat" class="btn-apply" @click="reload" :loading="loading">
          Aplicar
        </v-btn>
      </div>

      <v-divider class="my-3" />

      <!-- Datatable -->
      <v-data-table-server
        :headers="headers"
        :items="rows"
        :items-length="meta.total"
        :loading="loading"
        :page="meta.page"
        :items-per-page="meta.limit"
        density="comfortable"
        class="orders-table"
        item-value="id"
        @update:page="onPage"
        @update:items-per-page="onLimit"
      >
        <!-- Código -->
        <template #item.public_code="{ item }">
          <div class="code">
            <v-chip size="small" label class="mr-2" color="primary" variant="tonal">
              {{ item.public_code }}
            </v-chip>
            <span class="muted">#{{ item.id }}</span>
          </div>
        </template>

        <!-- Cliente -->
        <template #item.customer="{ item }">
          <div class="cust">
            <div class="cust-name">{{ item.customer_name || "—" }}</div>
            <div class="cust-email">{{ item.customer_email || "—" }}</div>
            <div class="muted" v-if="item.customer_phone">Tel: {{ item.customer_phone }}</div>
            <div class="muted" v-if="item.customer_doc_number">Doc: {{ item.customer_doc_number }}</div>
          </div>
        </template>

        <!-- Sucursal -->
        <template #item.branch_name="{ item }">
          <v-chip size="small" label variant="tonal">
            {{ item.branch_name || `Sucursal ${item.branch_id}` }}
          </v-chip>
        </template>

        <!-- Entrega -->
        <template #item.fulfillment_type="{ item }">
          <v-chip size="small" label :color="fulfillmentColor(item.fulfillment_type)" variant="tonal">
            {{ fulfillmentLabel(item.fulfillment_type) }}
          </v-chip>

          <div v-if="String(item.fulfillment_type||'').toLowerCase()==='delivery'" class="muted mt-1">
            {{ shortShipLine(item) }}
          </div>
        </template>

        <!-- Estado pedido + pago -->
        <template #item.status="{ item }">
          <v-chip size="small" label :color="statusColor(item.status)" variant="tonal">
            {{ orderStatusLabel(item.status) }}
          </v-chip>

          <div class="payline" v-if="item.payment_provider || item.payment_status || item.order_payment_status">
            <span class="muted">
              {{ paymentSummaryLine(item) }}
            </span>
          </div>

          <div class="payline" v-if="isOrderPaid(item)">
            <v-chip size="x-small" label color="green" variant="tonal">Pagado ✅</v-chip>
            <span class="muted ml-2">→ Coordinar entrega</span>
          </div>
        </template>

        <!-- Items -->
        <template #item.items_qty="{ item }">
          <div class="right">
            <b>{{ fmtQty(item.items_qty) }}</b>
            <div class="muted">({{ item.items_count || 0 }} líneas)</div>
          </div>
        </template>

        <!-- Total -->
        <template #item.total="{ item }">
          <div class="right">
            <b>$ {{ fmtMoney(item.total) }}</b>
            <div class="muted">{{ fmtDate(item.created_at) }}</div>
          </div>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click="openDetail(item)">
            Ver
          </v-btn>
        </template>

        <template #no-data>
          <div class="text-medium-emphasis py-6 text-center">
            No hay pedidos con esos filtros.
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialog detalle -->
    <v-dialog v-model="detail.open" max-width="980">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <div class="text-h6 font-weight-bold">Pedido</div>
            <v-chip v-if="detail.data?.order?.public_code" label color="primary" variant="tonal">
              {{ detail.data.order.public_code }}
            </v-chip>
            <span class="muted" v-if="detail.data?.order?.id">#{{ detail.data.order.id }}</span>
          </div>
          <v-btn icon variant="text" @click="detail.open=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-alert v-if="detail.loading" type="info" variant="tonal" class="mb-3">
            Cargando detalle...
          </v-alert>

          <v-alert v-if="detail.error" type="error" variant="tonal" class="mb-3">
            {{ detail.error }}
          </v-alert>

          <template v-if="detail.data?.order">
            <div class="detail-grid">
              <div class="box">
                <div class="box-title">Estado del pedido</div>
                <v-chip label size="small" :color="statusColor(detail.data.order.status)" variant="tonal">
                  {{ orderStatusLabel(detail.data.order.status) }}
                </v-chip>

                <div class="mt-3 box-title">Estado del pago</div>
                <v-chip label size="small" :color="orderPayColor(detail.data.order.payment_status)" variant="tonal">
                  {{ orderPayLabel(detail.data.order.payment_status) }}
                </v-chip>
                <div class="muted mt-1" v-if="detail.data.order.paid_at">
                  Pagado el: {{ fmtDate(detail.data.order.paid_at, true) }}
                </div>

                <div class="mt-3 box-title">Sucursal</div>
                <div class="muted">
                  {{ detail.data.order.branch_name || `Sucursal ${detail.data.order.branch_id}` }}
                </div>

                <div class="mt-3 box-title">Entrega</div>
                <div class="muted">
                  {{ fulfillmentLabel(detail.data.order.fulfillment_type) }}
                </div>
              </div>

              <div class="box">
                <div class="box-title">Comprador</div>
                <div><b>{{ fullName(detail.data.order) || detail.data.order.customer_name || detail.data.order.ship_name || "—" }}</b></div>
                <div class="muted">{{ detail.data.order.customer_email || detail.data.order.email || "—" }}</div>
                <div class="muted" v-if="detail.data.order.phone || detail.data.order.ship_phone">Tel: {{ detail.data.order.phone || detail.data.order.ship_phone }}</div>
                <div class="muted" v-if="detail.data.order.doc_number">Doc: {{ detail.data.order.doc_number }}</div>
              </div>

              <div class="box">
                <div class="box-title">Totales</div>
                <div class="muted">Subtotal: <b>$ {{ fmtMoney(detail.data.order.subtotal) }}</b></div>
                <div class="muted">Descuento: <b>$ {{ fmtMoney(detail.data.order.discount_total) }}</b></div>
                <div class="muted">Envío: <b>$ {{ fmtMoney(detail.data.order.shipping_total) }}</b></div>
                <div class="muted">Total: <b>$ {{ fmtMoney(detail.data.order.total) }}</b></div>
                <div class="muted mt-2">Creado: {{ fmtDate(detail.data.order.created_at, true) }}</div>
              </div>
            </div>

            <!-- Dirección / Entrega -->
            <v-divider class="my-4" />
            <div class="text-subtitle-2 font-weight-bold mb-2">Dirección / Datos de entrega</div>

            <v-card variant="tonal" rounded="lg" class="pa-3">
              <template v-if="String(detail.data.order.fulfillment_type||'').toLowerCase()==='delivery'">
                <div class="d-flex flex-wrap ga-2">
                  <v-chip size="small" label variant="tonal" color="deep-purple">Envío a domicilio</v-chip>
                  <v-chip v-if="detail.data.order.ship_city" size="small" label variant="tonal">
                    {{ detail.data.order.ship_city }}
                  </v-chip>
                  <v-chip v-if="detail.data.order.ship_province" size="small" label variant="tonal">
                    {{ detail.data.order.ship_province }}
                  </v-chip>
                  <v-chip v-if="detail.data.order.ship_zip" size="small" label variant="tonal">
                    CP {{ detail.data.order.ship_zip }}
                  </v-chip>
                </div>

                <div class="mt-3">
                  <div><b>{{ detail.data.order.ship_name || "—" }}</b></div>
                  <div class="muted" v-if="detail.data.order.ship_phone">Tel: {{ detail.data.order.ship_phone }}</div>

                  <div class="mt-2">
                    <div>{{ detail.data.order.ship_address1 || "—" }}</div>
                    <div class="muted" v-if="detail.data.order.ship_address2">{{ detail.data.order.ship_address2 }}</div>
                  </div>

                  <div class="muted mt-2" v-if="detail.data.order.notes">
                    Nota: {{ detail.data.order.notes }}
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip size="small" label variant="tonal" color="teal">Retiro en sucursal</v-chip>
                  <div class="muted">
                    El cliente retira en la sucursal seleccionada. (No hay dirección de envío.)
                  </div>
                </div>

                <div class="muted mt-2" v-if="detail.data.order.notes">
                  Nota: {{ detail.data.order.notes }}
                </div>
              </template>
            </v-card>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 font-weight-bold mb-2">Items</div>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th style="width: 90px;">ID</th>
                  <th>Producto</th>
                  <th class="text-right">Cant.</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="it in (detail.data.items || [])" :key="it.id">
                  <td class="muted">#{{ it.id }}</td>
                  <td>
                    <div class="font-weight-medium">{{ it.product_name }}</div>
                    <div class="muted">product_id: {{ it.product_id }}</div>
                  </td>
                  <td class="text-right">{{ fmtQty(it.qty) }}</td>
                  <td class="text-right">$ {{ fmtMoney(it.unit_price) }}</td>
                  <td class="text-right"><b>$ {{ fmtMoney(it.line_total) }}</b></td>
                </tr>
              </tbody>
            </v-table>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 font-weight-bold mb-2">Pagos</div>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th style="width: 90px;">ID</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th class="text-right">Monto</th>
                  <th>Referencia</th>
                  <th style="width: 320px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in (detail.data.payments || [])" :key="p.id">
                  <td class="muted">#{{ p.id }}</td>

                  <td>
                    <div class="d-flex align-center ga-2">
                      <v-icon v-if="paymentMethodIcon(p)" size="18">{{ paymentMethodIcon(p) }}</v-icon>
                      <v-chip size="small" label variant="tonal">
                        {{ paymentMethodTitle(p) }}
                      </v-chip>

                      <v-chip
                        v-if="paymentMethodBadgeText(p)"
                        size="x-small"
                        label
                        variant="tonal"
                        :color="badgeColor(paymentMethodBadgeVariant(p))"
                      >
                        {{ paymentMethodBadgeText(p) }}
                      </v-chip>
                    </div>

                    <div class="muted mt-1" v-if="paymentMethodDesc(p)">
                      {{ paymentMethodDesc(p) }}
                    </div>
                  </td>

                  <td>
                    <v-chip size="small" label variant="tonal" :color="paymentStatusColor(p.status)">
                      {{ paymentStatusLabel(p.status) }}
                    </v-chip>
                    <div class="muted mt-1" v-if="p.paid_at">
                      Pagado el: {{ fmtDate(p.paid_at, true) }}
                    </div>
                  </td>

                  <td class="text-right"><b>$ {{ fmtMoney(p.amount) }}</b></td>

                  <td class="muted">
                    <div v-if="p.external_id">id: {{ p.external_id }}</div>
                    <div v-if="p.external_status">st: {{ p.external_status }}</div>
                    <div v-if="p.reference">ref: {{ p.reference }}</div>
                    <div v-if="p.bank_reference">banco: {{ p.bank_reference }}</div>

                    <div v-if="proofUrlFromPayment(p)">
                      comp: <a :href="proofUrlFromPayment(p)" target="_blank" rel="noreferrer">ver</a>
                    </div>

                    <div v-if="mpInitPointFromPayment(p)">
                      mp: <a :href="mpInitPointFromPayment(p)" target="_blank" rel="noreferrer">pagar</a>
                    </div>

                    <div v-if="!p.external_id && !p.external_status && !p.reference && !p.bank_reference && !proofUrlFromPayment(p) && !mpInitPointFromPayment(p)">
                      —
                    </div>
                  </td>

                  <td>
                    <div class="d-flex flex-wrap ga-2">
                      <v-btn
                        v-if="canCreateMpLink(p)"
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-link-variant"
                        :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'mp'"
                        @click="createMpLink(p)"
                      >
                        Crear link MP
                      </v-btn>

                      <v-btn
                        v-if="canUploadProof(p)"
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-upload"
                        @click="openUpload(p)"
                      >
                        Subir comp.
                      </v-btn>

                      <v-btn
                        v-if="canReviewTransfer(p)"
                        size="small"
                        color="green"
                        variant="tonal"
                        prepend-icon="mdi-check"
                        :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'approve'"
                        @click="reviewTransfer(p, 'approve')"
                      >
                        Aprobar
                      </v-btn>

                      <v-btn
                        v-if="canReviewTransfer(p)"
                        size="small"
                        color="red"
                        variant="tonal"
                        prepend-icon="mdi-close"
                        :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'reject'"
                        @click="reviewTransfer(p, 'reject')"
                      >
                        Rechazar
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="detail.open=false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog upload comprobante -->
    <v-dialog v-model="uploadDlg.open" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-h6 font-weight-bold">Subir comprobante</div>
          <v-btn icon variant="text" @click="uploadDlg.open=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-alert v-if="uploadDlg.error" type="error" variant="tonal" class="mb-3">
            {{ uploadDlg.error }}
          </v-alert>

          <div class="muted mb-2">
            Pago #{{ uploadDlg.payment?.id }} · Pedido #{{ detail.data?.order?.id }}
          </div>

          <v-text-field
            v-model="uploadDlg.bank_reference"
            label="Referencia / Nro operación (opcional)"
            variant="outlined"
            density="comfortable"
          />

          <v-file-input
            v-model="uploadDlg.file"
            label="Archivo"
            variant="outlined"
            density="comfortable"
            accept="image/*,.pdf"
            prepend-icon="mdi-paperclip"
          />

          <div class="text-caption text-medium-emphasis mt-1">
            Se sube a storage (S3/MinIO) y queda asociado al pago.
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="uploadDlg.open=false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="uploadDlg.loading"
            prepend-icon="mdi-cloud-upload"
            @click="doUploadProof"
          >
            Subir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2800">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

import { useAuthStore } from "@/app/store/auth.store";
import { loadAuth } from "@/app/utils/storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://pos360-commerce-api.cingulado.org/api/v1";
const auth = useAuthStore();

function pickJwtFromString(raw) {
  if (!raw) return "";
  const s = String(raw).trim().replace(/^"+|"+$/g, "");
  const jwtRe = /^([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)$/;
  return jwtRe.test(s) ? s : "";
}
function scanStorageForToken(st) {
  if (!st) return "";
  const jwtLoose = /([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)/;

  const keys = [];
  for (let i = 0; i < st.length; i++) keys.push(st.key(i));
  keys.sort((a, b) => {
    const sa = /token|auth|jwt|session/i.test(a) ? 0 : 1;
    const sb = /token|auth|jwt|session/i.test(b) ? 0 : 1;
    return sa - sb;
  });

  for (const k of keys) {
    try {
      const raw = st.getItem(k);
      if (!raw) continue;

      const direct = pickJwtFromString(raw);
      if (direct) return direct;

      const m = String(raw).match(jwtLoose);
      if (m?.[1]) return m[1];

      if (raw.startsWith("{") || raw.startsWith("[")) {
        const obj = JSON.parse(raw);

        const candidates = [
          obj?.accessToken,
          obj?.token,
          obj?.jwt,
          obj?.auth?.accessToken,
          obj?.data?.accessToken,
          obj?.session?.accessToken,
          obj?.usuario?.accessToken,
        ];
        for (const c of candidates) {
          const t = pickJwtFromString(c);
          if (t) return t;
        }

        for (const k1 of Object.keys(obj || {})) {
          const v1 = obj[k1];
          if (v1 && typeof v1 === "object") {
            const t2 = pickJwtFromString(v1?.accessToken || v1?.token || v1?.jwt);
            if (t2) return t2;
          }
        }
      }
    } catch {}
  }
  return "";
}
function getToken() {
  const storeToken = pickJwtFromString(auth?.accessToken || auth?.token || auth?.jwt);
  if (storeToken) return storeToken;

  try {
    const saved = loadAuth?.() || {};
    const t1 = pickJwtFromString(saved?.accessToken || saved?.token || saved?.jwt);
    if (t1) return t1;

    const su = saved?.user || saved?.profile || saved?.auth || {};
    const t2 = pickJwtFromString(su?.accessToken || su?.token || su?.jwt);
    if (t2) return t2;
  } catch {}

  return scanStorageForToken(window.localStorage) || scanStorageForToken(window.sessionStorage) || "";
}

const http = axios.create({ baseURL: API_BASE, timeout: 30000 });
http.interceptors.request.use((config) => {
  const token = getToken();
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// =====================
// State
// =====================
const loading = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "" });

const rows = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

const filters = ref({
  q: "",
  status: null,
  fulfillment_type: null,
  branch_id: null,
});

const headers = [
  { title: "Código", key: "public_code", sortable: false, width: 220 },
  { title: "Cliente", key: "customer", sortable: false },
  { title: "Sucursal", key: "branch_name", sortable: false, width: 160 },
  { title: "Entrega", key: "fulfillment_type", sortable: false, width: 200 },
  { title: "Estado / Pago", key: "status", sortable: false, width: 230 },
  { title: "Items", key: "items_qty", sortable: false, width: 120, align: "end" },
  { title: "Total", key: "total", sortable: false, width: 160, align: "end" },
  { title: "", key: "actions", sortable: false, width: 110 },
];

// ✅ Ajustá a tus estados reales si difieren
const statusItems = [
  { title: "Creado", value: "created" },
  { title: "Confirmado", value: "confirmed" },
  { title: "Preparando", value: "preparing" },
  { title: "Listo para retirar", value: "ready_pickup" },
  { title: "Enviado", value: "shipped" },
  { title: "Entregado", value: "delivered" },
  { title: "Cancelado", value: "cancelled" },
];

const fulfillmentItems = [
  { title: "Retiro en sucursal", value: "pickup" },
  { title: "Envío a domicilio", value: "delivery" },
];

const branches = ref([]);
const branchItems = computed(() => (branches.value || []).map((b) => ({ title: b.name, value: b.id })));

// detalle
const detail = ref({
  open: false,
  loading: false,
  error: "",
  data: null,
});

// acciones pagos
const payAction = ref({ loading: false, paymentId: null, type: "" });

// upload dialog
const uploadDlg = ref({
  open: false,
  loading: false,
  error: "",
  payment: null,
  bank_reference: "",
  file: null,
});

// =====================
// Helpers UI / Labels
// =====================
function fmtMoney(v) {
  // ARS sin decimales en UI (si querés con decimales avisame)
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
function fmtQty(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n - Math.round(n)) < 0.0001) return String(Math.round(n));
  return n.toFixed(3);
}
function fmtDate(v, withTime = false) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return withTime ? d.toLocaleString("es-AR") : d.toLocaleDateString("es-AR");
}
function fullName(o) {
  const fn = String(o?.first_name || "").trim();
  const ln = String(o?.last_name || "").trim();
  const s = `${fn} ${ln}`.trim();
  return s || null;
}

function fulfillmentLabel(v) {
  const x = String(v || "").toLowerCase();
  if (x === "delivery") return "Envío a domicilio";
  if (x === "pickup") return "Retiro en sucursal";
  return v || "—";
}
function fulfillmentColor(v) {
  const x = String(v || "").toLowerCase();
  if (x === "delivery") return "deep-purple";
  if (x === "pickup") return "teal";
  return "grey";
}

function shortShipLine(o) {
  const a1 = String(o?.ship_address1 || "").trim();
  const city = String(o?.ship_city || "").trim();
  const prov = String(o?.ship_province || "").trim();
  const parts = [];
  if (a1) parts.push(a1);
  if (city) parts.push(city);
  if (prov) parts.push(prov);
  return parts.length ? parts.join(" · ") : "Dirección no informada";
}

function orderStatusLabel(s) {
  const v = String(s || "").toLowerCase();
  if (v === "created" || v === "pending") return "Creado";
  if (v === "confirmed") return "Confirmado";
  if (v === "preparing") return "Preparando";
  if (v === "ready_pickup") return "Listo para retirar";
  if (v === "shipped") return "Enviado";
  if (v === "delivered") return "Entregado";
  if (v === "cancelled") return "Cancelado";
  return s || "—";
}
function statusColor(s) {
  const v = String(s || "").toLowerCase();
  if (v === "created" || v === "pending") return "grey";
  if (v === "confirmed") return "blue";
  if (v === "preparing") return "amber";
  if (v === "ready_pickup") return "teal";
  if (v === "shipped") return "deep-purple";
  if (v === "delivered") return "green";
  if (v === "cancelled") return "red";
  return "grey";
}

// order.payment_status
function orderPayLabel(s) {
  const v = String(s || "").toLowerCase();
  if (v === "paid") return "Pagado";
  if (v === "pending") return "Pendiente";
  if (v === "unpaid") return "No pagado";
  return s || "—";
}
function orderPayColor(s) {
  const v = String(s || "").toLowerCase();
  if (v === "paid") return "green";
  if (v === "pending") return "amber";
  if (v === "unpaid") return "grey";
  return "grey";
}

function paymentStatusLabel(s) {
  const v = String(s || "").toLowerCase();
  if (["approved", "paid", "accredited", "success"].includes(v)) return "Pagado";
  if (["pending", "in_process", "inprocess", "created"].includes(v)) return v === "created" ? "Creado" : "Pendiente";
  if (["rejected", "cancelled", "canceled", "failed"].includes(v)) return "Rechazado";
  if (["refunded"].includes(v)) return "Reintegrado";
  return s || "—";
}
function paymentStatusColor(s) {
  const v = String(s || "").toLowerCase();
  if (["approved", "paid", "accredited", "success"].includes(v)) return "green";
  if (["pending", "in_process", "inprocess"].includes(v)) return "amber";
  if (["created"].includes(v)) return "grey";
  if (["rejected", "cancelled", "canceled", "failed"].includes(v)) return "red";
  if (["refunded"].includes(v)) return "blue";
  return "grey";
}

function providerFallbackLabel(p) {
  const v = String(p || "").toLowerCase();
  if (v === "mercadopago" || v === "mp") return "Mercado Pago";
  if (v === "transfer" || v === "transferencia") return "Transferencia";
  if (v === "cash" || v === "efectivo") return "Efectivo";
  if (v === "seller") return "Acordar con vendedor";
  if (v === "credit_sjt") return "Crédito San Juan Tecnología";
  if (v === "other" || v === "otro") return "Otro";
  return p || "—";
}

function paymentSummaryLine(item) {
  // listOrders trae payment_provider/payment_status (según tu controller)
  const prov = providerFallbackLabel(item.payment_provider || item.provider);
  const st = paymentStatusLabel(item.payment_status || item.order_payment_status);
  return `Pago: ${prov} · ${st}`;
}

function isOrderPaid(orderRow) {
  // Preferimos el estado del pedido payment_status si vino
  const ps = String(orderRow?.payment_status || orderRow?.order_payment_status || "").toLowerCase();
  if (ps === "paid") return true;

  // fallback: por provider/status
  const prov = String(orderRow?.payment_provider || "").toLowerCase();
  const st = String(orderRow?.payment_status || "").toLowerCase();
  if (prov === "mercadopago" || prov === "mp") {
    return ["approved", "paid", "accredited", "success"].includes(st);
  }
  return false;
}

// ======= payment method “bonito” desde backend (ecom_payment_methods join) =======
function pickAny(p, keys) {
  for (const k of keys) {
    if (p && p[k] !== undefined && p[k] !== null && String(p[k]).trim() !== "") return p[k];
  }
  return null;
}
function paymentMethodTitle(p) {
  const t = pickAny(p, ["method_title", "payment_method_title", "pm_title", "title"]);
  if (t) return String(t);
  return providerFallbackLabel(p?.provider);
}
function paymentMethodDesc(p) {
  const d = pickAny(p, ["method_description", "payment_method_description", "pm_description", "description"]);
  return d ? String(d) : null;
}
function paymentMethodBadgeText(p) {
  const t = pickAny(p, ["method_badge_text", "payment_method_badge_text", "pm_badge_text", "badge_text"]);
  return t ? String(t) : null;
}
function paymentMethodBadgeVariant(p) {
  const v = pickAny(p, ["method_badge_variant", "payment_method_badge_variant", "pm_badge_variant", "badge_variant"]);
  return v ? String(v) : null;
}
function badgeColor(variant) {
  const v = String(variant || "").toLowerCase();
  if (v === "primary") return "primary";
  if (v === "info") return "info";
  if (v === "warning") return "warning";
  if (v === "success") return "success";
  return "grey";
}
function paymentMethodIcon(p) {
  const ic = pickAny(p, ["method_icon", "payment_method_icon", "pm_icon", "icon"]);
  // Vuetify v-icon con MDI: debe ser string tipo "mdi-bank-outline"
  return ic ? String(ic) : null;
}
function flagFromPayment(p, key) {
  const v = pickAny(p, [key, `method_${key}`, `payment_method_${key}`, `pm_${key}`]);
  if (v === null) return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n === 1;
  return Boolean(v);
}
function canCreateMpLink(p) {
  const prov = String(p?.provider || "").toLowerCase();
  const rr = flagFromPayment(p, "requires_redirect");
  if (rr === true) return true;
  return prov === "mercadopago" || prov === "mp";
}
function canUploadProof(p) {
  const prov = String(p?.provider || "").toLowerCase();
  const ap = flagFromPayment(p, "allows_proof_upload");
  if (ap === true) return true;
  return prov === "transfer" || prov === "transferencia";
}
function canReviewTransfer(p) {
  // mismo criterio que upload (es transferencia manual)
  return canUploadProof(p);
}

// payload helpers
function parsePayload(p) {
  const raw = p?.external_payload;
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}
function mpInitPointFromPayment(p) {
  // si tu backend ya guarda init_point en un campo, preferilo
  const direct = pickAny(p, ["mp_init_point", "init_point"]);
  if (direct) return String(direct);

  const pl = parsePayload(p);
  return pl?.mp_preference?.init_point || pl?.mp?.init_point || null;
}
function proofUrlFromPayment(p) {
  if (p?.proof_url) return p.proof_url;
  const pl = parsePayload(p);
  return pl?.transfer_proof?.proof_url || pl?.transfer_proof?.url || null;
}

// =====================
// API calls
// =====================
async function loadBranches() {
  try {
    const r = await http.get("/branches", { params: { limit: 200 } });
    branches.value = r?.data?.data || r?.data || [];
  } catch {
    branches.value = [];
  }
}

async function fetchOrders() {
  loading.value = true;
  error.value = "";

  const token = getToken();
  const tokenLen = token ? token.length : 0;

  try {
    const params = {
      page: meta.value.page,
      limit: meta.value.limit,
      q: filters.value.q || undefined,
      status: filters.value.status || undefined,
      fulfillment_type: filters.value.fulfillment_type || undefined,
      branch_id: filters.value.branch_id || undefined,
    };

    const r = await http.get("/admin/shop/orders", { params });
    const data = r?.data;

    rows.value = data?.data || [];
    meta.value = data?.meta || meta.value;
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo cargar pedidos.";
    if (e?.response?.status === 401) {
      error.value =
        `${msg} (401 Unauthorized). ` +
        `tokenLen=${tokenLen}. ` +
        `=> El frontend NO está leyendo el token real del login (storage/store).`;
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
  }
}

function reload() {
  meta.value.page = 1;
  fetchOrders();
}
function onPage(p) {
  meta.value.page = p;
  fetchOrders();
}
function onLimit(l) {
  meta.value.limit = l;
  meta.value.page = 1;
  fetchOrders();
}

async function openDetail(item) {
  detail.value.open = true;
  detail.value.loading = true;
  detail.value.error = "";
  detail.value.data = null;

  try {
    const r = await http.get(`/admin/shop/orders/${item.id}`);
    detail.value.data = r?.data || null;
  } catch (e) {
    detail.value.error = e?.response?.data?.message || e?.message || "No se pudo cargar detalle.";
  } finally {
    detail.value.loading = false;
  }
}

async function refreshDetail() {
  if (!detail.value?.data?.order?.id) return;
  const id = detail.value.data.order.id;
  try {
    const r = await http.get(`/admin/shop/orders/${id}`);
    detail.value.data = r?.data || detail.value.data;
  } catch {}
}

// =====================
// Payment Actions
// =====================
async function createMpLink(p) {
  payAction.value = { loading: true, paymentId: p.id, type: "mp" };
  try {
    const r = await http.post(`/ecom/payments/${p.id}/mercadopago/preference`, {});
    const init = r?.data?.mp?.init_point || r?.data?.mp?.sandbox_init_point || null;
    snack.value = { show: true, text: init ? "Link Mercado Pago creado ✅" : "Preferencia creada ✅" };
    await refreshDetail();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || "No se pudo crear link MP" };
  } finally {
    payAction.value = { loading: false, paymentId: null, type: "" };
  }
}

function openUpload(p) {
  uploadDlg.value = {
    open: true,
    loading: false,
    error: "",
    payment: p,
    bank_reference: "",
    file: null,
  };
}

async function doUploadProof() {
  const p = uploadDlg.value.payment;
  if (!p?.id) return;

  uploadDlg.value.loading = true;
  uploadDlg.value.error = "";

  try {
    if (!uploadDlg.value.file) {
      uploadDlg.value.error = "Seleccioná un archivo.";
      return;
    }

    const f = Array.isArray(uploadDlg.value.file) ? uploadDlg.value.file[0] : uploadDlg.value.file;

    const fd = new FormData();
    fd.append("file", f);
    if (uploadDlg.value.bank_reference) fd.append("bank_reference", uploadDlg.value.bank_reference);

    await http.post(`/ecom/payments/${p.id}/transfer/proof`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    snack.value = { show: true, text: "Comprobante subido ✅" };
    uploadDlg.value.open = false;
    await refreshDetail();
  } catch (e) {
    uploadDlg.value.error = e?.response?.data?.message || e?.message || "No se pudo subir.";
  } finally {
    uploadDlg.value.loading = false;
  }
}

async function reviewTransfer(p, action) {
  payAction.value = { loading: true, paymentId: p.id, type: action };

  try {
    const note =
      window.prompt(action === "approve" ? "Nota (opcional) para aprobar:" : "Motivo/nota (recomendado):", "") || "";

    // Si tu backend usa /review (POST) como en el controller nuevo que te pasé antes:
    // POST /api/v1/admin/shop/payments/:paymentId/review
    await http.post(`/admin/shop/payments/${p.id}/review`, { action, note });

    snack.value = {
      show: true,
      text: action === "approve" ? "Transferencia aprobada ✅" : "Transferencia rechazada ✅",
    };
    await refreshDetail();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || "No se pudo actualizar." };
  } finally {
    payAction.value = { loading: false, paymentId: null, type: "" };
  }
}

onMounted(async () => {
  await loadBranches();
  await fetchOrders();
});
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 0.9fr 0.8fr auto;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1100px) {
  .filters {
    grid-template-columns: 1fr 1fr;
  }
  .btn-apply {
    grid-column: 1 / -1;
  }
}

.orders-table :deep(.v-data-table__td) {
  vertical-align: top;
}

.code {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cust {
  min-width: 0;
}
.cust-name {
  font-weight: 900;
  line-height: 1.1;
}
.cust-email {
  font-size: 12px;
  opacity: 0.75;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payline {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.right {
  text-align: right;
}

.muted {
  opacity: 0.72;
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.box {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.box-title {
  font-weight: 900;
  margin-bottom: 6px;
}

.jsonbox {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  opacity: 0.9;
}
</style>
