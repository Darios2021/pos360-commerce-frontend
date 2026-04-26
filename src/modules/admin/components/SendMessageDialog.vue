<template>
  <v-dialog :model-value="open" @update:model-value="(v) => !v && $emit('close')" max-width="900" persistent>
    <v-card rounded="xl" class="smd">
      <!-- HEAD -->
      <div class="smd-head">
        <v-icon size="22" :color="channel === 'email' ? 'primary' : 'success'">
          {{ channel === 'email' ? 'mdi-email-outline' : 'mdi-whatsapp' }}
        </v-icon>
        <div>
          <p class="smd-eyebrow">
            {{ targets.length === 1 ? `Para ${targets[0]?.display_name || '—'}` : `${targets.length} clientes seleccionados` }}
          </p>
          <h3 class="smd-title">
            {{ channel === 'email' ? 'Enviar email' : 'Enviar WhatsApp' }}
          </h3>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
      </div>

      <!-- TABS canal -->
      <div class="smd-tabs">
        <button
          type="button"
          class="smd-tab"
          :class="{ 'smd-tab--active': channel === 'email' }"
          :disabled="!canEmail"
          @click="onSwitchChannel('email')"
        >
          <v-icon size="16">mdi-email-outline</v-icon> Email
          <span v-if="!canEmail" class="smd-tab__badge">No configurado</span>
        </button>
        <button
          type="button"
          class="smd-tab"
          :class="{ 'smd-tab--active': channel === 'whatsapp' }"
          @click="onSwitchChannel('whatsapp')"
        >
          <v-icon size="16">mdi-whatsapp</v-icon> WhatsApp
          <span v-if="!canWhatsAppCloud" class="smd-tab__badge">Modo manual</span>
        </button>
      </div>

      <!-- BODY -->
      <div class="smd-body">
        <!-- Plantilla -->
        <div class="smd-row">
          <label class="smd-label">Plantilla</label>
          <v-select
            v-model="selectedTemplateId"
            :items="templateOptions"
            item-title="title"
            item-value="value"
            placeholder="(escribir mensaje libre)"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @update:model-value="onTemplateChange"
          >
            <template #append>
              <v-btn
                size="x-small"
                variant="text"
                prepend-icon="mdi-cog-outline"
                @click="$emit('open-templates')"
              >Plantillas</v-btn>
            </template>
          </v-select>
        </div>

        <!-- Subject (solo email) -->
        <div v-if="channel === 'email'" class="smd-row">
          <label class="smd-label">Asunto</label>
          <v-text-field
            v-model="form.subject"
            placeholder="Asunto del email"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <!-- Body con variables -->
        <div class="smd-row">
          <div class="smd-label-row">
            <label class="smd-label">Mensaje</label>
            <div class="smd-vars">
              <button
                v-for="v in variables"
                :key="v.key"
                type="button"
                class="smd-var"
                :title="v.label"
                @click="insertVariable(v.key)"
              >{{ varTag(v.key) }}</button>
            </div>
          </div>
          <v-textarea
            ref="bodyRef"
            v-model="form.body"
            placeholder="Escribí el mensaje. Click en una variable arriba para insertarla."
            variant="outlined"
            density="compact"
            hide-details
            rows="6"
            auto-grow
          />
          <div v-if="channel === 'whatsapp'" class="smd-hint">
            En WhatsApp se ignora el asunto. Mantenelo breve y sin HTML — solo texto plano.
          </div>
        </div>

        <!-- Modo WhatsApp (Cloud API vs link manual) -->
        <div v-if="channel === 'whatsapp'" class="smd-row smd-row--inline">
          <v-switch
            v-model="form.preferLink"
            color="primary"
            density="compact"
            hide-details
            :label="form.preferLink ? 'Modo manual: abre wa.me en el navegador' : 'Envío automático (Cloud API)'"
            :disabled="!canWhatsAppCloud"
          />
        </div>

        <!-- ════════ EXTRAS PRO (sólo email) ════════ -->
        <div v-if="channel === 'email'" class="smd-extras">
          <div class="smd-extras__head">
            <v-icon size="14" color="primary">mdi-tune-variant</v-icon>
            <span>Extras del email</span>
          </div>

          <div class="smd-extras__row">
            <v-switch
              v-model="form.includeSignature"
              color="primary" density="compact" hide-details
              :label="form.includeSignature ? 'Incluir mi firma' : 'Sin firma'"
              :disabled="!hasSignature"
              @update:model-value="loadPreviewLayout"
            />
            <v-btn v-if="!hasSignature" size="x-small" variant="text" prepend-icon="mdi-cog-outline"
                   :to="{ name: 'profile' }" target="_blank">
              Configurar en mi perfil
            </v-btn>
            <v-btn v-else size="x-small" variant="text" prepend-icon="mdi-pencil-outline"
                   :to="{ name: 'profile' }" target="_blank">
              Editar en mi perfil
            </v-btn>
          </div>

          <div class="smd-extras__row">
            <v-switch
              v-model="form.includeLocation"
              color="primary" density="compact" hide-details
              label="Incluir bloque de ubicación"
              @update:model-value="loadPreviewLayout"
            />
          </div>

          <div class="smd-extras__row smd-extras__row--col">
            <div class="smd-extras__label">
              Adjuntar productos promocionales
              <v-btn size="x-small" variant="text" prepend-icon="mdi-tag-multiple-outline"
                     :to="{ name: 'emailPromoBlocks' }" target="_blank">
                Gestionar catálogo
              </v-btn>
            </div>
            <v-select
              v-model="form.promoBlockIds"
              :items="promoOptions"
              item-title="title"
              item-value="value"
              :placeholder="promoOptions.length ? 'Elegí 1 a 4 productos' : 'No hay promos activas'"
              variant="outlined"
              density="compact"
              hide-details
              multiple
              chips
              closable-chips
              :disabled="!promoOptions.length"
              @update:model-value="onPromosChange"
            >
              <template #chip="{ props, item }">
                <v-chip v-bind="props" size="small" variant="tonal">
                  <template #prepend>
                    <v-avatar size="20" v-if="item.raw?.image_url" class="me-1">
                      <v-img :src="item.raw.image_url" cover />
                    </v-avatar>
                    <v-icon v-else size="14">mdi-tag-outline</v-icon>
                  </template>
                  {{ item.title }}
                </v-chip>
              </template>

              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-avatar size="32" rounded="lg" v-if="item.raw?.image_url">
                      <v-img :src="item.raw.image_url" cover />
                    </v-avatar>
                    <v-avatar size="32" rounded="lg" color="grey-lighten-3" v-else>
                      <v-icon size="18">mdi-tag-outline</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ item.raw?.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <span v-if="item.raw?.price_final" class="font-weight-bold">{{ item.raw.price_final }}</span>
                    <span v-if="item.raw?.installments_text" class="ms-2 text-caption text-medium-emphasis">
                      {{ item.raw.installments_text }}
                    </span>
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
            <div v-if="form.promoBlockIds.length > 4" class="smd-hint" style="color: rgb(var(--v-theme-warning));">
              Tip: más de 4 promos cansa al lector. Te sugerimos elegir 2-4.
            </div>
          </div>

          <div class="smd-extras__row">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-eye-outline"
                   :loading="busyLayoutPreview" @click="loadPreviewLayout">
              Vista previa del email completo
            </v-btn>
            <v-btn v-if="layoutHtml" size="small" variant="text" prepend-icon="mdi-open-in-new"
                   @click="openLayoutPreviewWindow">
              Abrir en nueva pestaña
            </v-btn>
          </div>

          <!-- Preview del HTML wrappeado -->
          <div v-if="layoutHtml" class="smd-iframe-wrap">
            <iframe :srcdoc="layoutHtml" class="smd-iframe" />
          </div>
        </div>

        <!-- PREVIEW (1 cliente) -->
        <div v-if="targets.length === 1" class="smd-preview">
          <div class="smd-preview__head">
            <v-icon size="14">mdi-eye-outline</v-icon>
            <span>Vista previa</span>
            <v-spacer />
            <v-btn size="x-small" variant="text" prepend-icon="mdi-refresh" :loading="busyPreview" @click="loadPreview">Actualizar</v-btn>
          </div>
          <div v-if="preview" class="smd-preview__body">
            <div v-if="channel === 'email' && preview.subject" class="smd-preview__subject">
              <b>Asunto:</b> {{ preview.subject }}
            </div>
            <div class="smd-preview__text" v-html="renderPreviewBody(preview.body)"></div>
            <div class="smd-preview__to">
              <v-icon size="12">{{ channel === 'email' ? 'mdi-email-outline' : 'mdi-whatsapp' }}</v-icon>
              {{ preview.to || '(sin destinatario)' }}
            </div>
          </div>
        </div>

        <!-- BULK info -->
        <div v-if="targets.length > 1" class="smd-bulk-info" :class="{ 'smd-bulk-info--warn': bulkOverCap }">
          <v-icon size="16" :color="bulkOverCap ? 'warning' : 'primary'">
            {{ bulkOverCap ? 'mdi-alert-circle' : 'mdi-shield-check-outline' }}
          </v-icon>
          <div class="smd-bulk-info__body">
            <div>
              Vas a enviar a <b>{{ targets.length }}</b> clientes.
              <span v-if="bulkOverCap" class="smd-bulk-info__warn">
                Excede el cap de {{ MAX_BULK_RECIPIENTS }} para envío profesional.
              </span>
              <span v-else>
                Los mensajes se renderizan individualmente con las variables de cada uno.
              </span>
            </div>
            <div class="smd-bulk-info__sub">
              <v-icon size="11">mdi-information-outline</v-icon>
              Limitamos a {{ MAX_BULK_RECIPIENTS }} destinatarios por tanda y los enviamos
              espaciados ({{ THROTTLE_SECONDS }}s entre uno y otro) para mantener buena
              reputación de remitente y evitar SPAM.
            </div>
            <div v-if="channel === 'email' && targets.length > 1" class="smd-bulk-info__sub">
              <v-icon size="11">mdi-clock-outline</v-icon>
              Tiempo estimado: ~{{ estimatedSeconds }}s. Esperá a que termine sin cerrar la pestaña.
            </div>
          </div>
        </div>

        <!-- Resultado bulk -->
        <v-alert
          v-if="result"
          :type="result.failed > 0 ? 'warning' : 'success'"
          variant="tonal"
          density="compact"
        >
          Enviados <b>{{ result.ok }}</b> ·
          Fallidos <b>{{ result.failed }}</b> ·
          Sin email/teléfono <b>{{ result.skipped }}</b>
          <span v-if="result.manual_links > 0">· <b>{{ result.manual_links }}</b> links wa.me generados</span>
          <div v-if="manualLinks.length" class="mt-2">
            <a
              v-for="(l, i) in manualLinks"
              :key="i"
              :href="l.link"
              target="_blank"
              rel="noopener noreferrer"
              class="smd-link"
            >Abrir wa.me #{{ i + 1 }}</a>
          </div>
        </v-alert>

        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact">
          {{ errorMsg }}
        </v-alert>
      </div>

      <!-- ACTIONS -->
      <div class="smd-actions">
        <v-btn variant="text" :disabled="busy" @click="$emit('close')">Cancelar</v-btn>
        <v-spacer />
        <v-btn
          v-if="targets.length === 1 && channel === 'whatsapp' && form.preferLink"
          color="success"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-whatsapp"
          :disabled="!form.body || busy"
          @click="onSend"
        >
          Generar link wa.me
        </v-btn>
        <v-btn
          v-else
          :color="channel === 'email' ? 'primary' : 'success'"
          variant="flat"
          rounded="lg"
          :prepend-icon="channel === 'email' ? 'mdi-send' : 'mdi-whatsapp'"
          :loading="busy"
          :disabled="!canSend"
          @click="onSend"
        >
          {{ targets.length === 1 ? 'Enviar' : `Enviar a ${targets.length}` }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  listMessageTemplates,
  listMessageVariables,
  getMessagingStatus,
  previewMessage,
  sendMessage,
  sendMessageBulk,
  previewEmailLayout,
} from "../services/messaging.service";
import { getMySignature } from "../services/mySignature.api";
import { listPromoBlocks } from "../services/emailPromoBlocks.api";

