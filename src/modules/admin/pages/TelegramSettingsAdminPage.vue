<template>
  <div class="tg">
    <!-- HEADER -->
    <AppPageHeader
      icon="mdi-send-variant"
      title="Alertas Telegram"
      subtitle="Notificá eventos críticos del sistema a un grupo de Telegram"
    >
      <v-btn
        variant="tonal"
        size="small"
        rounded="lg"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="reload"
      >
        Actualizar
      </v-btn>
    </AppPageHeader>

    <!-- STATUS -->
    <div class="tg-status" v-if="cfg">
      <div
        class="tg-status__chip"
        :class="{
          'is-ok': cfg.enabled && cfg.bot_token_masked && cfg.chat_id,
          'is-warn': cfg.bot_token_masked && cfg.chat_id && !cfg.enabled,
          'is-err': !cfg.bot_token_masked || !cfg.chat_id,
        }"
      >
        <span class="tg-status__dot" />
        <span v-if="cfg.enabled && cfg.bot_token_masked && cfg.chat_id">
          Activo — enviando alertas
        </span>
        <span v-else-if="cfg.bot_token_masked && cfg.chat_id && !cfg.enabled">
          Configurado pero deshabilitado
        </span>
        <span v-else>
          Falta configurar bot_token o chat_id
        </span>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
      {{ error }}
    </v-alert>

    <!-- GUÍA rápida -->
    <div class="tg-help">
      <div class="tg-help__title">
        <v-icon size="16">mdi-help-circle-outline</v-icon>
        ¿Cómo obtener token y chat_id?
      </div>
      <ol class="tg-help__list">
        <li>Abrí Telegram, buscá <code>@BotFather</code>, mandá <code>/newbot</code> y seguí los pasos. Copiá el <b>token</b>.</li>
        <li>Creá un grupo y agregá tu bot como miembro.</li>
        <li>En el grupo mandá cualquier mensaje (ej. <code>/start</code>).</li>
        <li>En tu navegador abrí <code>https://api.telegram.org/bot&lt;TU_TOKEN&gt;/getUpdates</code> y copiá el <code>chat.id</code> del grupo (número negativo).</li>
      </ol>
    </div>

    <!-- CONFIG -->
    <section class="tg-card">
      <div class="tg-card__title">
        <v-icon size="16">mdi-key-outline</v-icon> Credenciales
      </div>

      <div class="tg-form">
        <v-text-field
          v-model="form.bot_token"
          :placeholder="cfg?.bot_token_masked || 'Pegá el bot token'"
          :label="cfg?.bot_token_masked ? `Bot token (actual: ${cfg.bot_token_masked})` : 'Bot token'"
          variant="outlined"
          density="compact"
          hide-details
          :type="showToken ? 'text' : 'password'"
          :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showToken = !showToken"
          autocomplete="off"
        />
        <div class="tg-form__hint">Dejalo vacío para mantener el actual. Se envía al backend solo si lo modificás.</div>

        <v-text-field
          v-model="form.chat_id"
          label="Chat ID del grupo"
          placeholder="-100123456789"
          variant="outlined"
          density="compact"
          hide-details
        />

        <div class="tg-form__row">
          <v-switch
            v-model="form.enabled"
            color="success"
            hide-details
            density="compact"
            :label="form.enabled ? 'Bot habilitado' : 'Bot deshabilitado'"
          />
          <v-btn
            variant="flat"
            color="primary"
            size="small"
            rounded="lg"
            prepend-icon="mdi-content-save"
            :loading="saving"
            @click="save"
          >
            Guardar configuración
          </v-btn>
        </div>
      </div>
    </section>

    <!-- PRUEBA -->
    <section class="tg-card">
      <div class="tg-card__title">
        <v-icon size="16">mdi-test-tube</v-icon> Probar envío
      </div>

      <div class="tg-test">
        <v-textarea
          v-model="testText"
          label="Mensaje de prueba (opcional)"
          rows="2"
          auto-grow
          variant="outlined"
          density="compact"
          hide-details
          placeholder="Podés usar HTML: <b>negrita</b>, <i>cursiva</i>…"
        />
        <div class="tg-test__actions">
          <v-btn
            variant="tonal"
            size="small"
            rounded="lg"
            prepend-icon="mdi-robot-outline"
            :loading="pinging"
            @click="onPing"
          >
            Verificar bot (getMe)
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            size="small"
            rounded="lg"
            prepend-icon="mdi-send"
            :loading="testing"
            @click="onTestSend"
          >
            Enviar prueba al grupo
          </v-btn>
          <v-btn
            variant="tonal"
            color="warning"
            size="small"
            rounded="lg"
            prepend-icon="mdi-radar"
            :loading="scanning"
            @click="onRunScans"
            title="Dispara los escaneos del cron al instante (cajas +8h y derivaciones pendientes)"
          >
            Forzar escaneo
          </v-btn>
          <v-btn
            variant="tonal"
            color="error"
            size="small"
            rounded="lg"
            prepend-icon="mdi-package-variant-remove"
            :loading="scanningStock"
            @click="onScanLowStock"
            title="Manda al grupo un resumen de productos con stock 0 o negativo"
          >
            Reporte stock crítico
          </v-btn>
        </div>

        <v-alert v-if="testResult" :type="testResult.type" variant="tonal" density="compact" class="mt-2">
          {{ testResult.text }}
        </v-alert>
      </div>
    </section>

    <!-- ALERTAS -->
    <section class="tg-card">
      <div class="tg-card__title">
        <v-icon size="16">mdi-bell-outline</v-icon> Tipos de alertas
        <span class="tg-card__sub">Activá las que querés recibir</span>
      </div>

      <div class="tg-alerts-grid">
        <div class="tg-group">
          <div class="tg-group__title">
            <v-icon size="14" color="primary">mdi-cash-register</v-icon> Caja
          </div>
          <v-switch
            v-for="a in cashAlerts"
            :key="a.key"
            v-model="form[a.key]"
            color="primary"
            hide-details
            density="compact"
            :label="a.label"
            @update:model-value="autosave(a.key)"
          />
        </div>

        <div class="tg-group">
          <div class="tg-group__title">
            <v-icon size="14" color="primary">mdi-package-variant-closed</v-icon> Stock
          </div>
          <v-switch
            v-for="a in stockAlerts"
            :key="a.key"
            v-model="form[a.key]"
            color="primary"
            hide-details
            density="compact"
            :label="a.label"
            @update:model-value="autosave(a.key)"
          />
        </div>

        <div class="tg-group">
          <div class="tg-group__title">
            <v-icon size="14" color="primary">mdi-truck-fast-outline</v-icon> Derivaciones
          </div>
          <v-switch
            v-for="a in transferAlerts"
            :key="a.key"
            v-model="form[a.key]"
            color="primary"
            hide-details
            density="compact"
            :label="a.label"
            @update:model-value="autosave(a.key)"
          />
        </div>

        <div class="tg-group">
          <div class="tg-group__title">
            <v-icon size="14" color="primary">mdi-storefront-outline</v-icon> Shop
          </div>
          <v-switch
            v-for="a in shopAlerts"
            :key="a.key"
            v-model="form[a.key]"
            color="primary"
            hide-details
            density="compact"
            :label="a.label"
            @update:model-value="autosave(a.key)"
          />
        </div>

        <div class="tg-group">
          <div class="tg-group__title">
            <v-icon size="14" color="primary">mdi-tag-heart-outline</v-icon> Productos
          </div>
          <v-switch
            v-for="a in productAlerts"
            :key="a.key"
            v-model="form[a.key]"
            color="primary"
            hide-details
            density="compact"
            :label="a.label"
            @update:model-value="autosave(a.key)"
          />
        </div>
      </div>
    </section>

    <!-- LOGS -->
    <section class="tg-card">
      <div class="tg-card__title">
        <v-icon size="16">mdi-history</v-icon> Histórico de envíos
        <v-chip size="x-small" class="ml-2" variant="tonal">{{ logsMeta.total || 0 }}</v-chip>
        <v-spacer />
        <v-btn size="x-small" variant="text" :loading="loadingLogs" @click="reloadLogs">
          <v-icon start size="14">mdi-refresh</v-icon>Recargar
        </v-btn>
      </div>

      <div v-if="!logs.length && !loadingLogs" class="tg-empty">
        Sin envíos registrados.
      </div>

      <div v-else class="tg-logs">
        <table class="tg-logs-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Código</th>
              <th>Ref.</th>
              <th>Estado</th>
              <th>Mensaje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in logs" :key="l.id">
              <td class="mono">{{ fmtDateTime(l.sent_at) }}</td>
              <td><span class="tg-code">{{ l.alert_code }}</span></td>
              <td class="mono dim">
                <span v-if="l.reference_type">{{ l.reference_type }} #{{ l.reference_id }}</span>
                <span v-else>—</span>
              </td>
              <td>
                <span class="tg-log-status" :class="l.success ? 'is-ok' : 'is-err'">
                  {{ l.success ? 'OK' : 'Error' }}
                </span>
              </td>
              <td class="tg-log-msg" :title="l.text">
                {{ plain(l.text) }}
                <div v-if="l.error" class="tg-log-err">{{ l.error }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import {
  getTelegramConfig,
  updateTelegramConfig,
  testTelegramSend,
  pingTelegramBot,
  listTelegramLogs,
  runScansNow,
  scanLowStock,
} from "@/modules/admin/services/telegram.service";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const pinging = ref(false);
const scanning = ref(false);
const scanningStock = ref(false);
const loadingLogs = ref(false);
const error = ref("");
const testResult = ref(null);
const showToken = ref(false);
const testText = ref("");

const cfg = ref(null);
const logs = ref([]);
const logsMeta = ref({ total: 0, limit: 100, offset: 0 });

const form = reactive({
  bot_token: "",
  chat_id: "",
  enabled: false,
  alert_cash_opened: true,
  alert_cash_closed: true,
  alert_cash_shortage: true,
  alert_cash_surplus: true,
  alert_cash_long_open: true,
  alert_cash_overtime: true,
  alert_cash_big_out: false,
  alert_stock_zero: true,
  alert_stock_low: false,
  alert_stock_negative: true,
  alert_stock_big_adjust: false,
  alert_shop_new_order: true,
  alert_shop_new_reservation: true,
  alert_shop_payment_confirmed: true,
  alert_shop_order_confirmed: true,
  alert_transfer_dispatched: true,
  alert_transfer_pending: true,
  alert_transfer_received: true,
  alert_promo_change: true,
});

const cashAlerts = [
  { key: "alert_cash_opened", label: "Apertura de caja" },
  { key: "alert_cash_closed", label: "Cierre de caja" },
  { key: "alert_cash_shortage", label: "Faltante al cerrar caja" },
  { key: "alert_cash_surplus", label: "Sobrante atípico al cerrar" },
  { key: "alert_cash_long_open", label: "Caja abierta +8h" },
  { key: "alert_cash_overtime", label: "Cierre con turno excedido (+8h)" },
  { key: "alert_cash_big_out", label: "Egreso manual grande" },
];

const stockAlerts = [
  { key: "alert_stock_zero", label: "Producto en 0 (rotura)" },
  { key: "alert_stock_low", label: "Stock bajo mínimo" },
  { key: "alert_stock_negative", label: "Stock negativo (error)" },
  { key: "alert_stock_big_adjust", label: "Ajuste manual grande" },
];

const transferAlerts = [
  { key: "alert_transfer_dispatched", label: "Nueva derivación enviada" },
  { key: "alert_transfer_received", label: "Derivación recibida" },
  { key: "alert_transfer_pending", label: "Pendiente de recibir +24h" },
];

const shopAlerts = [
  { key: "alert_shop_new_reservation", label: "Reserva en sucursal (retiro)" },
  { key: "alert_shop_new_order", label: "Compra con envío a domicilio" },
  { key: "alert_shop_payment_confirmed", label: "Pago Mercado Pago aprobado" },
  { key: "alert_shop_order_confirmed", label: "Compra concretada (admin descontó stock)" },
];

const productAlerts = [
  { key: "alert_promo_change", label: "Promoción activada / desactivada / modificada" },
];

async function reload() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getTelegramConfig();
    cfg.value = res?.data || null;
    if (cfg.value) {
      form.chat_id = cfg.value.chat_id || "";
      form.enabled = !!cfg.value.enabled;
      for (const key of [
        ...cashAlerts.map((a) => a.key),
        ...stockAlerts.map((a) => a.key),
        ...transferAlerts.map((a) => a.key),
        ...shopAlerts.map((a) => a.key),
        ...productAlerts.map((a) => a.key),
      ]) {
        if (Object.prototype.hasOwnProperty.call(cfg.value, key)) {
          form[key] = !!cfg.value[key];
        }
      }
      form.bot_token = ""; // no prellenar el token
    }
    await reloadLogs();
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  testResult.value = null;
  try {
    const patch = {
      chat_id: form.chat_id || null,
      enabled: !!form.enabled,
      alert_cash_opened: !!form.alert_cash_opened,
      alert_cash_closed: !!form.alert_cash_closed,
      alert_cash_shortage: !!form.alert_cash_shortage,
      alert_cash_surplus: !!form.alert_cash_surplus,
      alert_cash_long_open: !!form.alert_cash_long_open,
      alert_cash_overtime: !!form.alert_cash_overtime,
      alert_cash_big_out: !!form.alert_cash_big_out,
      alert_stock_zero: !!form.alert_stock_zero,
      alert_stock_low: !!form.alert_stock_low,
      alert_stock_negative: !!form.alert_stock_negative,
      alert_stock_big_adjust: !!form.alert_stock_big_adjust,
      alert_shop_new_order: !!form.alert_shop_new_order,
      alert_shop_new_reservation: !!form.alert_shop_new_reservation,
      alert_shop_payment_confirmed: !!form.alert_shop_payment_confirmed,
      alert_shop_order_confirmed: !!form.alert_shop_order_confirmed,
      alert_transfer_dispatched: !!form.alert_transfer_dispatched,
      alert_transfer_pending: !!form.alert_transfer_pending,
      alert_transfer_received: !!form.alert_transfer_received,
      alert_promo_change: !!form.alert_promo_change,
    };
    if (form.bot_token && form.bot_token.trim()) {
      patch.bot_token = form.bot_token.trim();
    }
    const res = await updateTelegramConfig(patch);
    cfg.value = res?.data || cfg.value;
    form.bot_token = "";
    testResult.value = { type: "success", text: "Configuración guardada." };
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo guardar";
  } finally {
    saving.value = false;
  }
}

