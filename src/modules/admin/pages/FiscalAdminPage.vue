<template>
  <v-container fluid class="fiscal-admin-page">
    <AppPageHeader
      icon="mdi-file-document-outline"
      title="Configuración fiscal"
      subtitle="Gestioná configuración, certificados y prueba de conexión por sucursal."
    >
      <v-select
        v-model="selectedBranchId"
        :items="branchItems"
        item-title="name"
        item-value="id"
        label="Sucursal"
        variant="outlined"
        density="compact"
        hide-details
        style="min-width: 220px;"
      />
      <v-btn
        variant="tonal"
        size="small"
        rounded="lg"
        :loading="loadingAll"
        prepend-icon="mdi-refresh"
        @click="loadAll"
      >
        Recargar
      </v-btn>
    </AppPageHeader>

    <v-row class="mt-1" dense>
      <v-col cols="12" lg="8">
        <v-card class="panel-card" rounded="xl" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-icon size="22">mdi-file-cog-outline</v-icon>
            </template>
            <v-card-title>Configuración fiscal</v-card-title>
            <v-card-subtitle>
              Datos base de AFIP / homologación por sucursal.
            </v-card-subtitle>
          </v-card-item>

          <v-divider />

          <v-card-text>
            <v-alert
              v-if="configLoadError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ configLoadError }}
            </v-alert>

            <v-row dense>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="configForm.enabled"
                  color="primary"
                  inset
                  label="Fiscal habilitado"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="configForm.environment"
                  :items="environmentItems"
                  label="Entorno"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="configForm.default_invoice_type"
                  :items="invoiceTypeItems"
                  label="Comprobante por defecto"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="configForm.cuit"
                  label="CUIT"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  maxlength="11"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="configForm.punto_venta"
                  label="Punto de venta"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="configForm.condicion_iva"
                  :items="ivaItems"
                  label="Condición IVA"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="configForm.razon_social"
                  label="Razón social"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="configForm.cert_active_id"
                  label="ID certificado activo"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  hint="Opcional. Se completa solo al activar certificado."
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="configForm.wsaa_url"
                  label="WSAA URL"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="configForm.wsfe_url"
                  label="WSFE URL"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="configForm.notes"
                  label="Notas"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  auto-grow
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider />

          <v-card-actions class="justify-end pa-4">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              :loading="savingConfig"
              :disabled="!selectedBranchId"
              @click="saveConfig"
            >
              Guardar configuración
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="panel-card mt-4" rounded="xl" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-icon size="22">mdi-certificate-outline</v-icon>
            </template>
            <v-card-title>Alta de certificado</v-card-title>
            <v-card-subtitle>
              En esta primera versión se cargan rutas del servidor, no archivos binarios.
            </v-card-subtitle>
          </v-card-item>

          <v-divider />

          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="certForm.alias"
                  label="Alias"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="certForm.expires_at"
                  label="Vence (opcional)"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="certForm.cert_path"
                  label="Ruta certificado (cert_path)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="/etc/pos360/fiscal/archivo.crt"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="certForm.key_path"
                  label="Ruta key (key_path)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="/etc/pos360/fiscal/archivo.key"
                />
              </v-col>

              <v-col cols="12" md="8">
                <v-text-field
                  v-model="certForm.passphrase"
                  label="Passphrase (opcional)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :type="showPassphrase ? 'text' : 'password'"
                  :append-inner-icon="showPassphrase ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassphrase = !showPassphrase"
                />
              </v-col>

              <v-col cols="12" md="4" class="d-flex align-center">
                <v-switch
                  v-model="certForm.active"
                  color="primary"
                  inset
                  label="Dejar activo"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider />

          <v-card-actions class="justify-end pa-4">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-plus-circle-outline"
              :loading="savingCertificate"
              :disabled="!selectedBranchId"
              @click="saveCertificate"
            >
              Guardar certificado
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="panel-card" rounded="xl" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-icon size="22">mdi-connection</v-icon>
            </template>
            <v-card-title>Prueba</v-card-title>
            <v-card-subtitle>
              Verifica configuración y paths del certificado activo.
            </v-card-subtitle>
          </v-card-item>

          <v-divider />

          <v-card-text>
            <div class="test-box">
              <div class="test-box__row">
                <span class="label">Sucursal</span>
                <strong>{{ currentBranchName || "—" }}</strong>
              </div>
              <div class="test-box__row">
                <span class="label">Branch ID</span>
                <strong>{{ selectedBranchId || "—" }}</strong>
              </div>
            </div>

            <v-alert
              v-if="testResult"
              :type="testResult.ok ? 'success' : 'error'"
              variant="tonal"
              class="mt-4"
            >
              {{ testResult.message }}
            </v-alert>
          </v-card-text>

          <v-divider />

          <v-card-actions class="justify-end pa-4">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-play-circle-outline"
              :loading="testingConnection"
              :disabled="!selectedBranchId"
              @click="runTestConnection"
            >
              Probar conexión
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="panel-card mt-4" rounded="xl" elevation="0">
          <v-card-item>
            <template #prepend>
              <v-icon size="22">mdi-format-list-bulleted-square</v-icon>
            </template>
            <v-card-title>Certificados cargados</v-card-title>
            <v-card-subtitle>
              Lista actual de certificados de la sucursal.
            </v-card-subtitle>
          </v-card-item>

          <v-divider />

          <v-card-text class="pa-0">
            <div v-if="loadingCertificates" class="state-box">
              <v-progress-circular indeterminate size="22" />
              <span>Cargando certificados...</span>
            </div>

            <div v-else-if="!certificates.length" class="state-box">
              <v-icon size="22">mdi-folder-alert-outline</v-icon>
              <span>No hay certificados cargados.</span>
            </div>

            <div v-else class="cert-list">
              <div
                v-for="item in certificates"
                :key="item.id"
                class="cert-row"
              >
                <div class="cert-row__top">
                  <div class="cert-row__title">
                    {{ item.alias || `Certificado #${item.id}` }}
                  </div>
                  <v-chip
                    size="small"
                    :color="item.active ? 'success' : 'default'"
                    variant="tonal"
                  >
                    {{ item.active ? "Activo" : "Inactivo" }}
                  </v-chip>
                </div>

                <div class="cert-row__meta">
                  <div><strong>ID:</strong> {{ item.id }}</div>
                  <div><strong>Cert:</strong> {{ item.cert_path || "—" }}</div>
                  <div><strong>Key:</strong> {{ item.key_path || "—" }}</div>
                  <div><strong>Vence:</strong> {{ formatDate(item.expires_at) }}</div>
                  <div><strong>Validado:</strong> {{ formatDateTime(item.last_validated_at) }}</div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="bottom right"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import fiscalAdminService from "@/app/services/fiscalAdmin.service";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const auth = useAuthStore();