const props = defineProps({
  open: { type: Boolean, default: false },
  // targets: array de { id, display_name, email, phone }
  targets: { type: Array, default: () => [] },
  // channel inicial: "email" | "whatsapp"
  initialChannel: { type: String, default: "email" },
  // Promos pre-seleccionadas (cuando venís desde la vista "Promociones email")
  initialPromoIds: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "sent", "open-templates"]);

const channel = ref(props.initialChannel);
const templates = ref([]);
const variables = ref([]);
const messagingStatus = ref({ email: { configured: false }, whatsapp: { cloud_api_configured: false } });
const selectedTemplateId = ref(null);
const form = reactive({
  subject: "",
  body: "",
  preferLink: false,
  // Extras PRO (sólo email)
  includeSignature: true,
  includeLocation: true,
  promoBlockIds: [],
});

// Catálogo de promo blocks activos + firma del usuario logueado.
const promoBlocks = ref([]);
const mySignature = ref(null);
const layoutHtml = ref("");
const busyLayoutPreview = ref(false);

const hasSignature = computed(() => {
  const s = mySignature.value;
  if (!s) return false;
  return !!(s.display_name || s.role_title || s.email || s.phone || s.whatsapp || s.photo_url);
});

const promoOptions = computed(() =>
  promoBlocks.value.map((p) => ({
    title: p.title || p.name,
    value: p.id,
    raw: p,
  }))
);
const preview = ref(null);
const busyPreview = ref(false);
const busy = ref(false);
const result = ref(null);
const manualLinks = ref([]);
const errorMsg = ref("");
const bodyRef = ref(null);