// Autosave cuando cambia un switch de alertas (no requiere reingresar token).
let autosaveTimer = null;
function autosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => save(), 200);
}

async function onTestSend() {
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testTelegramSend(testText.value);
    if (res?.ok) {
      testResult.value = {
        type: "success",
        text: res.note || "Mensaje enviado correctamente al grupo.",
      };
    } else {
      testResult.value = {
        type: "error",
        text: `No se pudo enviar: ${res?.error || res?.reason || "error desconocido"}`,
      };
    }
    await reloadLogs();
  } catch (e) {
    testResult.value = {
      type: "error",
      text: e?.friendlyMessage || e?.message || "Error al enviar",
    };
  } finally {
    testing.value = false;
  }
}

async function onPing() {
  pinging.value = true;
  testResult.value = null;
  try {
    const res = await pingTelegramBot();
    if (res?.ok && res?.bot) {
      testResult.value = {
        type: "success",
        text: `Bot OK: @${res.bot.username} (${res.bot.first_name})`,
      };
    } else {
      testResult.value = { type: "error", text: res?.error || "Bot no responde" };
    }
  } catch (e) {
    testResult.value = {
      type: "error",
      text: e?.friendlyMessage || e?.message || "Error verificando bot",
    };
  } finally {
    pinging.value = false;
  }
}

