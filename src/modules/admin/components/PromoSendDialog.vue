<!-- src/modules/admin/components/PromoSendDialog.vue -->
<!--
  Dialog "todo en uno" para enviar promociones — VERSIÓN 2.0.

  Layout 2 columnas:
   - Izquierda: configuración (canal, destinatarios, mensaje, extras).
   - Derecha: preview en VIVO con tabs Email / WhatsApp.

  Cada vez que cambia algo del form, se actualiza el preview con debounce.
  Email se renderiza en iframe con el layout real. WhatsApp se renderiza en
  un mockup tipo burbuja con el texto formateado real.

  Sumamos también un "SPAM Score" simple — analiza asunto y body buscando
  patrones comunes que disparan filtros (palabras gatillo, exceso de !!!, etc.)
  y muestra una nota con sugerencias.
-->
<template>
  <v-dialog :model-value="open" @update:model-value="(v) => !v && $emit('close')"
            max-width="1280" persistent scrollable>
    <v-card rounded="xl" class="psd">
      <!-- HEADER -->
      <div class="psd-head">
        <v-icon size="22" color="primary">mdi-send-circle-outline</v-icon>
        <div class="flex-grow-1">
          <p class="psd-eyebrow">CRM · Envío profesional</p>
          <h3 class="psd-title">Enviar promociones</h3>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
      </div>

      <!-- 2 COLUMNAS -->
      <div class="psd-grid">
        <!-- ════════════ COL IZQUIERDA — CONFIG ════════════ -->
        <div class="psd-col psd-col--config">

          <!-- Promos adjuntas -->
          <section class="psd-section">
            <div class="psd-section__head">
              <v-icon size="14" color="primary">mdi-tag-outline</v-icon>
              <span>Promociones <b>{{ activePromos.length }}</b></span>
            </div>
            <div v-if="!activePromos.length" class="psd-empty">
              No hay promociones cargadas.
            </div>
            <div v-else class="psd-promos">
              <div v-for="p in activePromos" :key="p.id" class="psd-promo-chip">
                <v-avatar size="28" rounded="md" color="grey-lighten-3">
                  <v-img v-if="p.image_url" :src="p.image_url" cover />
                  <v-icon v-else size="14">mdi-tag-outline</v-icon>
                </v-avatar>
                <div class="psd-promo-chip__main">
                  <div class="psd-promo-chip__title">{{ p.title || p.name }}</div>
                  <div v-if="p.price_final" class="psd-promo-chip__price">{{ p.price_final }}</div>
                </div>
                <v-btn icon="mdi-close" variant="text" size="x-small" @click="removePromo(p.id)" />
              </div>
            </div>
          </section>

          <!-- Canal -->
          <section class="psd-section">
            <div class="psd-section__head">
              <v-icon size="14" color="primary">mdi-send-outline</v-icon>
              <span>Canal de envío</span>
            </div>
            <div class="psd-channels">
              <button
                v-for="opt in channelOptions" :key="opt.value"
                type="button"
                class="psd-channel"
                :class="{
                  'psd-channel--active': form.channel === opt.value,
                  'psd-channel--disabled': opt.disabled,
                }"
                :disabled="opt.disabled"
                @click="!opt.disabled && (form.channel = opt.value)"
              >
                <v-icon :size="18" :color="opt.color">{{ opt.icon }}</v-icon>
                <span class="psd-channel__label">{{ opt.label }}</span>
              </button>
            </div>
          </section>

          <!-- Destinatarios -->
          <section class="psd-section">
            <div class="psd-section__head">
              <v-icon size="14" color="primary">mdi-account-multiple-outline</v-icon>
              <span>Destinatarios</span>
              <span class="psd-counter" :class="{ 'psd-counter--cap': atCap }">
                {{ form.targets.length }} / {{ MAX_TARGETS }}
              </span>
              <v-spacer />
              <button v-if="form.targets.length" class="psd-mini-clear" type="button"
                      @click="form.targets = []">Limpiar</button>
            </div>

            <v-text-field
              v-model="customerSearch"
              placeholder="Buscar por nombre, email, teléfono..."
              variant="outlined" density="compact" hide-details
              prepend-inner-icon="mdi-magnify"
              :loading="searchLoading"
              @update:model-value="onSearch"
              @focus="onSearch()"
            />

            <div v-if="searchResults.length" class="psd-search-results">
              <button
                v-for="c in searchResults" :key="c.id"
                type="button"
                class="psd-search-row"
                :class="{
                  'psd-search-row--added': isTarget(c.id),
                  'psd-search-row--invalid': !canAdd(c).ok,
                }"
                :disabled="atCap || isTarget(c.id) || !canAdd(c).ok"
                @click="addTarget(c)"
              >
                <div class="psd-search-row__avatar">{{ initialsOf(c) }}</div>
                <div class="psd-search-row__info">
                  <div class="psd-search-row__name">{{ c.display_name || `${c.first_name || ""} ${c.last_name || ""}` }}</div>
                  <div class="psd-search-row__contact">
                    <span v-if="c.email">📧 {{ c.email }}</span>
                    <span v-if="c.phone">📞 {{ c.phone }}</span>
                    <span v-if="!c.email && !c.phone" class="psd-dim">Sin contacto</span>
                  </div>
                </div>
                <span v-if="isTarget(c.id)" class="psd-tag psd-tag--ok">✓</span>
                <span v-else-if="!canAdd(c).ok" class="psd-tag psd-tag--err">{{ canAdd(c).reason }}</span>
                <span v-else class="psd-tag psd-tag--add">+</span>
              </button>
            </div>

            <div v-if="form.targets.length" class="psd-targets">
              <div v-for="t in form.targets" :key="t.id" class="psd-target">
                <div class="psd-target__avatar">{{ initialsOf(t) }}</div>
                <div class="psd-target__main">
                  <div class="psd-target__name">{{ t.display_name }}</div>
                  <div class="psd-target__contact">
                    <span v-if="t.email">📧 {{ t.email }}</span>
                    <span v-if="t.phone">📞 {{ t.phone }}</span>
                  </div>
                </div>
                <v-btn icon="mdi-close" variant="text" size="x-small" @click="removeTarget(t.id)" />
              </div>
            </div>
          </section>

          <!-- Mensaje -->
          <section class="psd-section">
            <div class="psd-section__head">
              <v-icon size="14" color="primary">mdi-text-box-outline</v-icon>
              <span>Mensaje</span>
            </div>

            <v-select
              v-model="selectedTemplateId"
              :items="templateOptions"
              item-title="title" item-value="value"
              placeholder="(escribir libre)"
              label="Plantilla (opcional)"
              variant="outlined" density="compact" hide-details
              clearable
              @update:model-value="onTemplateChange"
              class="mb-2"
            />

            <v-text-field
              v-if="needsSubject"
              v-model="form.subject"
              label="Asunto del email"
              placeholder="Ej: Promos seleccionadas para vos"
              variant="outlined" density="compact" hide-details
              class="mb-2"
            />

            <v-textarea
              v-model="form.body" rows="4" auto-grow
              label="Mensaje"
              placeholder="Hola {{first_name}}, te paso..."
              variant="outlined" density="compact" hide-details
            />

            <div class="psd-vars">
              <button v-for="v in variables" :key="v.key"
                      type="button" class="psd-var" :title="v.label"
                      @click="insertVariable(v.key)">
                {{ varTag(v.key) }}
              </button>
            </div>

            <!-- SPAM Score -->
            <div v-if="needsSubject" class="psd-score" :class="`psd-score--${spamScore.level}`">
              <v-icon size="14" :color="spamScore.color">{{ spamScore.icon }}</v-icon>
              <div class="psd-score__main">
                <div class="psd-score__head">
                  <b>Score deliverability:</b> {{ spamScore.text }}
                </div>
                <div v-if="spamScore.tips.length" class="psd-score__tips">
                  <span v-for="(tip, i) in spamScore.tips" :key="i" class="psd-score__tip">
                    · {{ tip }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Extras del email -->
          <section v-if="needsSubject" class="psd-section">
            <div class="psd-section__head">
              <v-icon size="14" color="primary">mdi-tune-variant</v-icon>
              <span>Extras</span>
            </div>
            <div class="psd-extras">
              <v-switch v-model="form.includeSignature" color="primary" density="compact" hide-details
                        :label="form.includeSignature ? 'Mi firma' : 'Sin firma'"
                        :disabled="!hasSignature" />
              <v-switch v-model="form.includeLocation" color="primary" density="compact" hide-details
                        label="Bloque ubicación" />
            </div>
          </section>

        </div>

        <!-- ════════════ COL DERECHA — PREVIEW LIVE ════════════ -->
        <div class="psd-col psd-col--preview">
          <div class="psd-preview-tabs">
            <button
              v-for="t in previewTabs" :key="t.value"
              type="button"
              class="psd-preview-tab"
              :class="{ 'psd-preview-tab--active': previewTab === t.value, 'psd-preview-tab--disabled': t.disabled }"
              :disabled="t.disabled"
              @click="!t.disabled && (previewTab = t.value)"
            >
              <v-icon size="14">{{ t.icon }}</v-icon>
              {{ t.label }}
            </button>
            <v-spacer />
            <v-btn size="x-small" variant="text" prepend-icon="mdi-refresh"
                   :loading="previewLoading" @click="refreshPreview">
              Actualizar
            </v-btn>
          </div>

          <!-- ──── EMAIL PREVIEW ──── -->
          <div v-show="previewTab === 'email'" class="psd-preview-area">
            <div v-if="emailHtml" class="psd-iframe-wrap">
              <iframe :srcdoc="emailHtml" class="psd-iframe" />
            </div>
            <div v-else class="psd-preview-empty">
              <v-icon size="48" color="medium-emphasis">mdi-email-outline</v-icon>
              <div class="mt-2">
                <span v-if="!form.body">Escribí el cuerpo del mensaje para ver el preview.</span>
                <span v-else>Cargando preview…</span>
              </div>
            </div>
          </div>

          <!-- ──── WHATSAPP PREVIEW (mockup burbuja) ──── -->
          <div v-show="previewTab === 'whatsapp'" class="psd-preview-area psd-wa-bg">
            <div class="psd-wa-phone">
              <div class="psd-wa-header">
                <v-avatar size="32" color="white" class="me-2">
                  <span class="psd-wa-avatar">{{ initialsOf({ display_name: brandingName }) }}</span>
                </v-avatar>
                <div>
                  <div class="psd-wa-header__name">{{ brandingName || "Tu negocio" }}</div>
                  <div class="psd-wa-header__status">en línea</div>
                </div>
              </div>
              <div class="psd-wa-chat">
                <div v-if="waMessage" class="psd-wa-bubble" v-html="waFormatted" />
                <div v-else class="psd-wa-bubble psd-wa-bubble--placeholder">
                  Escribí el mensaje para ver el preview…
                </div>
                <div v-if="waMessage" class="psd-wa-time">
                  {{ nowTime }} ✓✓
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Resultado / errores -->
      <div v-if="errorMsg || result" class="psd-bottom-alerts">
        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="result" :type="result.failed > 0 ? 'warning' : 'success'"
                 variant="tonal" density="compact">
          <div>
            <b>Email:</b> ✓ {{ result.email_ok }} · ✗ {{ result.email_failed }}
            <span v-if="result.email_skipped">· {{ result.email_skipped }} sin email</span>
          </div>
          <div v-if="result.wa_total">
            <b>WhatsApp:</b> ✓ {{ result.wa_ok }} · ✗ {{ result.wa_failed }}
            <span v-if="result.wa_links">· {{ result.wa_links }} links wa.me generados</span>
          </div>
        </v-alert>
      </div>

      <!-- ACTIONS -->
      <div class="psd-actions">
        <v-btn variant="text" :disabled="busy" @click="$emit('close')">Cancelar</v-btn>
        <v-spacer />
        <span v-if="!form.targets.length" class="psd-actions__hint">
          ↑ Agregá al menos 1 destinatario
        </span>
        <v-btn color="primary" variant="flat" rounded="lg" prepend-icon="mdi-send"
               :loading="busy" :disabled="!canSend" @click="onSend">
          {{ sendButtonLabel }}
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
  sendMessageBulk,
  previewEmailLayout,
  previewWhatsAppMessage,
} from "../services/messaging.service";
import { listCustomers } from "../services/customers.service";
import { getMySignature } from "../services/mySignature.api";

