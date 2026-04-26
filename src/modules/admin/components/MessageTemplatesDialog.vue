<template>
  <v-dialog :model-value="open" @update:model-value="(v) => !v && $emit('close')" max-width="780" persistent>
    <v-card rounded="xl" class="mtd">
      <div class="mtd-head">
        <v-icon size="22" color="primary">mdi-text-box-multiple-outline</v-icon>
        <div>
          <p class="mtd-eyebrow">CRM</p>
          <h3 class="mtd-title">Plantillas de mensajes</h3>
        </div>
        <v-spacer />
        <v-btn variant="flat" color="primary" size="small" rounded="lg" prepend-icon="mdi-plus" @click="openNew">Nueva</v-btn>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
      </div>

      <div class="mtd-body">
        <!-- Lista -->
        <div v-if="!editing" class="mtd-list">
          <div v-if="!templates.length" class="mtd-empty">
            <v-icon size="36" color="medium-emphasis">mdi-text-box-outline</v-icon>
            <div>No hay plantillas todavía. Creá una nueva para empezar.</div>
          </div>
          <div
            v-for="t in templates"
            :key="t.id"
            class="mtd-item"
            @click="openEdit(t)"
          >
            <div class="mtd-item__icon">
              <v-icon size="16" :color="t.channel === 'email' ? 'primary' : 'success'">
                {{ t.channel === 'email' ? 'mdi-email-outline' : (t.channel === 'whatsapp' ? 'mdi-whatsapp' : 'mdi-share-variant-outline') }}
              </v-icon>
            </div>
            <div class="mtd-item__main">
              <div class="mtd-item__name">
                {{ t.name }}
                <span v-if="t.category" class="mtd-item__cat">· {{ t.category }}</span>
              </div>
              <div class="mtd-item__desc">{{ t.description || (t.subject ? '🏷 ' + t.subject : '') }}</div>
            </div>
            <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click.stop="openEdit(t)" />
            <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click.stop="confirmDelete(t)" />
          </div>
        </div>

        <!-- Editor -->
        <div v-else class="mtd-edit">
          <div class="mtd-row mtd-row--2">
            <v-text-field v-model="form.name" label="Nombre" variant="outlined" density="compact" hide-details />
            <v-select
              v-model="form.channel"
              :items="channelOptions"
              label="Canal"
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>
          <div class="mtd-row mtd-row--2">
            <v-text-field v-model="form.category" label="Categoría (libre)" placeholder="promo, bienvenida..." variant="outlined" density="compact" hide-details />
            <v-switch
              v-model="form.is_active"
              color="success"
              density="compact"
              hide-details
              :label="form.is_active ? 'Activa' : 'Inactiva'"
            />
          </div>
          <v-text-field
            v-model="form.description"
            label="Descripción (opcional)"
            placeholder="Para qué sirve esta plantilla..."
            variant="outlined"
            density="compact"
            hide-details
          />
          <v-text-field
            v-if="form.channel === 'email' || form.channel === 'both'"
            v-model="form.subject"
            label="Asunto del email"
            variant="outlined"
            density="compact"
            hide-details
          />
          <div class="mtd-vars">
            <span class="mtd-vars__lbl">Variables:</span>
            <button
              v-for="v in variables"
              :key="v.key"
              type="button"
              class="mtd-var"
              :title="v.label"
              @click="insertVar(v.key)"
            >{{ varTag(v.key) }}</button>
          </div>
          <v-textarea
            v-model="form.body"
            label="Mensaje"
            placeholder="Hola {{first_name}}, gracias por tu compra..."
            variant="outlined"
            density="compact"
            hide-details
            rows="8"
            auto-grow
          />
        </div>

        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mt-3">
          {{ errorMsg }}
        </v-alert>
      </div>

      <div class="mtd-actions">
        <v-btn v-if="editing" variant="text" :disabled="busy" @click="back">← Volver al listado</v-btn>
        <v-spacer />
        <v-btn v-if="editing" color="primary" variant="flat" :loading="busy" prepend-icon="mdi-content-save" @click="onSave">
          {{ editingId ? 'Guardar cambios' : 'Crear plantilla' }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import {
  listMessageTemplates,
  listMessageVariables,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
} from "../services/messaging.service";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close", "changed"]);

const channelOptions = [
  { title: "Email", value: "email" },
  { title: "WhatsApp", value: "whatsapp" },
  { title: "Email + WhatsApp", value: "both" },
];

const templates = ref([]);
const variables = ref([]);
const editing = ref(false);
const editingId = ref(null);
const form = reactive(emptyForm());
const busy = ref(false);
const errorMsg = ref("");

function emptyForm() {
  return {
    name: "",
    channel: "email",
    category: "",
    description: "",
    subject: "",
    body: "",
    is_active: true,
  };
}

watch(() => props.open, (o) => { if (o) init(); });

async function init() {
  errorMsg.value = "";
  editing.value = false;
  editingId.value = null;
  Object.assign(form, emptyForm());
  try {
    const [tpl, vars] = await Promise.all([listMessageTemplates(""), listMessageVariables()]);
    templates.value = tpl?.data?.data || [];
    variables.value = vars?.data?.data || [];
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo cargar";
  }
}

function openNew() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  editing.value = true;
}