async function onScanLowStock() {
  scanningStock.value = true;
  testResult.value = null;
  try {
    const res = await scanLowStock(30);
    if (res?.ok) {
      const total = res.total || 0;
      const neg = res.negative_count || 0;
      testResult.value = {
        type: total === 0 ? "success" : "info",
        text: total === 0
          ? "Sin productos en rotura."
          : `Reporte enviado al grupo: ${total} productos sin stock (${neg} negativos).`,
      };
      setTimeout(reloadLogs, 1500);
    } else {
      testResult.value = {
        type: "error",
        text: `No se pudo enviar: ${res?.error || res?.reason || "error desconocido"}`,
      };
    }
  } catch (e) {
    testResult.value = {
      type: "error",
      text: e?.friendlyMessage || e?.message || "Error al disparar reporte",
    };
  } finally {
    scanningStock.value = false;
  }
}

async function onRunScans() {
  scanning.value = true;
  testResult.value = null;
  try {
    const res = await runScansNow();
    if (res?.ok) {
      testResult.value = {
        type: "success",
        text: "Escaneo disparado. Las alertas que apliquen llegarán en segundos.",
      };
      // Refrescar log a los 2s para ver si se generaron envíos.
      setTimeout(reloadLogs, 2000);
    } else {
      testResult.value = { type: "error", text: "No se pudo correr el escaneo." };
    }
  } catch (e) {
    testResult.value = {
      type: "error",
      text: e?.friendlyMessage || e?.message || "Error al disparar escaneo",
    };
  } finally {
    scanning.value = false;
  }
}

