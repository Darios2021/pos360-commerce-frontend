<template>
  <v-dialog :model-value="open" @update:model-value="(v) => !v && $emit('close')" max-width="540" persistent>
    <v-card rounded="xl" class="ted">
      <div class="ted-head">
        <v-icon size="22" color="primary">mdi-email-fast-outline</v-icon>
        <div>
          <p class="ted-eyebrow">Diagnóstico</p>
          <h3 class="ted-title">Probar envío de email</h3>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
      </div>

      <div class="ted-body">
        <p class="ted-help">
          Manda un email de prueba a la dirección que indiques para verificar
          que el servidor SMTP esté configurado correctamente. Si llega, todo
          funciona y ya podés mandar campañas a tus clientes.
        </p>

        <!-- Estado del servidor -->
        <div class="ted-status" :class="statusClass">
          <v-icon size="16">{{ statusIcon }}</v-icon>
          <span>{{ statusText }}</span>
        </div>

        <v-text-field
          v-model="form.to"
          label="Destinatario"
          placeholder="tu-email@ejemplo.com"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-email-outline"
          autofocus
          :disabled="busy"
        />

        <v-text-field
          v-model="form.subject"
          label="Asunto"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="busy"
        />

        <v-textarea
          v-model="form.body"
          label="Mensaje"
          variant="outlined"
          density="compact"
          hide-details
          rows="4"
          auto-grow
          :disabled="busy"
        />

        <!-- Resultado -->
        <v-alert
          v-if="result"
          :type="result.ok ? 'success' : 'error'"
          variant="tonal"
          density="compact"
          class="ted-result"
        >
          <div class="ted-result__title">
            {{ result.ok ? "✅ Email enviado" : "❌ No se pudo enviar" }}
          </div>
          <div class="ted-result__body">{{ result.message }}</div>
          <div v-if="result.message_id" class="ted-result__meta">
            <small>Provider: {{ result.provider }} · ID: {{ result.message_id }}</small>
          </div>
          <div v-if="result.code && !result.ok" class="ted-result__meta">
            <small>Código: {{ result.code }}</small>
          </div>
        </v-alert>
      </div>

      <div class="ted-actions">
        <v-btn variant="text" :disabled="busy" @click="$emit('close')">Cerrar</v-btn>
        <v-spacer />
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-refresh"
          :loading="checkingStatus"
          @click="loadStatus"
        >
          Verificar estado
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-send"
          :loading="busy"
          :disabled="!form.to || !form.body"
          @click="onSend"
        >
          Enviar prueba
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { getMessagingStatus, testSendEmail } from "../services/messaging.service";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);

const form = reactive({
  to: "",
  subject: "Prueba de envío POS360",
  body: "Hola! Este es un email de prueba enviado desde el POS para verificar que el servidor SMTP esté configurado correctamente.\n\nSi recibiste esto, todo está OK.\n\n— San Juan Tecnología",
});
const busy = ref(false);
const result = ref(null);
const status = ref(null);
const checkingStatus = ref(false);

watch(() => props.open, (o) => {
  if (o) {
    result.value = null;
    loadStatus();
  }
});

async function loadStatus() {
  checkingStatus.value = true;
  try {
    const { data } = await getMessagingStatus();
    status.value = data?.data || null;
  } catch (e) {
    status.value = null;
  } finally {
    checkingStatus.value = false;
  }
}

const statusClass = computed(() => {
  if (!status.value) return "ted-status--unknown";
  const s = status.value.email;
  if (s?.configured && s?.ok) return "ted-status--ok";
  if (s?.configured && !s?.ok) return "ted-status--error";
  return "ted-status--unknown";
});
const statusIcon = computed(() => {
  if (!status.value) return "mdi-help-circle-outline";
  const s = status.value.email;
  if (s?.configured && s?.ok) return "mdi-check-circle";
  if (s?.configured && !s?.ok) return "mdi-alert-circle";
  return "mdi-cog-off-outline";
});
const statusText = computed(() => {
  if (!status.value) return "Verificando estado del servidor SMTP…";
  const s = status.value.email;
  if (!s?.configured) return "❌ SMTP no configurado en CapRover (faltan variables SMTP_*).";
  if (s?.configured && s?.ok) return "✅ SMTP autenticado correctamente. Listo para enviar.";
  if (s?.configured && !s?.ok) return `⚠️ SMTP configurado pero no autentica: ${s?.error || "auth failed"}`;
  return "Estado desconocido.";
});

async function onSend() {
  busy.value = true;
  result.value = null;
  try {
    const { data } = await testSendEmail({
      to: form.to.trim(),
      subject: form.subject.trim(),
      body: form.body,
    });
    result.value = {
      ok: !!data?.ok,
      message: data?.message || "Enviado.",
      provider: data?.data?.provider || null,
      message_id: data?.data?.message_id || null,
      code: data?.code || null,
    };
  } catch (e) {
    const r = e?.response?.data || {};
    result.value = {
      ok: false,
      message: r?.message || e?.message || "Error desconocido al enviar.",
      code: r?.code || null,
    };
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.ted-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.ted-eyebrow { font-size: 11px; font-weight: 400; opacity: 0.65; margin: 0; letter-spacing: 0.04em; text-transform: uppercase; }
.ted-title { font-size: 17px; font-weight: 500; margin: 2px 0 0; line-height: 1.1; }

.ted-body {
  display: flex; flex-direction: column; gap: 12px;
  padding: 16px 18px;
}
.ted-help { margin: 0; font-size: 12.5px; line-height: 1.5; opacity: 0.8; }

.ted-status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 400;
  border: 1px solid;
}
.ted-status--ok {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.3);
  color: rgb(var(--v-theme-success));
}
.ted-status--error {
  background: rgba(var(--v-theme-error), 0.08);
  border-color: rgba(var(--v-theme-error), 0.3);
  color: rgb(var(--v-theme-error));
}
.ted-status--unknown {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-theme-on-surface), 0.15);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.ted-result__title { font-weight: 500; font-size: 13.5px; }
.ted-result__body  { font-size: 12.5px; margin-top: 4px; }
.ted-result__meta  { margin-top: 4px; opacity: 0.75; }

.ted-actions {
  display: flex; gap: 8px;
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  flex-wrap: wrap;
}
</style>