const canEmail = computed(() => messagingStatus.value?.email?.configured === true);
const canWhatsAppCloud = computed(() => messagingStatus.value?.whatsapp?.cloud_api_configured === true);

const templateOptions = computed(() =>
  templates.value
    .filter((t) => t.channel === channel.value || t.channel === "both")
    .map((t) => ({ title: t.name + (t.category ? ` · ${t.category}` : ""), value: t.id, raw: t }))
);

// Cap profesional anti-spam: idéntico al de la vista Clientes. Aunque el
// CustomersAdminPage ya bloquea al seleccionar, defendemos también acá por si
// otra vista llama al dialog con N>10.
const MAX_BULK_RECIPIENTS = 10;
const THROTTLE_SECONDS = 0.8; // sincronizado con CRM_BULK_THROTTLE_MS del backend
const bulkOverCap = computed(() => props.targets.length > MAX_BULK_RECIPIENTS);
const estimatedSeconds = computed(() => {
  const n = Math.max(0, props.targets.length - 1);
  return Math.ceil(n * THROTTLE_SECONDS + props.targets.length * 0.4);
});

const canSend = computed(() => {
  if (!form.body?.trim()) return false;
  if (channel.value === "email" && !form.subject?.trim()) return false;
  if (bulkOverCap.value) return false;
  return true;
});