async function reloadLogs() {
  loadingLogs.value = true;
  try {
    const res = await listTelegramLogs({ limit: 50 });
    logs.value = Array.isArray(res?.data) ? res.data : [];
    logsMeta.value = res?.meta || logsMeta.value;
  } catch (_) {
    logs.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("es-AR")} ${d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}
function plain(html) {
  return String(html || "").replace(/<[^>]+>/g, "").slice(0, 140);
}

onMounted(reload);
</script>

<style scoped>
.tg {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.tg-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.tg-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tg-title {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -0.01em;
}
.tg-subtitle {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 500;
}

.tg-status__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid;
}
.tg-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.tg-status__chip.is-ok {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.4);
}
.tg-status__chip.is-ok .tg-status__dot {
  background: rgb(var(--v-theme-success));
  animation: tg-pulse 1.8s ease-in-out infinite;
}
.tg-status__chip.is-warn {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.4);
}
.tg-status__chip.is-warn .tg-status__dot { background: #f59e0b; }
.tg-status__chip.is-err {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.35);
}
.tg-status__chip.is-err .tg-status__dot { background: rgb(var(--v-theme-error)); }
@keyframes tg-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
  50%      { box-shadow: 0 0 0 5px rgba(var(--v-theme-success), 0.3); }
}

