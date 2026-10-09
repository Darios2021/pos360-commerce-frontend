<!-- src/modules/admin/pages/PaymentMethodEditPage.vue
     Alta y edicion de un medio de pago, en vista completa (antes era un modal
     del listado). Sin id es el alta. Las reglas de tipo -> precio -> cuotas son
     las mismas que tenia el modal. -->
<template>
  <v-container fluid class="pm-edit pa-4 pa-md-6">
    <AppPageHeader
      icon="mdi-credit-card-outline"
      :title="esNuevo ? 'Nuevo medio de pago' : (form.display_name || form.name || 'Medio de pago')"
      :subtitle="esNuevo ? '' : form.code"
    >
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="loading"
        @click="save"
      >
        Guardar
      </v-btn>
    </AppPageHeader>

    <div class="pm-volver">
      <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" :to="{ name: 'adminPaymentMethods' }">
        Medios de pago
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <div v-else class="pm-grid">
      <div class="pm-col">
        <section class="pm-section">
          <div class="pm-section__head">Datos</div>
          <div class="pm-section__body">
            <div class="pm-row-2">
              <v-text-field
                v-model="form.name"
                label="Nombre"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.name ? [errors.name] : []"
              />
              <v-text-field
                v-model="form.display_name"
                label="Nombre visible en el POS"
                variant="outlined"
                density="comfortable"
              />
            </div>
            <div class="pm-row-2">
              <v-select
                v-model="form.kind"
                :items="KIND_OPTIONS"
                label="Tipo"
                variant="outlined"
                density="comfortable"
              />
              <v-select
                v-if="form.kind === 'CARD'"
                v-model="form.card_kind"
                :items="CARD_KIND_SIMPLE_OPTIONS"
                label="Tarjeta"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.card_kind ? [errors.card_kind] : []"
              />
            </div>
            <v-select
              v-model="form.branch_id"
              :items="sucursales"
              item-title="name"
              item-value="id"
              label="Sucursal"
              variant="outlined"
              density="comfortable"
            />
            <v-textarea
              v-model="form.description"
              label="Descripción"
              rows="2"
              variant="outlined"
              density="comfortable"
              auto-grow
            />
          </div>
        </section>

        <section class="pm-section">
          <div class="pm-section__head">Precio y cuotas</div>
          <div class="pm-section__body">
            <v-select
              v-model="form.pricing_mode"
              :items="PRICE_SOURCE_OPTIONS"
              label="Precio que usa"
              variant="outlined"
              density="comfortable"
              :disabled="isDualCard"
            />
            <v-switch
              v-model="form.supports_installments"
              label="Permite cuotas"
              color="primary"
              hide-details
              inset
              class="mb-2"
            />
            <template v-if="form.supports_installments">
              <v-combobox
                v-model="installmentOptionsModel"
                :items="INSTALLMENT_SUGGESTIONS"
                label="Cuotas disponibles"
                variant="outlined"
                density="comfortable"
                multiple
                chips
                closable-chips
                :error-messages="errors.installment_plan_json ? [errors.installment_plan_json] : []"
              />
              <v-select
                v-model="form.default_installments"
                :items="defaultInstallmentsItems"
                label="Cuota por defecto"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.default_installments ? [errors.default_installments] : []"
              />
            </template>
          </div>
        </section>

        <section class="pm-section">
          <div class="pm-section__head">Estado</div>
          <div class="pm-section__body">
            <v-switch
              v-model="form.is_active"
              :label="form.is_active ? 'Activo' : 'Inactivo'"
              color="success"
              hide-details
              inset
            />
          </div>
        </section>

        <section v-if="!esNuevo && !form.is_system" class="pm-section pm-section--baja">
          <div class="pm-section__head">Eliminar</div>
          <div class="pm-section__body">
            <v-btn
              v-if="!confirmarBaja"
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete-outline"
              @click="confirmarBaja = true"
            >
              Eliminar medio de pago
            </v-btn>
            <v-btn
              v-else
              color="error"
              variant="flat"
              prepend-icon="mdi-delete-alert-outline"
              :loading="eliminando"
              @click="eliminar"
            >
              Confirmar: eliminar "{{ form.display_name || form.name }}"
            </v-btn>
          </div>
        </section>
      </div>

      <aside class="pm-col">
        <section class="pm-section">
          <div class="pm-section__head">En el POS</div>
          <div class="pm-resumen">
            <div class="pm-resumen__nombre">{{ previewName }}</div>
            <dl>
              <div><dt>Tipo</dt><dd>{{ previewKindLabel }}</dd></div>
              <div><dt>Precio</dt><dd>{{ previewPricingLabel }}</dd></div>
              <div><dt>Cuotas</dt><dd>{{ previewInstallmentsLabel }}</dd></div>
              <div><dt>Sucursal</dt><dd>{{ nombreSucursal(form.branch_id) }}</dd></div>
              <div><dt>Estado</dt><dd>{{ form.is_active ? "Activo" : "Inactivo" }}</dd></div>
            </dl>
          </div>
        </section>
      </aside>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createPaymentMethodForm,
  fetchAdminPaymentMethodById,
  createAdminPaymentMethod,
  updateAdminPaymentMethod,
  deleteAdminPaymentMethod,
  validatePaymentMethodForm,
  normalizePaymentMethod,
  buildPaymentMethodPayload,
} from "@/app/services/paymentMethod.service";
import { listBranches } from "@/modules/admin/services/branches.api";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import {
  KIND_OPTIONS,
  CARD_KIND_SIMPLE_OPTIONS,
  PRICE_SOURCE_OPTIONS,
  INSTALLMENT_SUGGESTIONS,
  kindLabel,
  normalizeInstallmentOptions,
  buildInstallmentPlan,
  extractInstallmentOptions,
} from "@/modules/admin/utils/mediosDePago";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id) || 0);
const esNuevo = computed(() => !id.value);