watch(() => props.open, (o) => {
  if (o) {
    // reset al abrir
    channel.value = props.initialChannel;
    selectedTemplateId.value = null;
    form.subject = "";
    form.body = "";
    form.preferLink = false;
    // Si venimos desde "Promociones email" → precargamos esas promos.
    form.promoBlockIds = Array.isArray(props.initialPromoIds) ? [...props.initialPromoIds] : [];
    form.includeLocation = true;
    preview.value = null;
    result.value = null;
    manualLinks.value = [];
    errorMsg.value = "";
    layoutHtml.value = "";
    init();
  }
});

async function init() {
  try {
    const [statusRes, varsRes, tplRes, sigRes, promoRes] = await Promise.all([
      getMessagingStatus(),
      listMessageVariables(),
      listMessageTemplates(""),
      getMySignature().catch(() => null),
      listPromoBlocks({ activeOnly: true }).catch(() => []),
    ]);
    messagingStatus.value = statusRes?.data?.data || messagingStatus.value;
    variables.value = varsRes?.data?.data || [];
    templates.value = tplRes?.data?.data || [];
    mySignature.value = sigRes || null;
    promoBlocks.value = Array.isArray(promoRes) ? promoRes : [];

    // Si la firma del usuario tiene include_by_default=false, arrancamos sin firma.
    if (mySignature.value && mySignature.value.include_by_default === false) {
      form.includeSignature = false;
    } else if (!hasSignature.value) {
      form.includeSignature = false;
    }

    // Si email no está configurado y la vista abrió en email, cambiamos a whatsapp.
    if (channel.value === "email" && !canEmail.value) {
      channel.value = "whatsapp";
    }
    // WhatsApp: si Cloud API no está, default modo link manual.
    if (channel.value === "whatsapp" && !canWhatsAppCloud.value) {
      form.preferLink = true;
    }
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo inicializar";
  }
}