const props = defineProps({
  open: { type: Boolean, default: false },
  promoBlocks: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "sent"]);

const MAX_TARGETS = 10;

// State
const customerSearch = ref("");
const searchResults = ref([]);
const searchLoading = ref(false);
const templates = ref([]);
const variables = ref([]);
const messagingStatus = ref({ email: { configured: false }, whatsapp: { cloud_api_configured: false } });
const selectedTemplateId = ref(null);
const mySignature = ref(null);
const busy = ref(false);
const errorMsg = ref("");
const result = ref(null);

// Preview state
const previewTab = ref("email");
const previewLoading = ref(false);
const emailHtml = ref("");
const waMessage = ref("");
const brandingName = ref("");

const form = reactive({
  channel: "email",
  targets: [],
  subject: "",
  body: "",
  includeSignature: true,
  includeLocation: true,
});
const activePromos = ref([]);
const promoIds = computed(() => activePromos.value.map((p) => p.id));

// Computed
const canEmail = computed(() => messagingStatus.value?.email?.configured === true);
const atCap = computed(() => form.targets.length >= MAX_TARGETS);
const needsSubject = computed(() => form.channel === "email" || form.channel === "both");
const hasSignature = computed(() => {
  const s = mySignature.value;
  return !!(s && (s.display_name || s.role_title || s.email || s.phone || s.whatsapp || s.photo_url));
});