function openEdit(t) {
  Object.assign(form, emptyForm(), {
    name: t.name || "",
    channel: t.channel || "email",
    category: t.category || "",
    description: t.description || "",
    subject: t.subject || "",
    body: t.body || "",
    is_active: t.is_active !== false,
  });
  editingId.value = t.id;
  editing.value = true;
}

function back() {
  editing.value = false;
  editingId.value = null;
  errorMsg.value = "";
}

function insertVar(key) {
  form.body = (form.body || "") + `{{${key}}}`;
}

// Helper para mostrar el tag con doble llave en el template sin que Vue lo
// interprete como interpolación.
function varTag(key) {
  return "{{" + key + "}}";
}

async function onSave() {
  busy.value = true;
  errorMsg.value = "";
  try {
    if (editingId.value) {
      await updateMessageTemplate(editingId.value, form);
    } else {
      await createMessageTemplate(form);
    }
    emit("changed");
    back();
    await init();
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo guardar";
  } finally {
    busy.value = false;
  }
}

async function confirmDelete(t) {
  if (!window.confirm(`¿Eliminar la plantilla "${t.name}"?`)) return;
  try {
    await deleteMessageTemplate(t.id);
    emit("changed");
    await init();
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || "No se pudo eliminar";
  }
}
</script>

<style scoped>
.mtd-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.mtd-eyebrow { font-size: 11px; font-weight: 700; opacity: 0.65; margin: 0; letter-spacing: 0.04em; text-transform: uppercase; }
.mtd-title { font-size: 17px; font-weight: 800; margin: 2px 0 0; line-height: 1.1; }

.mtd-body {
  padding: 16px 18px;
  max-height: 65vh;
  overflow-y: auto;
}

.mtd-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 40px 16px;
  text-align: center;
  opacity: 0.65;
}
.mtd-list { display: flex; flex-direction: column; gap: 6px; }
.mtd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: background 0.1s;
}
.mtd-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.mtd-item__icon {
  width: 32px; height: 32px;
  display: grid; place-items: center;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  flex-shrink: 0;
}
.mtd-item__main { flex: 1; min-width: 0; }
.mtd-item__name { font-size: 13px; font-weight: 700; }
.mtd-item__cat { opacity: 0.6; font-weight: 500; }
.mtd-item__desc { font-size: 11.5px; opacity: 0.65; margin-top: 1px; }

.mtd-edit { display: flex; flex-direction: column; gap: 12px; }
.mtd-row--2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.mtd-vars { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mtd-vars__lbl { font-size: 10.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.65; }
.mtd-var {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px; font-weight: 700;
  padding: 3px 7px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}
.mtd-var:hover { background: rgba(var(--v-theme-primary), 0.14); }

.mtd-actions {
  display: flex; gap: 8px;
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

@media (max-width: 720px) {
  .mtd-row--2 { grid-template-columns: 1fr; }
}
</style>