function onSwitchChannel(c) {
  channel.value = c;
  selectedTemplateId.value = null;
  // Si pasamos a whatsapp y no hay Cloud API, forzar link manual.
  if (c === "whatsapp" && !canWhatsAppCloud.value) form.preferLink = true;
  if (c === "email") form.preferLink = false;
  if (props.targets.length === 1) loadPreview();
}

function onTemplateChange(id) {
  if (!id) {
    return;
  }
  const t = templates.value.find((x) => x.id === id);
  if (!t) return;
  form.subject = t.subject || "";
  form.body = t.body || "";
  if (props.targets.length === 1) loadPreview();
}

function insertVariable(key) {
  const tag = `{{${key}}}`;
  // Insertar al final del body (si no hay caret accesible).
  form.body = (form.body || "") + tag;
  if (props.targets.length === 1) loadPreview();
}

// Helper para mostrar el tag con doble llave en el template sin que Vue lo
// interprete como interpolación.
function varTag(key) {
  return "{{" + key + "}}";
}

async function loadPreview() {
  if (props.targets.length !== 1 || !form.body?.trim()) {
    preview.value = null;
    return;
  }
  busyPreview.value = true;
  try {
    const { data } = await previewMessage({
      customer_id: props.targets[0].id,
      channel: channel.value,
      template_id: selectedTemplateId.value || undefined,
      subject: form.subject || undefined,
      body: form.body,
    });
    preview.value = data?.data || null;
  } catch (e) {
    preview.value = null;
  } finally {
    busyPreview.value = false;
  }
}

// Vista previa del HTML completo del email (con layout, firma, promos, ubicación).
// Se renderiza dentro de un iframe para que el CSS del email no afecte al admin.
async function loadPreviewLayout() {
  if (channel.value !== "email") {
    layoutHtml.value = "";
    return;
  }
  if (!form.body?.trim()) return;
  busyLayoutPreview.value = true;
  try {
    const { data } = await previewEmailLayout({
      subject: form.subject || "Vista previa",
      body: form.body,
      include_signature: form.includeSignature,
      include_location: form.includeLocation,
      promo_block_ids: form.promoBlockIds,
    });
    layoutHtml.value = data?.data?.html || "";
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo armar el preview.";
  } finally {
    busyLayoutPreview.value = false;
  }
}

function onPromosChange() {
  if (layoutHtml.value) loadPreviewLayout();
}

function openLayoutPreviewWindow() {
  if (!layoutHtml.value) return;
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
  if (!w) return;
  w.document.open();
  w.document.write(layoutHtml.value);
  w.document.close();
}

watch(() => form.body, () => {
  if (props.targets.length === 1) {
    // Debounce mínimo para no spamear el endpoint mientras tipea.
    clearTimeout(window.__smdPrevTimer);
    window.__smdPrevTimer = setTimeout(loadPreview, 350);
  }
});
watch(() => form.subject, () => {
  if (props.targets.length === 1 && channel.value === "email") {
    clearTimeout(window.__smdPrevTimer);
    window.__smdPrevTimer = setTimeout(loadPreview, 350);
  }
});