const channelOptions = computed(() => [
  { value: "email", label: "Email", icon: "mdi-email-outline", color: "primary", disabled: !canEmail.value },
  { value: "whatsapp", label: "WhatsApp", icon: "mdi-whatsapp", color: "success", disabled: false },
  { value: "both", label: "Email + WA", icon: "mdi-flash", color: "warning", disabled: !canEmail.value },
]);

const previewTabs = computed(() => [
  { value: "email", label: "Email", icon: "mdi-email-outline", disabled: form.channel === "whatsapp" },
  { value: "whatsapp", label: "WhatsApp", icon: "mdi-whatsapp", disabled: form.channel === "email" },
]);

const templateOptions = computed(() =>
  templates.value
    .filter((t) => {
      if (form.channel === "email") return t.channel === "email" || t.channel === "both";
      if (form.channel === "whatsapp") return t.channel === "whatsapp" || t.channel === "both";
      return t.channel === "both";
    })
    .map((t) => ({ title: t.name + (t.category ? ` · ${t.category}` : ""), value: t.id, raw: t }))
);

const sendButtonLabel = computed(() => {
  if (!form.targets.length) return "Enviar";
  const tgt = form.targets.length;
  if (form.channel === "email") return `Enviar a ${tgt} por email`;
  if (form.channel === "whatsapp") return `Enviar a ${tgt} por WhatsApp`;
  return `Enviar a ${tgt} (Email + WA)`;
});

