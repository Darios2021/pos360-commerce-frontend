<!--
  ShopQAView — Gestión admin de Consultas web del shop.
  Tabs: Consultas (preguntas) / Opiniones (reviews).

  Endpoints:
    GET    /api/v1/admin/shop/questions      ?status=pending|answered|hidden|all &q= &page=
    POST   /api/v1/admin/shop/questions/:id/answer  { answer }
    PATCH  /api/v1/admin/shop/questions/:id  { is_public }
    DELETE /api/v1/admin/shop/questions/:id

    GET    /api/v1/admin/shop/reviews        ?visibility=visible|hidden|all &rating= &q= &page=
    PATCH  /api/v1/admin/shop/reviews/:id    { is_visible }
    DELETE /api/v1/admin/shop/reviews/:id

    GET    /api/v1/admin/shop/qa/summary
-->
<template>
  <div class="qa-admin">
    <AppPageHeader icon="mdi-message-question-outline" title="Consultas web">
      <template #subtitle>
        Preguntas y opiniones de los clientes en la tienda
      </template>
      <v-btn variant="tonal" size="small" rounded="lg" prepend-icon="mdi-refresh" @click="reload">
        Actualizar
      </v-btn>
    </AppPageHeader>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="qa-tabs" align-tabs="start">
      <v-tab value="questions">
        Consultas
        <v-badge
          v-if="summary.questions_pending > 0"
          :content="summary.questions_pending"
          color="error"
          inline
          class="ml-2"
        />
      </v-tab>
      <v-tab value="reviews">
        Opiniones
        <v-badge
          v-if="summary.reviews_hidden > 0"
          :content="summary.reviews_hidden"
          color="warning"
          inline
          class="ml-2"
        />
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- ════════ Consultas ════════ -->
      <v-window-item value="questions">
        <v-card class="qa-card mt-4" rounded="xl" variant="outlined">
          <div class="qa-toolbar">
            <v-text-field
              v-model="qSearch"
              placeholder="Buscar por producto, cliente o texto…"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="qa-search"
              @keyup.enter="loadQuestions(1)"
              @click:clear="loadQuestions(1)"
            />
            <v-select
              v-model="qStatus"
              :items="qStatusItems"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              class="qa-filter"
              @update:modelValue="loadQuestions(1)"
            />
          </div>

          <v-divider />

          <v-data-table-server
            :headers="qHeaders"
            :items="questions"
            :items-length="qTotal"
            :loading="qLoading"
            :page="qPage"
            :items-per-page="qLimit"
            @update:page="(p) => loadQuestions(p)"
            class="qa-table"
            no-data-text="Sin consultas"
          >
            <template #item.product="{ item }">
              <div class="qa-prod">
                <div class="qa-prod__name">{{ item.product_name || `#${item.product_id}` }}</div>
                <router-link
                  :to="{ name: 'shopProduct', params: { id: String(item.product_id) } }"
                  target="_blank"
                  class="qa-prod__link"
                >
                  Ver en tienda ↗
                </router-link>
              </div>
            </template>

            <template #item.customer="{ item }">
              <div class="qa-cust">
                <div class="qa-cust__name">{{ item.customer_name || "—" }}</div>
                <div class="qa-cust__email">{{ item.customer_email || "" }}</div>
              </div>
            </template>

            <template #item.text="{ item }">
              <div class="qa-text">
                <div class="qa-text__q">{{ item.text }}</div>
                <div v-if="item.answer" class="qa-text__a">
                  <v-icon size="13" color="primary">mdi-arrow-bottom-right</v-icon>
                  {{ item.answer }}
                  <span v-if="item.answered_by_name" class="qa-text__by">
                    — {{ item.answered_by_name }}
                  </span>
                </div>
              </div>
            </template>

            <template #item.status="{ item }">
              <v-chip
                v-if="!item.is_public"
                size="x-small"
                color="grey"
                variant="flat"
              >Oculta</v-chip>
              <v-chip
                v-else-if="!item.answer"
                size="x-small"
                color="warning"
                variant="flat"
              >Pendiente</v-chip>
              <v-chip
                v-else
                size="x-small"
                color="success"
                variant="flat"
              >Respondida</v-chip>
            </template>

            <template #item.created_at="{ item }">
              <span class="qa-date">{{ fmtDate(item.created_at) }}</span>
            </template>

            <template #item.actions="{ item }">
              <div class="qa-actions">
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  rounded="lg"
                  @click="openAnswerDialog(item)"
                >
                  {{ item.answer ? "Editar respuesta" : "Responder" }}
                </v-btn>
                <v-menu location="bottom end">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="small" variant="text" icon>
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact" min-width="180">
                    <v-list-item @click="togglePublic(item)">
                      <template #prepend>
                        <v-icon size="18">{{ item.is_public ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                      </template>
                      <v-list-item-title>{{ item.is_public ? "Ocultar" : "Mostrar" }}</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="confirmDeleteQuestion(item)">
                      <template #prepend><v-icon size="18" color="error">mdi-delete-outline</v-icon></template>
                      <v-list-item-title class="text-error">Eliminar</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-data-table-server>
        </v-card>
      </v-window-item>

      <!-- ════════ Opiniones ════════ -->
      <v-window-item value="reviews">
        <v-card class="qa-card mt-4" rounded="xl" variant="outlined">
          <div class="qa-toolbar">
            <v-text-field
              v-model="rSearch"
              placeholder="Buscar por producto, cliente o comentario…"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="qa-search"
              @keyup.enter="loadReviews(1)"
              @click:clear="loadReviews(1)"
            />
            <v-select
              v-model="rVisibility"
              :items="rVisibilityItems"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              class="qa-filter"
              @update:modelValue="loadReviews(1)"
            />
            <v-select
              v-model="rRating"
              :items="rRatingItems"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              class="qa-filter"
              @update:modelValue="loadReviews(1)"
            />
          </div>

          <v-divider />

          <v-data-table-server
            :headers="rHeaders"
            :items="reviews"
            :items-length="rTotal"
            :loading="rLoading"
            :page="rPage"
            :items-per-page="rLimit"
            @update:page="(p) => loadReviews(p)"
            class="qa-table"
            no-data-text="Sin opiniones"
          >
            <template #item.product="{ item }">
              <div class="qa-prod">
                <div class="qa-prod__name">{{ item.product_name || `#${item.product_id}` }}</div>
              </div>
            </template>

            <template #item.customer="{ item }">
              <div class="qa-cust">
                <div class="qa-cust__name">{{ item.customer_name || "—" }}</div>
                <div class="qa-cust__email">{{ item.customer_email || "" }}</div>
              </div>
            </template>

            <template #item.rating="{ item }">
              <div class="qa-stars">
                <v-icon
                  v-for="i in 5"
                  :key="i"
                  size="14"
                  :color="i <= item.rating ? 'primary' : 'rgba(0,0,0,0.2)'"
                >mdi-star</v-icon>
              </div>
            </template>

            <template #item.comment="{ item }">
              <div class="qa-text__q">{{ item.comment || "—" }}</div>
              <v-chip
                v-if="item.is_verified_purchase"
                size="x-small"
                color="success"
                variant="tonal"
                class="mt-1"
              >Compra verificada</v-chip>
            </template>

            <template #item.status="{ item }">
              <v-chip
                v-if="!item.is_visible"
                size="x-small"
                color="grey"
                variant="flat"
              >Oculta</v-chip>
              <v-chip
                v-else
                size="x-small"
                color="success"
                variant="flat"
              >Visible</v-chip>
            </template>

            <template #item.created_at="{ item }">
              <span class="qa-date">{{ fmtDate(item.created_at) }}</span>
            </template>

            <template #item.actions="{ item }">
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="small" variant="text" icon>
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" min-width="180">
                  <v-list-item @click="toggleVisible(item)">
                    <template #prepend>
                      <v-icon size="18">{{ item.is_visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                    </template>
                    <v-list-item-title>{{ item.is_visible ? "Ocultar" : "Mostrar" }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click="confirmDeleteReview(item)">
                    <template #prepend><v-icon size="18" color="error">mdi-delete-outline</v-icon></template>
                    <v-list-item-title class="text-error">Eliminar</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-data-table-server>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Dialog: Responder pregunta -->
    <v-dialog v-model="answerDialog.open" max-width="560">
      <v-card rounded="xl" class="pa-1">
        <v-card-title class="d-flex align-center ga-2 pt-4 px-4">
          <v-icon color="primary">mdi-reply-outline</v-icon>
          <span class="font-weight-bold">Responder consulta</span>
        </v-card-title>
        <v-card-text class="px-4 pb-2">
          <div class="qa-q-preview">{{ answerDialog.item?.text || "" }}</div>
          <v-textarea
            v-model="answerDialog.text"
            placeholder="Escribí la respuesta…"
            variant="outlined"
            rows="4"
            auto-grow
            :counter="1000"
            :maxlength="1000"
            density="comfortable"
            hide-details="auto"
            class="mt-3"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="answerDialog.open = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="answerDialog.busy"
            :disabled="!answerDialog.text?.trim()"
            @click="submitAnswer"
          >
            Publicar respuesta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm: eliminar -->
    <v-dialog v-model="confirmDialog.open" max-width="420">
      <v-card rounded="xl" class="pa-1">
        <v-card-title class="d-flex align-center ga-2 pt-4 px-4">
          <v-icon color="error">mdi-alert-circle-outline</v-icon>
          <span class="font-weight-bold">{{ confirmDialog.title }}</span>
        </v-card-title>
        <v-card-text class="px-4 pb-2">
          {{ confirmDialog.message }}
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog.open = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            :loading="confirmDialog.busy"
            @click="confirmDialog.onOk"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="2800" :color="snack.color">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import http from "@/app/api/http";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const tab = ref("questions");

/* ── Snack ─────────────────────────────────────────── */
const snack = reactive({ show: false, text: "", color: "primary" });
function toast(text, color = "primary") {
  snack.text = text; snack.color = color; snack.show = true;
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ── Summary (badges sidebar) ──────────────────────── */
const summary = reactive({ questions_pending: 0, reviews_hidden: 0 });

async function loadSummary() {
  try {
    const { data } = await http.get("/admin/shop/qa/summary");
    summary.questions_pending = Number(data?.questions_pending || 0);
    summary.reviews_hidden = Number(data?.reviews_hidden || 0);
  } catch { /* silencioso */ }
}

/* ══════════════════════ QUESTIONS ══════════════════════ */
const qHeaders = [
  { title: "Producto", key: "product", sortable: false, width: 220 },
  { title: "Cliente", key: "customer", sortable: false, width: 200 },
  { title: "Pregunta / Respuesta", key: "text", sortable: false },
  { title: "Estado", key: "status", sortable: false, width: 120 },
  { title: "Fecha", key: "created_at", sortable: false, width: 160 },
  { title: "", key: "actions", sortable: false, width: 200, align: "end" },
];

const qStatus = ref("pending");
const qSearch = ref("");
const qPage = ref(1);
const qLimit = ref(25);
const qTotal = ref(0);
const qLoading = ref(false);
const questions = ref([]);

const qStatusItems = [
  { title: "Pendientes", value: "pending" },
  { title: "Respondidas", value: "answered" },
  { title: "Ocultas", value: "hidden" },
  { title: "Todas", value: "all" },
];

async function loadQuestions(page = 1) {
  qLoading.value = true;
  try {
    const { data } = await http.get("/admin/shop/questions", {
      params: {
        status: qStatus.value,
        q: (qSearch.value || "").trim(),
        page,
        limit: qLimit.value,
      },
    });
    questions.value = Array.isArray(data?.items) ? data.items : [];
    qTotal.value = Number(data?.total || 0);
    qPage.value = Number(data?.page || page);
  } catch (e) {
    toast("No se pudieron cargar las consultas", "error");
  } finally {
    qLoading.value = false;
  }
}

const answerDialog = reactive({ open: false, item: null, text: "", busy: false });

function openAnswerDialog(item) {
  answerDialog.item = item;
  answerDialog.text = item.answer || "";
  answerDialog.open = true;
}

async function submitAnswer() {
  const id = answerDialog.item?.id;
  const answer = (answerDialog.text || "").trim();
  if (!id || !answer) return;
  answerDialog.busy = true;
  try {
    await http.post(`/admin/shop/questions/${id}/answer`, { answer });
    toast("Respuesta publicada", "success");
    answerDialog.open = false;
    await Promise.all([loadQuestions(qPage.value), loadSummary()]);
  } catch (e) {
    toast("No se pudo publicar la respuesta", "error");
  } finally {
    answerDialog.busy = false;
  }
}

async function togglePublic(item) {
  try {
    await http.patch(`/admin/shop/questions/${item.id}`, { is_public: !item.is_public });
    item.is_public = !item.is_public;
    toast(item.is_public ? "Pregunta visible" : "Pregunta oculta", "success");
    loadSummary();
  } catch {
    toast("No se pudo actualizar", "error");
  }
}

/* ══════════════════════ REVIEWS ══════════════════════ */
const rHeaders = [
  { title: "Producto", key: "product", sortable: false, width: 220 },
  { title: "Cliente", key: "customer", sortable: false, width: 200 },
  { title: "Rating", key: "rating", sortable: false, width: 110 },
  { title: "Comentario", key: "comment", sortable: false },
  { title: "Estado", key: "status", sortable: false, width: 120 },
  { title: "Fecha", key: "created_at", sortable: false, width: 160 },
  { title: "", key: "actions", sortable: false, width: 80, align: "end" },
];

const rVisibility = ref("all");
const rRating = ref(0);
const rSearch = ref("");
const rPage = ref(1);
const rLimit = ref(25);
const rTotal = ref(0);
const rLoading = ref(false);
const reviews = ref([]);

const rVisibilityItems = [
  { title: "Todas",   value: "all" },
  { title: "Visibles", value: "visible" },
  { title: "Ocultas",  value: "hidden" },
];
const rRatingItems = [
  { title: "Todos los rating", value: 0 },
  { title: "5 ★", value: 5 },
  { title: "4 ★", value: 4 },
  { title: "3 ★", value: 3 },
  { title: "2 ★", value: 2 },
  { title: "1 ★", value: 1 },
];

async function loadReviews(page = 1) {
  rLoading.value = true;
  try {
    const { data } = await http.get("/admin/shop/reviews", {
      params: {
        visibility: rVisibility.value,
        rating: rRating.value || 0,
        q: (rSearch.value || "").trim(),
        page,
        limit: rLimit.value,
      },
    });
    reviews.value = Array.isArray(data?.items) ? data.items : [];
    rTotal.value = Number(data?.total || 0);
    rPage.value = Number(data?.page || page);
  } catch {
    toast("No se pudieron cargar las opiniones", "error");
  } finally {
    rLoading.value = false;
  }
}

async function toggleVisible(item) {
  try {
    await http.patch(`/admin/shop/reviews/${item.id}`, { is_visible: !item.is_visible });
    item.is_visible = !item.is_visible;
    toast(item.is_visible ? "Opinión visible" : "Opinión oculta", "success");
    loadSummary();
  } catch {
    toast("No se pudo actualizar", "error");
  }
}

/* ══════════════════════ Confirm Delete ══════════════════════ */
const confirmDialog = reactive({
  open: false,
  title: "",
  message: "",
  busy: false,
  onOk: () => {},
});

function confirmDeleteQuestion(item) {
  confirmDialog.title = "Eliminar pregunta";
  confirmDialog.message = "¿Eliminar esta consulta? Esta acción no se puede deshacer.";
  confirmDialog.onOk = async () => {
    confirmDialog.busy = true;
    try {
      await http.delete(`/admin/shop/questions/${item.id}`);
      confirmDialog.open = false;
      toast("Pregunta eliminada", "success");
      await Promise.all([loadQuestions(qPage.value), loadSummary()]);
    } catch {
      toast("No se pudo eliminar", "error");
    } finally {
      confirmDialog.busy = false;
    }
  };
  confirmDialog.open = true;
}

function confirmDeleteReview(item) {
  confirmDialog.title = "Eliminar opinión";
  confirmDialog.message = "¿Eliminar esta opinión? Esta acción no se puede deshacer.";
  confirmDialog.onOk = async () => {
    confirmDialog.busy = true;
    try {
      await http.delete(`/admin/shop/reviews/${item.id}`);
      confirmDialog.open = false;
      toast("Opinión eliminada", "success");
      await Promise.all([loadReviews(rPage.value), loadSummary()]);
    } catch {
      toast("No se pudo eliminar", "error");
    } finally {
      confirmDialog.busy = false;
    }
  };
  confirmDialog.open = true;
}

/* ══════════════════════ Init ══════════════════════ */
function reload() {
  loadSummary();
  if (tab.value === "questions") loadQuestions(qPage.value);
  else loadReviews(rPage.value);
}

onMounted(async () => {
  await loadSummary();
  await loadQuestions(1);
  await loadReviews(1);
});
</script>

<style scoped>
.qa-admin {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qa-tabs { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }

.qa-card { overflow: hidden; }

.qa-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  flex-wrap: wrap;
}
.qa-search { flex: 1; min-width: 240px; max-width: 480px; }
.qa-filter { width: 200px; }

.qa-table :deep(.v-data-table) { background: transparent; }
.qa-table :deep(.v-data-table-rows-no-data) {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.qa-prod__name {
  font-weight: 500;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
}
.qa-prod__link {
  display: inline-block;
  margin-top: 2px;
  font-size: 11.5px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
.qa-prod__link:hover { text-decoration: underline; }

.qa-cust__name {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.qa-cust__email {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.qa-text__q {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
}
.qa-text__a {
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.06);
  border-left: 3px solid rgb(var(--v-theme-primary));
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.78);
  display: flex;
  align-items: flex-start;
  gap: 4px;
}
.qa-text__by {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-style: italic;
}

.qa-date {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.qa-stars { display: inline-flex; gap: 0; }

.qa-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.qa-q-preview {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.78);
  line-height: 1.4;
}

@media (max-width: 600px) {
  .qa-toolbar { flex-direction: column; align-items: stretch; }
  .qa-search, .qa-filter { width: 100%; max-width: none; }
}
</style>