const loadingAll = ref(false);
const loadingCertificates = ref(false);
const savingConfig = ref(false);
const savingCertificate = ref(false);
const testingConnection = ref(false);

const configLoadError = ref("");
const certificates = ref([]);
const testResult = ref(null);
const showPassphrase = ref(false);

const snackbar = reactive({
  show: false,
  text: "",
  color: "primary",
});

const environmentItems = [
  { title: "Testing", value: "testing" },
  { title: "Producción", value: "production" },
];

const ivaItems = [
  { title: "Responsable Inscripto", value: "RESPONSABLE_INSCRIPTO" },
  { title: "Monotributo", value: "MONOTRIBUTO" },
  { title: "Exento", value: "EXENTO" },
  { title: "Consumidor Final", value: "CONSUMIDOR_FINAL" },
  { title: "Otro", value: "OTRO" },
];

const invoiceTypeItems = [
  { title: "Ticket", value: "TICKET" },
  { title: "Factura A", value: "A" },
  { title: "Factura B", value: "B" },
  { title: "Factura C", value: "C" },
  { title: "Factura M", value: "M" },
  { title: "Nota de Crédito", value: "NC" },
  { title: "Nota de Débito", value: "ND" },
  { title: "Otro", value: "OTHER" },
];

const selectedBranchId = ref(null);