const canSend = computed(() => {
  if (busy.value) return false;
  if (!form.targets.length) return false;
  if (!form.body?.trim()) return false;
  if (needsSubject.value && !form.subject?.trim()) return false;
  if (form.channel === "email" || form.channel === "both") {
    if (form.targets.some((t) => !t.email)) return false;
  }
  if (form.channel === "whatsapp" || form.channel === "both") {
    if (form.targets.some((t) => !t.phone)) return false;
  }
  return true;
});

// SPAM Score — análisis simple del asunto + body buscando patrones que
// disparan filtros antispam comunes.
const SPAM_PATTERNS = [
  { re: /\b(GRATIS|FREE|GANATE|GANASTE|REGALO)\b/i, weight: 2, tip: "Evitá palabras como 'GRATIS' o 'GANATE' en el asunto" },
  { re: /\b(URGENTE|ULTIMA OPORTUNIDAD|YA MISMO|HOY MISMO|AHORA O NUNCA)\b/i, weight: 2, tip: "Frases urgentes inflan el spam score" },
  { re: /\b(\d{1,3})% DE DESCUENTO\b/i, weight: 1, tip: "Un % grande en el asunto suele disparar filtros (poné el % adentro del cuerpo)" },
  { re: /\$\$\$|€€€/, weight: 3, tip: "Múltiples símbolos de dinero parecen spam" },
  { re: /!{3,}/, weight: 2, tip: "Más de 2 signos de exclamación seguidos hace que parezca spam" },
  { re: /[A-ZÁÉÍÓÚ]{6,}/, weight: 1, tip: "Mayúsculas largas en el asunto bajan deliverability" },
  { re: /\b(viagra|casino|loterias|ricos|millonario)\b/i, weight: 5, tip: "Palabras críticas — el filtro lo bloquea seguro" },
];