function renderPreviewBody(body) {
  // Si el body tiene tags HTML, lo dejamos como está. Si es texto plano,
  // escapamos y convertimos saltos de línea a <br/> para que se vea natural.
  const s = String(body || "");
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(s);
  if (looksHtml) return s;
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

async function onSend() {
  busy.value = true;
  errorMsg.value = "";
  result.value = null;
  manualLinks.value = [];

  try {
    if (props.targets.length === 1) {
      const { data } = await sendMessage({
        customer_id: props.targets[0].id,
        channel: channel.value,
        template_id: selectedTemplateId.value || undefined,
        subject: form.subject || undefined,
        body: form.body,
        prefer_link: !!form.preferLink,
        ...(channel.value === "email" ? {
          include_signature: form.includeSignature,
          include_location: form.includeLocation,
          promo_block_ids: form.promoBlockIds,
        } : {}),
      });
      if (data?.ok) {
        // Si vino manual_link, abrimos en nueva pestaña directamente.
        if (data?.data?.manual_link) {
          window.open(data.data.manual_link, "_blank", "noopener,noreferrer");
        }
        emit("sent", { count: 1, status: data?.data?.status, link: data?.data?.manual_link });
        emit("close");
      } else {
        errorMsg.value = data?.message || "No se pudo enviar.";
      }
    } else {
      const { data } = await sendMessageBulk({
        customer_ids: props.targets.map((t) => t.id),
        channel: channel.value,
        template_id: selectedTemplateId.value || undefined,
        subject: form.subject || undefined,
        body: form.body,
        prefer_link: !!form.preferLink,
        ...(channel.value === "email" ? {
          include_signature: form.includeSignature,
          include_location: form.includeLocation,
          promo_block_ids: form.promoBlockIds,
        } : {}),
      });
      result.value = data?.summary || null;
      manualLinks.value = data?.manual_links || [];
      emit("sent", { count: data?.summary?.ok || 0, summary: data?.summary });
    }
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "Error al enviar";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.smd { display: flex; flex-direction: column; }
.smd-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.smd-eyebrow { font-size: 11px; font-weight: 700; opacity: 0.65; margin: 0; letter-spacing: 0.04em; text-transform: uppercase; }
.smd-title { font-size: 17px; font-weight: 800; margin: 2px 0 0; line-height: 1.1; }

.smd-tabs {
  display: flex; gap: 4px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.smd-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.65);
  transition: all 0.12s;
}
.smd-tab:hover:not(:disabled) { background: rgba(var(--v-theme-on-surface), 0.05); }
.smd-tab--active {
  background: rgb(var(--v-theme-surface));
  border-color: rgba(var(--v-theme-primary), 0.3);
  color: rgb(var(--v-theme-primary));
}
.smd-tab:disabled { opacity: 0.5; cursor: not-allowed; }
.smd-tab__badge {
  font-size: 9.5px; font-weight: 800;
  padding: 2px 6px; border-radius: 999px;
  background: rgba(var(--v-theme-warning), 0.18);
  color: rgb(var(--v-theme-warning));
  letter-spacing: 0.04em; text-transform: uppercase;
}

.smd-body {
  display: flex; flex-direction: column; gap: 14px;
  padding: 16px 18px;
  max-height: 60vh;
  overflow-y: auto;
}

.smd-row { display: flex; flex-direction: column; gap: 4px; }
.smd-row--inline { flex-direction: row; align-items: center; }
.smd-label { font-size: 11px; font-weight: 800; opacity: 0.7; letter-spacing: 0.05em; text-transform: uppercase; }
.smd-label-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; }

.smd-vars { display: flex; gap: 4px; flex-wrap: wrap; }
.smd-var {
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  transition: background 0.1s;
}
.smd-var:hover { background: rgba(var(--v-theme-primary), 0.14); }

.smd-hint {
  font-size: 11.5px;
  opacity: 0.7;
  margin-top: 4px;
}

.smd-preview {
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding: 10px 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.smd-preview__head {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; opacity: 0.7;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.smd-preview__subject { font-size: 12.5px; }
.smd-preview__text {
  font-size: 13px; line-height: 1.5;
  background: rgb(var(--v-theme-surface));
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.smd-preview__to {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; opacity: 0.7;
}

.smd-bulk-info {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
  font-size: 13px;
}
.smd-bulk-info--warn {
  background: rgba(var(--v-theme-warning), 0.08);
  border-color: rgba(var(--v-theme-warning), 0.4);
}
.smd-bulk-info__body { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; }
.smd-bulk-info__sub {
  font-size: 11px; opacity: 0.7; font-weight: 500;
  display: inline-flex; align-items: center; gap: 4px;
  line-height: 1.45;
}
.smd-bulk-info__warn {
  color: rgb(var(--v-theme-warning));
  font-weight: 800;
}

.smd-link {
  display: inline-block;
  margin-right: 8px;
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.smd-actions {
  display: flex; gap: 8px;
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

/* ════════ Extras PRO (firma, promos, ubicación) ════════ */
.smd-extras {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}
.smd-extras__head {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; opacity: 0.75;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
}
.smd-extras__row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.smd-extras__row--col {
  flex-direction: column; align-items: stretch;
}
.smd-extras__label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; font-weight: 800;
  letter-spacing: 0.05em; text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 4px;
}
.smd-iframe-wrap {
  margin-top: 6px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: #f4f6fa;
}
.smd-iframe {
  width: 100%;
  height: 480px;
  border: 0;
  display: block;
  background: #f4f6fa;
}
</style>
