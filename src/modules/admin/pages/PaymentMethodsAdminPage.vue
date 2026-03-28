<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/admin/pages/PaymentMethodsAdminPage.vue -->

<template>
  <v-container fluid class="payment-methods-page pa-4 pa-md-6">
    <div class="page-head mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Medios de pago</div>
        <div class="text-body-2 text-medium-emphasis">
          Creá medios simples como efectivo, transferencia, QR, tarjeta o crédito.
        </div>
      </div>

      <div class="page-head-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo medio
        </v-btn>
      </div>
    </div>

    <v-card rounded="xl" elevation="0" class="mb-4 border-card">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.q"
              label="Buscar"
              placeholder="Nombre o código..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @keyup.enter="loadRows"
              @click:clear="loadRows"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="filters.branch_id"
              label="Sucursal (branch_id)"
              type="number"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-switch
              v-model="filters.active_only"
              label="Solo activos"
              color="primary"
              hide-details
              inset
            />
          </v-col>

          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-refresh"
              block
              :loading="loading"
              @click="loadRows"
            >
              Actualizar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="0" class="border-card">
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="rows"
          :loading="loading"
          item-value="id"
          class="pm-table"
          no-data-text="No hay medios de pago"
          loading-text="Cargando medios de pago..."
        >
          <template #item.name="{ item }">
            <div class="py-2">
              <div class="font-weight-medium">
                {{ item.display_name || item.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.code || "—" }}
              </div>
            </div>
          </template>

          <template #item.kind="{ item }">
            <v-chip size="small" variant="tonal">
              {{ kindLabel(item.kind) }}
            </v-chip>
          </template>

          <template #item.price_source="{ item }">
            <v-chip size="small" variant="tonal" color="primary">
              {{ pricingLabel(item) }}
            </v-chip>
          </template>

          <template #item.installments="{ item }">
            <div class="text-body-2">
              {{ installmentsSummary(item) }}
            </div>
          </template>

          <template #item.is_active="{ item }">
            <v-chip
              size="small"
              :color="item.is_active ? 'success' : 'grey'"
              variant="tonal"
            >
              {{ item.is_active ? "Activo" : "Inactivo" }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex justify-end ga-2 py-1">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                @click="openEdit(item)"
              />
              <v-btn
                :icon="
                  item.is_active
                    ? 'mdi-toggle-switch-off-outline'
                    : 'mdi-toggle-switch-outline'
                "
                size="small"
                variant="text"
                @click="toggleActive(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                :disabled="item.is_system"
                @click="removeItem(item)"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="900">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-h6">
            {{ isEdit ? "Editar medio de pago" : "Nuevo medio de pago" }}
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.name"
                label="Nombre"
                placeholder="Ej: Crédito Argentino"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.name ? [errors.name] : []"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.display_name"
                label="Nombre visible"
                placeholder="Opcional"
                variant="outlined"
                density="comfortable"
                hint="Si lo dejás vacío, se usa el nombre"
                persistent-hint
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="form.kind"
                :items="KIND_OPTIONS"
                label="Tipo"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="4" v-if="form.kind === 'CARD'">
              <v-select
                v-model="form.card_kind"
                :items="CARD_KIND_SIMPLE_OPTIONS"
                label="Tipo de tarjeta"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.card_kind ? [errors.card_kind] : []"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="form.pricing_mode"
                :items="PRICE_SOURCE_OPTIONS"
                label="Precio que usa"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-switch
                v-model="form.supports_installments"
                label="¿Permite cuotas?"
                color="primary"
                hide-details
                inset
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-switch
                v-model="form.is_active"
                label="Activo"
                color="primary"
                hide-details
                inset
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.branch_id"
                label="Sucursal (branch_id)"
                type="number"
                variant="outlined"
                density="comfortable"
                hint="Vacío = global"
                persistent-hint
              />
            </v-col>

            <template v-if="form.supports_installments">
              <v-col cols="12">
                <v-combobox
                  v-model="installmentOptionsModel"
                  :items="INSTALLMENT_SUGGESTIONS"
                  label="Cuotas disponibles"
                  variant="outlined"
                  density="comfortable"
                  multiple
                  chips
                  closable-chips
                  hint="Ej: 3, 6, 12"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="form.default_installments"
                  :items="defaultInstallmentsItems"
                  label="Cuota por defecto"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </template>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Descripción"
                placeholder="Opcional"
                rows="2"
                variant="outlined"
                density="comfortable"
                auto-grow
              />
            </v-col>
          </v-row>

          <v-alert
            variant="tonal"
            color="primary"
            class="mt-4"
            density="comfortable"
          >
            <div class="font-weight-medium mb-1">Vista previa</div>
            <div class="text-body-2">
              <strong>{{ previewName }}</strong>
              <span class="mx-1">•</span>
              {{ kindLabel(form.kind) }}
              <span class="mx-1">•</span>
              {{ previewPricingLabel }}
              <span v-if="form.supports_installments">
                <span class="mx-1">•</span>
                {{ previewInstallmentsLabel }}
              </span>
            </div>
          </v-alert>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">
            {{ isEdit ? "Guardar cambios" : "Crear medio" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top right"
      timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import {
  createPaymentMethodForm,
  fetchAdminPaymentMethods,
  createAdminPaymentMethod,
  updateAdminPaymentMethod,
  toggleAdminPaymentMethodActive,
  deleteAdminPaymentMethod,
  validatePaymentMethodForm,
  normalizePaymentMethod,
} from "@/app/services/paymentMethod.service";

const KIND_OPTIONS = [
  { title: "Efectivo", value: "CASH" },
  { title: "Tarjeta", value: "CARD" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "QR / Digital", value: "QR" },
  { title: "Crédito / Financiación", value: "CREDIT_SJT" },
  { title: "Otro", value: "OTHER" },
];

const CARD_KIND_SIMPLE_OPTIONS = [
  { title: "Crédito", value: "CREDIT" },
  { title: "Débito", value: "DEBIT" },
  { title: "Ambas", value: "BOTH" },
];

const PRICE_SOURCE_OPTIONS = [
  { title: "Precio contado", value: "SALE_PRICE" },
  { title: "Precio lista", value: "LIST_PRICE" },
];

const INSTALLMENT_SUGGESTIONS = [1, 3, 6, 9, 12, 18];

const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const isEdit = ref(false);

const rows = ref([]);
const errors = ref({});
const installmentOptionsModel = ref([]);

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

const filters = ref({
  q: "",
  branch_id: null,
  active_only: false,
});

const form = ref(createPaymentMethodForm());

const headers = [
  { title: "Nombre", key: "name", sortable: false },
  { title: "Tipo", key: "kind", sortable: false },
  { title: "Precio", key: "price_source", sortable: false },
  { title: "Cuotas", key: "installments", sortable: false },
  { title: "Estado", key: "is_active", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" },
];

function normalizeInstallmentOptions(values) {
  const nums = (Array.isArray(values) ? values : [])
    .map((v) => parseInt(String(v ?? "").trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  return [...new Set(nums)].sort((a, b) => a - b);
}

const normalizedInstallmentOptions = computed(() =>
  normalizeInstallmentOptions(installmentOptionsModel.value)
);

const defaultInstallmentsItems = computed(() => normalizedInstallmentOptions.value);

const previewName = computed(
  () => form.value.display_name || form.value.name || "Sin nombre"
);

const previewPricingLabel = computed(() =>
  form.value.pricing_mode === "LIST_PRICE" ? "Precio lista" : "Precio contado"
);

const previewInstallmentsLabel = computed(() => {
  const opts = normalizedInstallmentOptions.value;
  if (!form.value.supports_installments || !opts.length) return "Sin cuotas";
  return `Cuotas: ${opts.join(", ")}`;
});

watch(
  () => form.value.kind,
  (kind) => {
    if (kind === "CASH") {
      form.value.pricing_mode = "SALE_PRICE";
      form.value.supports_installments = false;
      form.value.card_kind = null;
    }

    if (kind === "TRANSFER" || kind === "QR") {
      form.value.pricing_mode = "SALE_PRICE";
      form.value.supports_installments = false;
      form.value.card_kind = null;
    }

    if (kind === "CARD") {
      form.value.card_kind = form.value.card_kind || "CREDIT";
      if (!normalizedInstallmentOptions.value.length) {
        installmentOptionsModel.value = [1, 3, 6];
      }
    }

    if (kind === "CREDIT_SJT") {
      form.value.pricing_mode = "LIST_PRICE";
      if (!normalizedInstallmentOptions.value.length) {
        installmentOptionsModel.value = [3, 6, 12];
      }
      form.value.supports_installments = true;
      form.value.card_kind = null;
    }
  }
);

watch(
  () => form.value.supports_installments,
  (enabled) => {
    if (!enabled) {
      installmentOptionsModel.value = [];
      form.value.min_installments = 1;
      form.value.max_installments = 1;
      form.value.default_installments = 1;
      return;
    }

    if (!normalizedInstallmentOptions.value.length) {
      installmentOptionsModel.value = [1, 3, 6];
    }
  }
);

watch(
  normalizedInstallmentOptions,
  (opts) => {
    if (!form.value.supports_installments || !opts.length) {
      form.value.min_installments = 1;
      form.value.max_installments = 1;
      form.value.default_installments = 1;
      return;
    }

    form.value.min_installments = opts[0];
    form.value.max_installments = opts[opts.length - 1];

    if (!opts.includes(Number(form.value.default_installments))) {
      form.value.default_installments = opts[0];
    }
  },
  { immediate: true }
);

function notify(text, color = "success") {
  snackbar.value = {
    show: true,
    text: String(text || ""),
    color,
  };
}

function kindLabel(kind) {
  const found = KIND_OPTIONS.find((x) => x.value === kind);
  return found?.title || kind || "—";
}

function pricingLabel(item) {
  return item?.pricing_mode === "LIST_PRICE" ? "Precio lista" : "Precio contado";
}

function extractInstallmentOptions(item) {
  const raw = Array.isArray(item?.installment_plan_json)
    ? item.installment_plan_json
    : [];

  const fromPlan = raw
    .map((x) => parseInt(String(x?.installments ?? ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (fromPlan.length) {
    return [...new Set(fromPlan)].sort((a, b) => a - b);
  }

  if (
    Number.isFinite(Number(item?.min_installments)) &&
    Number.isFinite(Number(item?.max_installments)) &&
    Number(item?.max_installments) >= Number(item?.min_installments)
  ) {
    const min = Number(item.min_installments);
    const max = Number(item.max_installments);
    if (min === max) return [min];
  }

  return [];
}

function installmentsSummary(item) {
  if (!item?.supports_installments) return "Sin cuotas";

  const plan = extractInstallmentOptions(item);
  if (!plan.length) {
    if (item.min_installments && item.max_installments) {
      if (Number(item.min_installments) === Number(item.max_installments)) {
        return `${item.min_installments} cuota${Number(item.min_installments) > 1 ? "s" : ""}`;
      }
      return `${item.min_installments} a ${item.max_installments} cuotas`;
    }
    return "Con cuotas";
  }

  return plan.join(", ");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildInstallmentPlan(options) {
  return normalizeInstallmentOptions(options).map((n) => ({
    installments: n,
    pricing_mode: "SAME_AS_BASE",
    surcharge_percent: 0,
  }));
}

function buildPayloadFromSimpleForm() {
  const installmentOptions = normalizedInstallmentOptions.value;
  const supportsInstallments =
    !!form.value.supports_installments && installmentOptions.length > 0;

  return {
    ...form.value,
    code: form.value.code || slugify(form.value.name),
    display_name: form.value.display_name || form.value.name,
    supports_installments: supportsInstallments,
    min_installments: supportsInstallments ? installmentOptions[0] : 1,
    max_installments: supportsInstallments
      ? installmentOptions[installmentOptions.length - 1]
      : 1,
    default_installments: supportsInstallments
      ? Number(form.value.default_installments || installmentOptions[0] || 1)
      : 1,
    installment_pricing_mode: "SAME_AS_BASE",
    installment_plan_json: supportsInstallments
      ? buildInstallmentPlan(installmentOptions)
      : [],
    provider_code: form.value.provider_code || slugify(form.value.name),
    only_pos: false,
    only_ecom: false,
    only_backoffice: false,
    allow_mixed: true,
    is_default: !!form.value.is_default,
    is_featured: !!form.value.is_featured,
    description: form.value.description || "",
    surcharge_percent: 0,
    surcharge_fixed_amount: 0,
    fixed_price_value: null,
    rounding_mode: "NONE",
    rounding_value: null,
  };
}

function openCreate() {
  isEdit.value = false;
  errors.value = {};

  form.value = createPaymentMethodForm({
    branch_id: filters.value.branch_id || null,
    kind: "CASH",
    pricing_mode: "SALE_PRICE",
    is_active: true,
  });

  installmentOptionsModel.value = [];
  dialog.value = true;
}

function openEdit(item) {
  const normalized = normalizePaymentMethod(item);

  isEdit.value = true;
  errors.value = {};
  form.value = createPaymentMethodForm(normalized);
  installmentOptionsModel.value = extractInstallmentOptions(normalized);
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  saving.value = false;
  errors.value = {};
}

async function loadRows() {
  loading.value = true;
  try {
    rows.value = await fetchAdminPaymentMethods({
      q: filters.value.q,
      branch_id: filters.value.branch_id,
      active_only: filters.value.active_only,
    });
  } catch (e) {
    notify(
      e?.friendlyMessage || e?.message || "Error al cargar medios de pago",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function save() {
  try {
    saving.value = true;
    errors.value = {};

    const payload = buildPayloadFromSimpleForm();
    const check = validatePaymentMethodForm(payload);

    if (!check.ok) {
      errors.value = check.errors || {};
      notify("Revisá los campos del formulario", "warning");
      return;
    }

    if (isEdit.value && form.value.id) {
      await updateAdminPaymentMethod(form.value.id, payload);
      notify("Medio de pago actualizado", "success");
    } else {
      await createAdminPaymentMethod(payload);
      notify("Medio de pago creado", "success");
    }

    dialog.value = false;
    await loadRows();
  } catch (e) {
    errors.value = e?.validation || {};
    notify(e?.friendlyMessage || e?.message || "No se pudo guardar", "error");
  } finally {
    saving.value = false;
  }
}

async function toggleActive(item) {
  try {
    await toggleAdminPaymentMethodActive(item.id);
    notify("Estado actualizado", "success");
    await loadRows();
  } catch (e) {
    notify(
      e?.friendlyMessage || e?.message || "No se pudo cambiar el estado",
      "error"
    );
  }
}

async function removeItem(item) {
  const ok = window.confirm(`¿Eliminar "${item.display_name || item.name}"?`);
  if (!ok) return;

  try {
    await deleteAdminPaymentMethod(item.id);
    notify("Medio de pago eliminado", "success");
    await loadRows();
  } catch (e) {
    notify(e?.friendlyMessage || e?.message || "No se pudo eliminar", "error");
  }
}

onMounted(loadRows);
</script>

<style scoped>
.payment-methods-page {
  background: transparent;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.border-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
}

.pm-table :deep(.v-data-table__tr:hover td) {
  background: rgba(var(--v-theme-primary), 0.04);
}

@media (max-width: 960px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }

  .page-head-actions {
    justify-content: stretch;
  }

  .page-head-actions > * {
    width: 100%;
  }
}
</style>