const loading = ref(false);
const saving = ref(false);
const eliminando = ref(false);
const confirmarBaja = ref(false);
const errors = ref({});
const installmentOptionsModel = ref([]);
const form = ref(createPaymentMethodForm({ kind: "CASH", pricing_mode: "SALE_PRICE", is_active: true }));
const snackbar = ref({ show: false, text: "", color: "success" });

const branches = ref([]);
const sucursales = computed(() => [
  { id: null, name: "Todas las sucursales" },
  ...branches.value.map((b) => ({ id: b.id, name: b.name })),
]);
function nombreSucursal(bid) {
  return sucursales.value.find((s) => s.id === (bid || null))?.name || `Sucursal #${bid}`;
}

function notify(text, color = "success") {
  snackbar.value = { show: true, text: String(text || ""), color };
}

// ── Reglas del formulario (las mismas del modal anterior) ──────────────────
const normalizedInstallmentOptions = computed(() => normalizeInstallmentOptions(installmentOptionsModel.value));
const defaultInstallmentsItems = computed(() =>
  normalizedInstallmentOptions.value.map((n) => ({ title: n === 1 ? "1 cuota" : `${n} cuotas`, value: n }))
);
const isDualCard = computed(() => form.value.kind === "CARD" && form.value.card_kind === "BOTH");

const previewPayload = computed(() =>
  buildPaymentMethodPayload({
    ...form.value,
    installment_plan_json: form.value.supports_installments
      ? buildInstallmentPlan(normalizedInstallmentOptions.value)
      : [],
  })
);
const previewName = computed(() => previewPayload.value.display_name || previewPayload.value.name || "Sin nombre");
const previewKindLabel = computed(() => (isDualCard.value ? "Tarjeta débito y crédito" : kindLabel(form.value.kind)));
const previewPricingLabel = computed(() => {
  if (isDualCard.value) return "Débito contado, crédito lista";
  return previewPayload.value.pricing_mode === "LIST_PRICE" ? "Precio lista" : "Precio contado";
});
const previewInstallmentsLabel = computed(() => {
  const opts = normalizedInstallmentOptions.value;
  if (!previewPayload.value.supports_installments || !opts.length) return "Sin cuotas";
  return opts.join(", ");
});

watch(() => form.value.kind, (kind) => {
  if (cargando) return;
  if (kind === "CASH" || kind === "TRANSFER" || kind === "QR") {
    form.value.pricing_mode = "SALE_PRICE";
    form.value.supports_installments = false;
    form.value.card_kind = null;
  }
  if (kind === "CARD") {
    form.value.card_kind = form.value.card_kind || "CREDIT";
    if (!normalizedInstallmentOptions.value.length) installmentOptionsModel.value = [1, 3, 6];
  }
  if (kind === "CREDIT_SJT") {
    form.value.pricing_mode = "LIST_PRICE";
    form.value.supports_installments = true;
    form.value.card_kind = null;
    if (!normalizedInstallmentOptions.value.length) installmentOptionsModel.value = [3, 6, 12];
  }
});