.tg-help {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}
.tg-help__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 6px;
}
.tg-help__list {
  margin: 0;
  padding-left: 22px;
  font-size: 12.5px;
  line-height: 1.6;
  opacity: 0.88;
}
.tg-help__list code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11.5px;
}

.tg-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  padding: 16px 18px;
}
.tg-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
  margin-bottom: 14px;
}
.tg-card__sub {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  opacity: 0.7;
  margin-left: 6px;
}

.tg-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tg-form__hint {
  font-size: 11px;
  opacity: 0.55;
  margin-top: -6px;
}
.tg-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tg-test {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tg-test__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tg-alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
.tg-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tg-group__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.75;
  margin-bottom: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.tg-empty {
  padding: 24px;
  text-align: center;
  font-size: 12.5px;
  opacity: 0.5;
  font-weight: 400;
}

.tg-logs {
  overflow-x: auto;
}
.tg-logs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}
.tg-logs-table th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 500;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.tg-logs-table td {
  padding: 10px;
  font-size: 12.5px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}
.tg-logs-table tr:last-child td { border-bottom: none; }
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
}
.dim { opacity: 0.6; }

.tg-code {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 500;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.tg-log-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tg-log-status.is-ok  { background: rgba(var(--v-theme-success), 0.14); color: rgb(var(--v-theme-success)); }
.tg-log-status.is-err { background: rgba(var(--v-theme-error), 0.14);   color: rgb(var(--v-theme-error)); }

.tg-log-msg {
  max-width: 420px;
  font-size: 12px;
  opacity: 0.85;
}
.tg-log-err {
  font-size: 11px;
  color: rgb(var(--v-theme-error));
  opacity: 0.85;
  margin-top: 2px;
}
</style>