const spamScore = computed(() => {
  const subject = String(form.subject || "");
  const body = String(form.body || "");
  const fullText = `${subject} ${body}`;
  let score = 0;
  const tips = new Set();
  for (const p of SPAM_PATTERNS) {
    if (p.re.test(fullText)) {
      score += p.weight;
      tips.add(p.tip);
    }
  }
  if (subject.length > 70) {
    score += 1;
    tips.add("Asunto muy largo (>70 chars). Acortalo a ~50.");
  }
  if (subject && subject === subject.toUpperCase() && subject.length > 8) {
    score += 2;
    tips.add("Asunto TODO EN MAYÚSCULAS = SPAM seguro");
  }

  let level, text, color, icon;
  if (score === 0) {
    level = "ok"; text = "Excelente — bajo riesgo de SPAM"; color = "success"; icon = "mdi-shield-check";
  } else if (score <= 2) {
    level = "ok"; text = "Bueno — riesgo bajo"; color = "success"; icon = "mdi-shield-check";
  } else if (score <= 5) {
    level = "warn"; text = "Atención — riesgo medio"; color = "warning"; icon = "mdi-alert";
  } else {
    level = "err"; text = "Riesgoso — probable SPAM"; color = "error"; icon = "mdi-alert-octagon";
  }
  return { level, text, color, icon, tips: Array.from(tips) };
});

// Hora actual para el mockup de WhatsApp (formato HH:mm).
const nowTime = computed(() => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
});

// El mensaje WA crudo lo formateamos para HTML interpretando el markdown
// WhatsApp: *bold* _italic_ ~strike~ y links. Es solo para la preview.
const waFormatted = computed(() => {
  let txt = String(waMessage.value || "");
  // Escapamos HTML primero
  txt = txt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Markdown WhatsApp
  txt = txt.replace(/\*([^*\n]+)\*/g, "<b>$1</b>");
  txt = txt.replace(/_([^_\n]+)_/g, "<i>$1</i>");
  txt = txt.replace(/~([^~\n]+)~/g, "<s>$1</s>");
  // Links como anchors
  txt = txt.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  // Saltos de línea
  txt = txt.replace(/\n/g, "<br/>");
  return txt;
});

// ── Watch para preview live (debounced) ──
let _previewTimer = null;
function schedulePreview() {
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(refreshPreview, 450);
}

watch(() => form.subject, schedulePreview);
watch(() => form.body, schedulePreview);
watch(() => form.includeSignature, schedulePreview);
watch(() => form.includeLocation, schedulePreview);
watch(() => promoIds.value.join(","), schedulePreview);
watch(() => form.channel, () => {
  // Cambiar canal y forzar la tab del preview correspondiente.
  if (form.channel === "whatsapp") previewTab.value = "whatsapp";
  if (form.channel === "email") previewTab.value = "email";
  schedulePreview();
});

async function refreshPreview() {
  if (!form.body?.trim()) {
    emailHtml.value = "";
    waMessage.value = "";
    return;
  }
  previewLoading.value = true;
  try {
    const promises = [];

    if (form.channel === "email" || form.channel === "both") {
      promises.push(
        previewEmailLayout({
          subject: form.subject || "Vista previa",
          body: form.body,
          include_signature: form.includeSignature,
          include_location: form.includeLocation,
          promo_block_ids: promoIds.value,
        }).then((r) => { emailHtml.value = r.data?.data?.html || ""; })
      );
    } else {
      emailHtml.value = "";
    }

    if (form.channel === "whatsapp" || form.channel === "both") {
      promises.push(
        previewWhatsAppMessage({
          body: form.body,
          include_signature: form.includeSignature,
          include_location: form.includeLocation,
          promo_block_ids: promoIds.value,
          customer_id: form.targets[0]?.id || 0,
        }).then((r) => { waMessage.value = r.data?.data?.message || ""; })
      );
    } else {
      waMessage.value = "";
    }

    await Promise.all(promises);
  } catch (e) {
    // silencioso — el preview no debe trabar el envío
  } finally {
    previewLoading.value = false;
  }
}

// ── Watchers de open ──
watch(() => props.open, (o) => {
  if (o) {
    activePromos.value = [...props.promoBlocks];
    form.channel = "email";
    form.targets = [];
    form.subject = "";
    form.body = "";
    selectedTemplateId.value = null;
    customerSearch.value = "";
    searchResults.value = [];
    emailHtml.value = "";
    waMessage.value = "";
    errorMsg.value = "";
    result.value = null;
    previewTab.value = "email";
    init();
  }
});