watch(() => form.value.card_kind, (cardKind) => {
  if (cargando || form.value.kind !== "CARD") return;
  if (cardKind === "DEBIT") {
    form.value.pricing_mode = "SALE_PRICE";
    form.value.supports_installments = false;
    installmentOptionsModel.value = [];
    return;
  }
  if (cardKind === "CREDIT") {
    form.value.pricing_mode = "LIST_PRICE";
    form.value.supports_installments = true;
    if (!normalizedInstallmentOptions.value.length) installmentOptionsModel.value = [1, 3, 6];
    return;
  }
  if (cardKind === "BOTH") {
    form.value.pricing_mode = "SALE_PRICE";
    form.value.supports_installments = true;
    if (!normalizedInstallmentOptions.value.length) installmentOptionsModel.value = [1, 3, 6];
  }
});

watch(() => form.value.supports_installments, (enabled) => {
  if (cargando) return;
  if (!enabled) {
    installmentOptionsModel.value = [];
    form.value.min_installments = 1;
    form.value.max_installments = 1;
    form.value.default_installments = 1;
    return;
  }
  if (!normalizedInstallmentOptions.value.length) installmentOptionsModel.value = [1, 3, 6];
});

watch(normalizedInstallmentOptions, (opts) => {
  if (!form.value.supports_installments || !opts.length) {
    form.value.min_installments = 1;
    form.value.max_installments = 1;
    form.value.default_installments = 1;
    form.value.installment_plan_json = [];
    return;
  }
  form.value.min_installments = opts[0];
  form.value.max_installments = opts[opts.length - 1];
  form.value.installment_plan_json = buildInstallmentPlan(opts);
  if (!opts.includes(Number(form.value.default_installments))) form.value.default_installments = opts[0];
});

// ── Carga, guardado y baja ─────────────────────────────────────────────────
// Mientras se vuelca el medio guardado, las reglas de arriba no pisan nada.
let cargando = false;

async function load() {
  try {
    branches.value = await listBranches();
  } catch {
    branches.value = [];
  }
  if (esNuevo.value) return;
  loading.value = true;
  try {
    const row = normalizePaymentMethod(await fetchAdminPaymentMethodById(id.value));
    cargando = true;
    form.value = createPaymentMethodForm(row);
    installmentOptionsModel.value = extractInstallmentOptions(row);
    setTimeout(() => { cargando = false; }, 0);
  } catch (e) {
    notify(e?.friendlyMessage || e?.message || "No se pudo cargar el medio de pago", "error");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = buildPaymentMethodPayload({
      ...form.value,
      installment_plan_json: form.value.supports_installments
        ? buildInstallmentPlan(normalizedInstallmentOptions.value)
        : [],
    });
    const check = validatePaymentMethodForm(payload);
    if (!check.ok) {
      errors.value = check.errors || {};
      notify("Revisá los campos marcados", "warning");
      return;
    }
    if (esNuevo.value) {
      const res = await createAdminPaymentMethod(check.payload);
      notify(res?.message || "Medio de pago creado");
    } else {
      await updateAdminPaymentMethod(id.value, check.payload);
      notify("Medio de pago guardado");
    }
    router.push({ name: "adminPaymentMethods" });
  } catch (e) {
    errors.value = e?.validation || {};
    notify(e?.friendlyMessage || e?.message || "No se pudo guardar", "error");
  } finally {
    saving.value = false;
  }
}

async function eliminar() {
  eliminando.value = true;
  try {
    await deleteAdminPaymentMethod(id.value);
    router.push({ name: "adminPaymentMethods" });
  } catch (e) {
    confirmarBaja.value = false;
    notify(e?.friendlyMessage || e?.message || "No se pudo eliminar", "error");
  } finally {
    eliminando.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.pm-edit { max-width: 1200px; }
.pm-volver { margin: -8px 0 12px; }
.pm-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.pm-col { display: flex; flex-direction: column; gap: 16px; }
.pm-section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}
.pm-section__head {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .6);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pm-section__body { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.pm-section--baja .pm-section__head { color: rgb(var(--v-theme-error)); }
.pm-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pm-resumen { padding: 16px; }
.pm-resumen__nombre { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
.pm-resumen dl { margin: 0; display: flex; flex-direction: column; gap: 8px; }
.pm-resumen dl > div { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; }
.pm-resumen dt { color: rgba(var(--v-theme-on-surface), .6); }
.pm-resumen dd { margin: 0; font-weight: 500; text-align: right; }
@media (max-width: 900px) {
  .pm-grid { grid-template-columns: minmax(0, 1fr); }
  .pm-row-2 { grid-template-columns: minmax(0, 1fr); }
}
</style>