const configForm = reactive({
  branch_id: null,
  enabled: true,
  environment: "testing",
  cuit: "",
  razon_social: "",
  punto_venta: 1,
  condicion_iva: "RESPONSABLE_INSCRIPTO",
  default_invoice_type: "B",
  wsaa_url: "",
  wsfe_url: "",
  cert_active_id: null,
  notes: "",
});

const certForm = reactive({
  branch_id: null,
  alias: "",
  cert_path: "",
  key_path: "",
  passphrase: "",
  active: true,
  expires_at: null,
});

const branchItems = computed(() => {
  const fromAuth = Array.isArray(auth?.user?.branches)
    ? auth.user.branches
    : Array.isArray(auth?.branches)
    ? auth.branches
    : [];

  const normalized = fromAuth
    .map((b) => ({
      id: Number(b?.id),
      name: b?.name || `Sucursal #${b?.id}`,
    }))
    .filter((b) => Number.isFinite(b.id) && b.id > 0);

  if (normalized.length) return normalized;

  const fallbackId = Number(auth?.user?.branch_id || auth?.branch_id || 0);
  return fallbackId
    ? [{ id: fallbackId, name: `Sucursal #${fallbackId}` }]
    : [];
});

const currentBranchName = computed(() => {
  const found = branchItems.value.find((b) => Number(b.id) === Number(selectedBranchId.value));
  return found?.name || null;
});