async function init() {
  try {
    const [statusRes, varsRes, tplRes, sigRes] = await Promise.all([
      getMessagingStatus(),
      listMessageVariables(),
      listMessageTemplates(""),
      getMySignature().catch(() => null),
    ]);
    messagingStatus.value = statusRes?.data?.data || messagingStatus.value;
    variables.value = varsRes?.data?.data || [];
    templates.value = tplRes?.data?.data || [];
    mySignature.value = sigRes || null;

    if (mySignature.value && mySignature.value.include_by_default === false) {
      form.includeSignature = false;
    } else if (!hasSignature.value) {
      form.includeSignature = false;
    }

    if (!canEmail.value) {
      form.channel = "whatsapp";
      previewTab.value = "whatsapp";
    }

    // Branding name desde primer promo si trae product
    brandingName.value = ""; // placeholder — el iframe del email lo trae completo

    onSearch();
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "Error al inicializar.";
  }
}

let _searchTimer = null;
function onSearch() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(doSearch, 250);
}
async function doSearch() {
  searchLoading.value = true;
  try {
    const { data } = await listCustomers({
      q: customerSearch.value || "",
      limit: 12, page: 1,
    });
    searchResults.value = data?.data || [];
  } catch (e) {
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
}

function isTarget(id) { return form.targets.some((t) => t.id === id); }

function canAdd(c) {
  if (form.channel === "email") {
    if (!c.email) return { ok: false, reason: "Sin email" };
  }
  if (form.channel === "whatsapp") {
    if (!c.phone) return { ok: false, reason: "Sin tel" };
  }
  if (form.channel === "both") {
    if (!c.email) return { ok: false, reason: "Sin email" };
    if (!c.phone) return { ok: false, reason: "Sin tel" };
  }
  return { ok: true };
}

function addTarget(c) {
  if (atCap.value || isTarget(c.id) || !canAdd(c).ok) return;
  form.targets.push({
    id: c.id,
    display_name: c.display_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || `Cliente #${c.id}`,
    email: c.email || "",
    phone: c.phone || "",
  });
  schedulePreview();
}
function removeTarget(id) {
  form.targets = form.targets.filter((t) => t.id !== id);
  schedulePreview();
}
function removePromo(id) {
  activePromos.value = activePromos.value.filter((p) => p.id !== id);
}

function initialsOf(c) {
  const src = c?.display_name || `${c?.first_name || ""} ${c?.last_name || ""}`;
  const parts = String(src).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function onTemplateChange(id) {
  if (!id) return;
  const t = templates.value.find((x) => x.id === id);
  if (!t) return;
  form.subject = t.subject || form.subject;
  form.body = t.body || form.body;
}

function insertVariable(key) { form.body = (form.body || "") + `{{${key}}}`; }
function varTag(key) { return "{{" + key + "}}"; }

async function onSend() {
  busy.value = true;
  errorMsg.value = "";
  result.value = null;
  try {
    const customer_ids = form.targets.map((t) => t.id);
    const summary = {
      email_ok: 0, email_failed: 0, email_skipped: 0,
      wa_ok: 0, wa_failed: 0, wa_skipped: 0, wa_links: 0,
      wa_total: 0, failed: 0,
    };

    if (form.channel === "email" || form.channel === "both") {
      const { data } = await sendMessageBulk({
        customer_ids,
        channel: "email",
        subject: form.subject,
        body: form.body,
        include_signature: form.includeSignature,
        include_location: form.includeLocation,
        promo_block_ids: promoIds.value,
      });
      summary.email_ok = data?.summary?.ok || 0;
      summary.email_failed = data?.summary?.failed || 0;
      summary.email_skipped = data?.summary?.skipped || 0;
      summary.failed += summary.email_failed;
    }

    if (form.channel === "whatsapp" || form.channel === "both") {
      const { data } = await sendMessageBulk({
        customer_ids,
        channel: "whatsapp",
        body: form.body,
        include_signature: form.includeSignature,
        include_location: form.includeLocation,
        promo_block_ids: promoIds.value,
        prefer_link: !messagingStatus.value?.whatsapp?.cloud_api_configured,
      });
      summary.wa_total = data?.summary?.total || customer_ids.length;
      summary.wa_ok = data?.summary?.ok || 0;
      summary.wa_failed = data?.summary?.failed || 0;
      summary.wa_links = data?.summary?.manual_links || 0;
      summary.failed += summary.wa_failed;
    }

    result.value = summary;
    emit("sent", { summary });
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "Error al enviar.";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.psd { display: flex; flex-direction: column; max-height: 92vh; }
.psd-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.psd-eyebrow {
  font-size: 10.5px; font-weight: 800; opacity: 0.55;
  margin: 0; letter-spacing: 0.08em; text-transform: uppercase;
}
.psd-title { font-size: 18px; font-weight: 800; margin: 2px 0 0; line-height: 1.1; }

/* ════════ GRID 2 columnas ════════ */
.psd-grid {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(440px, 1.2fr);
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
@media (max-width: 960px) {
  .psd-grid { grid-template-columns: 1fr; }
}
.psd-col {
  overflow-y: auto;
  padding: 14px 18px;
  display: flex; flex-direction: column; gap: 14px;
}
.psd-col--config {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.psd-col--preview {
  background: rgba(var(--v-theme-on-surface), 0.02);
  padding: 12px 14px;
}

.psd-section { display: flex; flex-direction: column; gap: 8px; }
.psd-section__head {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
  opacity: 0.65;
}
.psd-counter {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0; text-transform: none;
  font-size: 11px; font-weight: 700;
  margin-left: 4px;
  padding: 1px 6px; border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.psd-counter--cap {
  background: rgba(var(--v-theme-warning), 0.18);
  color: rgb(var(--v-theme-warning));
}
.psd-mini-clear {
  background: transparent; border: none; cursor: pointer;
  font-size: 10px; font-weight: 700;
  color: rgb(var(--v-theme-primary));
  padding: 2px 6px; border-radius: 5px;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.psd-empty {
  font-size: 12px; opacity: 0.55; padding: 10px;
  text-align: center;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
}

/* Promo chips */
.psd-promos { display: flex; flex-direction: column; gap: 4px; }
.psd-promo-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}
.psd-promo-chip__main { flex-grow: 1; min-width: 0; }
.psd-promo-chip__title {
  font-size: 12px; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.psd-promo-chip__price { font-size: 10.5px; font-weight: 700; opacity: 0.65; }

/* Channels */
.psd-channels { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
.psd-channel {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 6px;
  border-radius: 9px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: all 0.12s;
  font-family: inherit;
}
.psd-channel:hover:not(.psd-channel--disabled) {
  background: rgba(var(--v-theme-primary), 0.04);
}
.psd-channel--active {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.1);
}
.psd-channel--disabled { opacity: 0.4; cursor: not-allowed; }
.psd-channel__label { font-size: 11.5px; font-weight: 800; }

/* Search */
.psd-search-results {
  display: flex; flex-direction: column; gap: 1px;
  max-height: 200px; overflow-y: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  padding: 3px;
}
.psd-search-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: none; background: transparent;
  cursor: pointer; text-align: left;
  font: inherit;
  transition: background 0.1s;
}
.psd-search-row:hover:not(:disabled) { background: rgba(var(--v-theme-primary), 0.06); }
.psd-search-row:disabled { cursor: default; opacity: 0.55; }
.psd-search-row__avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.18);
  color: rgb(var(--v-theme-primary));
  display: grid; place-items: center;
  font-size: 10px; font-weight: 800;
  flex-shrink: 0;
}
.psd-search-row__info { flex-grow: 1; min-width: 0; }
.psd-search-row__name {
  font-size: 12px; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.psd-search-row__contact {
  font-size: 10.5px; opacity: 0.6;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.psd-dim { opacity: 0.5; font-style: italic; }
.psd-tag {
  font-size: 10px; font-weight: 800;
  padding: 2px 6px; border-radius: 999px;
  flex-shrink: 0;
}
.psd-tag--ok { background: rgba(var(--v-theme-success), 0.18); color: rgb(var(--v-theme-success)); }
.psd-tag--add { background: rgba(var(--v-theme-primary), 0.14); color: rgb(var(--v-theme-primary)); }
.psd-tag--err { background: rgba(var(--v-theme-error), 0.14); color: rgb(var(--v-theme-error)); }

/* Targets */
.psd-targets {
  display: flex; flex-direction: column; gap: 3px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px;
  padding: 5px;
}
.psd-target {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
}
.psd-target__avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgb(var(--v-theme-primary)); color: #fff;
  display: grid; place-items: center;
  font-size: 9.5px; font-weight: 800;
  flex-shrink: 0;
}
.psd-target__main { flex-grow: 1; min-width: 0; }
.psd-target__name {
  font-size: 11.5px; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.psd-target__contact {
  font-size: 10px; opacity: 0.6;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Vars */
.psd-vars { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
.psd-var {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9.5px; font-weight: 700;
  padding: 2px 5px; border-radius: 5px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}
.psd-var:hover { background: rgba(var(--v-theme-primary), 0.14); }

/* SPAM Score */
.psd-score {
  display: flex; gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  border: 1px solid;
  margin-top: 4px;
}
.psd-score--ok {
  background: rgba(var(--v-theme-success), 0.06);
  border-color: rgba(var(--v-theme-success), 0.3);
}
.psd-score--warn {
  background: rgba(var(--v-theme-warning), 0.06);
  border-color: rgba(var(--v-theme-warning), 0.3);
}
.psd-score--err {
  background: rgba(var(--v-theme-error), 0.06);
  border-color: rgba(var(--v-theme-error), 0.3);
}
.psd-score__main { flex-grow: 1; min-width: 0; }
.psd-score__head { line-height: 1.4; }
.psd-score__tips {
  display: flex; flex-direction: column; gap: 2px;
  margin-top: 4px;
  font-size: 10.5px;
  opacity: 0.85;
}

/* Extras */
.psd-extras { display: flex; gap: 14px; flex-wrap: wrap; }

/* ════════ Preview ════════ */
.psd-preview-tabs {
  display: flex; align-items: center; gap: 4px;
  padding: 4px;
  background: rgb(var(--v-theme-surface));
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-bottom: 8px;
}
.psd-preview-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  border: none; background: transparent;
  border-radius: 7px;
  font-size: 12px; font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.65);
  cursor: pointer;
}
.psd-preview-tab:hover:not(:disabled) { background: rgba(var(--v-theme-on-surface), 0.05); }
.psd-preview-tab--active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
.psd-preview-tab--disabled { opacity: 0.4; cursor: not-allowed; }

.psd-preview-area { flex: 1; min-height: 540px; }
.psd-preview-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; min-height: 540px;
  font-size: 13px; opacity: 0.55;
}
.psd-iframe-wrap {
  border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: #f4f6fa;
  height: 100%;
}
.psd-iframe {
  width: 100%; height: 100%; min-height: 580px;
  border: 0; display: block;
}

/* ════════ WhatsApp mockup ════════ */
.psd-wa-bg {
  background: #efe7dd;
  background-image:
    radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px);
  background-size: 12px 12px;
  border-radius: 12px;
  overflow: hidden;
  display: flex; flex-direction: column;
}
.psd-wa-phone {
  display: flex; flex-direction: column;
  height: 100%; min-height: 540px;
}
.psd-wa-header {
  display: flex; align-items: center;
  background: #075e54;
  color: #fff;
  padding: 12px 16px;
}
.psd-wa-avatar {
  font-size: 11px; font-weight: 800;
  color: #075e54;
}
.psd-wa-header__name { font-size: 14px; font-weight: 700; }
.psd-wa-header__status { font-size: 11px; opacity: 0.85; }
.psd-wa-chat {
  flex: 1;
  padding: 14px 12px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px;
}
.psd-wa-bubble {
  align-self: flex-end;
  max-width: 88%;
  background: #dcf8c6;
  border-radius: 8px 8px 0 8px;
  padding: 8px 11px;
  font-size: 13.5px;
  line-height: 1.5;
  color: #111;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
}
.psd-wa-bubble--placeholder {
  color: #777;
  font-style: italic;
  background: rgba(255, 255, 255, 0.7);
}
.psd-wa-bubble :deep(a) { color: #039be5; word-break: break-all; }
.psd-wa-bubble :deep(b) { font-weight: 700; }
.psd-wa-bubble :deep(s) { color: #888; }
.psd-wa-time {
  align-self: flex-end;
  font-size: 10.5px; color: #075e54;
  opacity: 0.65;
  margin-top: -2px;
  padding-right: 4px;
}

/* ════════ Bottom alerts + actions ════════ */
.psd-bottom-alerts {
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px 18px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.psd-actions {
  display: flex; gap: 8px; align-items: center;
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  flex-shrink: 0;
}
.psd-actions__hint {
  font-size: 11px; opacity: 0.55; font-style: italic;
  margin-right: 8px;
}
</style>