function showToast(text, color = "primary") {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

function resetConfigForm() {
  configForm.branch_id = selectedBranchId.value || null;
  configForm.enabled = true;
  configForm.environment = "testing";
  configForm.cuit = "";
  configForm.razon_social = "";
  configForm.punto_venta = 1;
  configForm.condicion_iva = "RESPONSABLE_INSCRIPTO";
  configForm.default_invoice_type = "B";
  configForm.wsaa_url = "";
  configForm.wsfe_url = "";
  configForm.cert_active_id = null;
  configForm.notes = "";
}

function fillConfigForm(item) {
  resetConfigForm();

  if (!item) return;

  configForm.branch_id = Number(item.branch_id || selectedBranchId.value || null);
  configForm.enabled = !!item.enabled;
  configForm.environment = item.environment || "testing";
  configForm.cuit = item.cuit || "";
  configForm.razon_social = item.razon_social || "";
  configForm.punto_venta = Number(item.punto_venta || 1);
  configForm.condicion_iva = item.condicion_iva || "RESPONSABLE_INSCRIPTO";
  configForm.default_invoice_type = item.default_invoice_type || "B";
  configForm.wsaa_url = item.wsaa_url || "";
  configForm.wsfe_url = item.wsfe_url || "";
  configForm.cert_active_id = item.cert_active_id ? Number(item.cert_active_id) : null;
  configForm.notes = item.notes || "";
}

function resetCertForm() {
  certForm.branch_id = selectedBranchId.value || null;
  certForm.alias = "";
  certForm.cert_path = "";
  certForm.key_path = "";
  certForm.passphrase = "";
  certForm.active = true;
  certForm.expires_at = null;
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString();
}

function formatDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

async function loadConfig() {
  if (!selectedBranchId.value) return;

  configLoadError.value = "";
  testResult.value = null;

  try {
    const item = await fiscalAdminService.getConfig(selectedBranchId.value);
    fillConfigForm(item);
  } catch (err) {
    resetConfigForm();
    configLoadError.value = err?.friendlyMessage || err?.message || "No se pudo cargar la configuración fiscal.";
  }
}

async function loadCertificates() {
  if (!selectedBranchId.value) return;

  loadingCertificates.value = true;

  try {
    certificates.value = await fiscalAdminService.listCertificates(selectedBranchId.value);
  } catch (err) {
    certificates.value = [];
    showToast(err?.friendlyMessage || err?.message || "No se pudieron cargar los certificados.", "error");
  } finally {
    loadingCertificates.value = false;
  }
}

async function loadAll() {
  if (!selectedBranchId.value) {
    showToast("Seleccioná una sucursal.", "warning");
    return;
  }

  loadingAll.value = true;

  try {
    await Promise.all([loadConfig(), loadCertificates()]);
  } finally {
    loadingAll.value = false;
  }
}

async function saveConfig() {
  if (!selectedBranchId.value) {
    showToast("Seleccioná una sucursal.", "warning");
    return;
  }

  savingConfig.value = true;

  try {
    const item = await fiscalAdminService.putConfig({
      ...configForm,
      branch_id: selectedBranchId.value,
    });

    fillConfigForm(item);
    showToast("Configuración fiscal guardada correctamente.", "success");
    await loadCertificates();
  } catch (err) {
    showToast(err?.friendlyMessage || err?.message || "No se pudo guardar la configuración.", "error");
  } finally {
    savingConfig.value = false;
  }
}

async function saveCertificate() {
  if (!selectedBranchId.value) {
    showToast("Seleccioná una sucursal.", "warning");
    return;
  }

  savingCertificate.value = true;

  try {
    await fiscalAdminService.upsertCertificate({
      ...certForm,
      branch_id: selectedBranchId.value,
    });

    showToast("Certificado guardado correctamente.", "success");
    resetCertForm();
    await Promise.all([loadCertificates(), loadConfig()]);
  } catch (err) {
    showToast(err?.friendlyMessage || err?.message || "No se pudo guardar el certificado.", "error");
  } finally {
    savingCertificate.value = false;
  }
}

async function runTestConnection() {
  if (!selectedBranchId.value) {
    showToast("Seleccioná una sucursal.", "warning");
    return;
  }

  testingConnection.value = true;
  testResult.value = null;

  try {
    const resp = await fiscalAdminService.testConnection(selectedBranchId.value);
    testResult.value = {
      ok: !!resp?.ok,
      message: resp?.message || "Prueba completada.",
      item: resp?.item || null,
    };
    showToast(testResult.value.message, "success");
    await loadCertificates();
  } catch (err) {
    testResult.value = {
      ok: false,
      message: err?.friendlyMessage || err?.message || "La prueba falló.",
    };
    showToast(testResult.value.message, "error");
  } finally {
    testingConnection.value = false;
  }
}

watch(selectedBranchId, async (val) => {
  configForm.branch_id = val || null;
  certForm.branch_id = val || null;
  if (val) await loadAll();
});

onMounted(async () => {
  auth.hydrate?.();

  const firstBranchId =
    Number(auth?.user?.branch_id || 0) ||
    Number(branchItems.value?.[0]?.id || 0) ||
    null;

  selectedBranchId.value = firstBranchId;
  resetConfigForm();
  resetCertForm();

  if (selectedBranchId.value) {
    await loadAll();
  }
});
</script>

<style scoped>
.fiscal-admin-page {
  padding-bottom: 32px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-eyebrow {
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 4px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 500;
}

.page-subtitle {
  margin: 8px 0 0;
  opacity: 0.75;
  max-width: 760px;
}

.page-head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
}

.branch-select {
  min-width: 220px;
}

.panel-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
}

.test-box {
  display: grid;
  gap: 10px;
}

.test-box__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.test-box__row .label {
  opacity: 0.7;
}

.state-box {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0.72;
  padding: 20px;
}

.cert-list {
  display: grid;
  gap: 0;
}

.cert-row {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.cert-row:last-child {
  border-bottom: 0;
}

.cert-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.cert-row__title {
  font-size: 15px;
  font-weight: 400;
}

.cert-row__meta {
  display: grid;
  gap: 6px;
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
  opacity: 0.86;
}

@media (max-width: 960px) {
  .page-head {
    flex-direction: column;
  }

  .page-head-actions {
    width: 100%;
    min-width: 0;
    flex-direction: column;
    align-items: stretch;
  }

  .branch-select {
    min-width: 0;
    width: 100%;
  }
}
</style>