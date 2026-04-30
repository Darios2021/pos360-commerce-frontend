<!--
  ProductQAReviews — Bloque "Preguntas y respuestas" + "Opiniones del producto"
  estilo Mercado Libre.

  - Preguntar: requiere sesión. Si no hay, redirige a login.
  - Opinar: requiere sesión + (idealmente) tener compra confirmada del producto.
    Si no hay sesión, redirige a login. El backend puede validar lo demás.

  Endpoints (backend pos360-commerce-api):
    GET  /api/v1/public/products/:id/questions
    POST /api/v1/public/products/:id/questions       { text }
    GET  /api/v1/public/products/:id/reviews
    GET  /api/v1/public/products/:id/reviews/summary
    POST /api/v1/public/products/:id/reviews         { rating, comment }
-->
<template>
  <section class="qa">
    <!-- ════════ Preguntas y respuestas ════════ -->
    <div class="qa-block">
      <h2 class="qa-block__title">Preguntas y respuestas</h2>

      <form class="qa-ask" @submit.prevent="onAsk">
        <input
          ref="askInput"
          v-model="askText"
          class="qa-ask__input"
          type="text"
          placeholder="Escribí tu pregunta…"
          maxlength="500"
          :disabled="askBusy"
        />
        <button
          type="submit"
          class="qa-ask__btn"
          :disabled="askBusy || !askText.trim()"
        >
          <v-icon size="18" class="qa-ask__btn-icon">mdi-creation</v-icon>
          <span>{{ askBusy ? "Enviando…" : "Preguntar" }}</span>
        </button>
      </form>

      <button
        v-if="questions.length > 3 && !showAllQuestions"
        type="button"
        class="qa-link"
        @click="showAllQuestions = true"
      >
        Ver todas las preguntas ({{ questions.length }})
      </button>

      <!-- Lista preview (3 ó todas) -->
      <ul v-if="questions.length" class="qa-list">
        <li
          v-for="q in showAllQuestions ? questions : questions.slice(0, 3)"
          :key="q.id"
          class="qa-item"
        >
          <div class="qa-item__q">
            <v-icon size="14" class="qa-item__q-icon">mdi-message-question-outline</v-icon>
            <span>{{ q.text }}</span>
          </div>
          <div v-if="q.answer" class="qa-item__a">
            <v-icon size="14" class="qa-item__a-icon">mdi-arrow-bottom-right</v-icon>
            <span>{{ q.answer }}</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="qa-divider" />

    <!-- ════════ Opiniones del producto ════════ -->
    <div class="qa-block">
      <h2 class="qa-block__title">Opiniones del producto</h2>

      <div class="qa-reviews">
        <!-- Resumen rating -->
        <div class="qa-rating">
          <div class="qa-rating__main">
            <span class="qa-rating__avg">{{ averageRating.toFixed(1) }}</span>
            <div class="qa-rating__stars">
              <v-icon
                v-for="i in 5"
                :key="i"
                size="22"
                :color="i <= Math.round(averageRating) ? 'primary' : 'rgba(0,0,0,0.2)'"
              >
                {{ i <= Math.round(averageRating) ? 'mdi-star' : 'mdi-star-outline' }}
              </v-icon>
            </div>
          </div>
          <div class="qa-rating__count">
            {{ totalReviews }} {{ totalReviews === 1 ? 'calificación' : 'calificaciones' }}
          </div>

          <!-- Distribución por estrellas -->
          <div class="qa-bars">
            <div
              v-for="n in [5, 4, 3, 2, 1]"
              :key="n"
              class="qa-bar"
            >
              <div class="qa-bar__track">
                <div
                  class="qa-bar__fill"
                  :style="{ width: barWidthFor(n) }"
                />
              </div>
              <span class="qa-bar__label">
                {{ n }}
                <v-icon size="12">mdi-star</v-icon>
              </span>
            </div>
          </div>
        </div>

        <!-- Estado vacío o lista de comentarios -->
        <div class="qa-comments">
          <div v-if="!totalReviews" class="qa-empty">
            <div class="qa-empty__icon">
              <v-icon size="36">mdi-message-text-outline</v-icon>
            </div>
            <div class="qa-empty__title">Este producto aún no tiene comentarios.</div>
            <div class="qa-empty__sub">
              Al comprarlo y compartir tu opinión, estarás ayudando a la comunidad.
            </div>

            <button
              v-if="canReview"
              type="button"
              class="qa-empty__cta"
              @click="openReviewDialog"
            >
              <v-icon size="16">mdi-star-outline</v-icon>
              Dejar mi opinión
            </button>
            <div v-else-if="cannotReviewReason" class="qa-empty__hint">
              <v-icon size="14">mdi-information-outline</v-icon>
              {{ cannotReviewReason }}
            </div>
          </div>

          <template v-else>
            <div v-if="canReview" class="qa-cta-row">
              <button type="button" class="qa-empty__cta" @click="openReviewDialog">
                <v-icon size="16">mdi-star-outline</v-icon>
                Dejar mi opinión
              </button>
            </div>
          <ul class="qa-comment-list">
            <li v-for="r in reviews.slice(0, 3)" :key="r.id" class="qa-comment">
              <div class="qa-comment__head">
                <div class="qa-comment__stars">
                  <v-icon
                    v-for="i in 5"
                    :key="i"
                    size="14"
                    :color="i <= r.rating ? 'primary' : 'rgba(0,0,0,0.18)'"
                  >mdi-star</v-icon>
                </div>
                <span class="qa-comment__date">{{ fmtDate(r.created_at) }}</span>
              </div>
              <div class="qa-comment__author" v-if="r.author_name">{{ r.author_name }}</div>
              <p class="qa-comment__text" v-if="r.comment">{{ r.comment }}</p>
            </li>
          </ul>
          </template>
        </div>
      </div>
    </div>

    <!-- Dialog de "Dejar opinión" -->
    <v-dialog v-model="reviewDialog" max-width="480">
      <v-card rounded="xl" class="pa-1">
        <v-card-title class="d-flex align-center ga-2 pt-4 px-4">
          <v-icon color="primary">mdi-star-outline</v-icon>
          <span class="font-weight-bold">Calificá este producto</span>
        </v-card-title>
        <v-card-text class="px-4 pb-2">
          <div class="qa-rating-input">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              class="qa-rating-input__star"
              :class="{ 'is-on': i <= newRating }"
              @click="newRating = i"
              :aria-label="`${i} estrellas`"
            >
              <v-icon size="32">{{ i <= newRating ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
            </button>
          </div>
          <v-textarea
            v-model="newComment"
            placeholder="Contanos tu experiencia con este producto…"
            variant="outlined"
            rows="3"
            auto-grow
            counter="500"
            :maxlength="500"
            density="comfortable"
            class="mt-3"
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="reviewDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="reviewBusy"
            :disabled="!newRating"
            @click="onSubmitReview"
          >
            Publicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000" :color="snack.color">
      {{ snack.text }}
    </v-snackbar>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const props = defineProps({
  productId: { type: [Number, String], required: true },
  /** Si el padre ya conoce data, puede pasarla para evitar fetch */
  initialQuestions: { type: Array, default: () => [] },
  initialReviews:   { type: Array, default: () => [] },
});

const router = useRouter();
const auth = useShopAuthStore();

/* ── State ───────────────────────────────────────────────── */
const askText = ref("");
const askBusy = ref(false);
const askInput = ref(null);
const showAllQuestions = ref(false);

const questions = ref([...props.initialQuestions]);
const reviews   = ref([...props.initialReviews]);

const reviewDialog = ref(false);
const reviewBusy = ref(false);
const newRating = ref(0);
const newComment = ref("");

// Flags del backend sobre la posibilidad del customer de opinar
const reviewFlags = ref({
  is_authenticated: false,
  has_purchased: false,
  has_reviewed: false,
  can_review: false,
});

const snack = reactive({ show: false, text: "", color: "primary" });

function toast(text, color = "primary") {
  snack.text = text;
  snack.color = color;
  snack.show = true;
}

/* ── Computeds ──────────────────────────────────────────── */
const totalReviews = computed(() => reviews.value.length);
const averageRating = computed(() => {
  if (!reviews.value.length) return 0;
  const sum = reviews.value.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return sum / reviews.value.length;
});
function barWidthFor(stars) {
  if (!totalReviews.value) return "0%";
  const n = reviews.value.filter((r) => Math.round(Number(r.rating)) === stars).length;
  return `${Math.round((n / totalReviews.value) * 100)}%`;
}
/* Solo se muestra el botón de opinar si el backend confirma que:
   - el customer está logueado
   - compró el producto
   - aún no opinó */
const canReview = computed(() => reviewFlags.value.can_review === true);
const cannotReviewReason = computed(() => {
  if (!reviewFlags.value.is_authenticated) return "Iniciá sesión para opinar";
  if (reviewFlags.value.has_reviewed) return "Ya dejaste tu opinión";
  if (!reviewFlags.value.has_purchased) return "Solo podés opinar de productos que hayas comprado";
  return "";
});

/* ── Helpers ────────────────────────────────────────────── */
function requireLogin() {
  if (auth.isLogged) return true;
  router.push({ name: "shopLogin", query: { redirect: window.location.pathname } });
  return false;
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── API base (mismo patrón que el resto del shop público) ──────── */
function trimSlash(s) { return String(s || "").replace(/\/+$/, ""); }
const baseRaw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
let basePath = baseRaw || "/api/v1";
if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  const sameOrigin = ["1","true"].includes(String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim().toLowerCase());
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com" || sameOrigin) basePath = "/api/v1";
}
// Auth shop usa cookie httpOnly → withCredentials: true
const api = axios.create({
  baseURL: `${trimSlash(basePath)}/public`,
  timeout: 20000,
  withCredentials: true,
});

/* ── Acciones ───────────────────────────────────────────── */
async function onAsk() {
  const text = askText.value.trim();
  if (!text) return;
  if (!requireLogin()) return;

  askBusy.value = true;
  try {
    const r = await api.post(`/products/${props.productId}/questions`, { text });
    const q = r?.data?.question || r?.data || { id: Date.now(), text, answer: null };
    questions.value = [q, ...questions.value];
    askText.value = "";
    toast("Tu pregunta fue enviada. Te avisaremos cuando responda el vendedor.", "success");
  } catch (e) {
    const status = e?.response?.status;
    if (status === 401) {
      toast("Iniciá sesión para preguntar.", "warning");
      requireLogin();
    } else {
      toast("No pudimos enviar tu pregunta. Probá de nuevo más tarde.", "error");
    }
  } finally {
    askBusy.value = false;
  }
}

function openReviewDialog() {
  if (!requireLogin()) return;
  newRating.value = 0;
  newComment.value = "";
  reviewDialog.value = true;
}

async function onSubmitReview() {
  if (!newRating.value) {
    toast("Elegí cuántas estrellas le ponés.", "warning");
    return;
  }
  reviewBusy.value = true;
  try {
    const r = await api.post(`/products/${props.productId}/reviews`, {
      rating: newRating.value,
      comment: newComment.value.trim(),
    });
    const rev = r?.data?.review || r?.data || {
      id: Date.now(),
      rating: newRating.value,
      comment: newComment.value.trim(),
      created_at: new Date().toISOString(),
      author_name: auth.fullName || "",
    };
    reviews.value = [rev, ...reviews.value];
    reviewDialog.value = false;
    toast("¡Gracias por tu opinión!", "success");
  } catch (e) {
    const status = e?.response?.status;
    if (status === 401) {
      toast("Iniciá sesión para opinar.", "warning");
      requireLogin();
    } else if (status === 403) {
      toast("Solo podés opinar después de comprar este producto.", "warning");
    } else {
      toast("No pudimos publicar tu opinión.", "error");
    }
  } finally {
    reviewBusy.value = false;
  }
}

/* ── Fetch inicial ──────────────────────────────────────── */
async function fetchAll() {
  try {
    const [qr, rr, sr] = await Promise.allSettled([
      api.get(`/products/${props.productId}/questions`, { params: { limit: 10 } }),
      api.get(`/products/${props.productId}/reviews`,   { params: { limit: 10 } }),
      api.get(`/products/${props.productId}/reviews/summary`),
    ]);
    if (qr.status === "fulfilled") {
      const list = qr.value?.data?.items || qr.value?.data?.questions || qr.value?.data || [];
      if (Array.isArray(list)) questions.value = list;
    }
    if (rr.status === "fulfilled") {
      const list = rr.value?.data?.items || rr.value?.data?.reviews || rr.value?.data || [];
      if (Array.isArray(list)) reviews.value = list;
    }
    if (sr.status === "fulfilled") {
      const d = sr.value?.data || {};
      reviewFlags.value = {
        is_authenticated: !!d.is_authenticated,
        has_purchased:    !!d.has_purchased,
        has_reviewed:     !!d.has_reviewed,
        can_review:       !!d.can_review,
      };
    }
  } catch {
    /* silencioso */
  }
}

onMounted(fetchAll);
watch(() => props.productId, fetchAll);
</script>

<style scoped>
.qa {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 22px 24px;
}

.qa-block + .qa-divider {
  margin: 24px -24px;
}
.qa-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
}

.qa-block__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #1a1a1a;
  margin: 0 0 18px;
}

/* ── Ask form ──────────────────────────────────────── */
.qa-ask {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.qa-ask__input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: #fff;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.qa-ask__input:focus {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(20, 136, 209, 0.14);
}
.qa-ask__input:disabled { opacity: 0.6; }

.qa-ask__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
  height: 48px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.005em;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.qa-ask__btn:hover:not(:disabled) { filter: brightness(0.94); }
.qa-ask__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.qa-ask__btn-icon { color: #fff; }

.qa-link {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}
.qa-link:hover { text-decoration: underline; }

.qa-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.qa-item {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 9px;
  padding: 12px 14px;
}
.qa-item__q,
.qa-item__a {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13.5px;
  line-height: 1.4;
}
.qa-item__q { color: #1a1a1a; font-weight: 500; }
.qa-item__a {
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.7);
}
.qa-item__q-icon { color: rgba(0, 0, 0, 0.5); margin-top: 3px; flex-shrink: 0; }
.qa-item__a-icon { color: rgb(var(--v-theme-primary)); margin-top: 3px; flex-shrink: 0; }

/* ── Reviews ──────────────────────────────────────── */
.qa-reviews {
  display: grid;
  grid-template-columns: minmax(220px, 280px) 1fr;
  gap: 32px;
  align-items: start;
}

.qa-rating__main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.qa-rating__avg {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}
.qa-rating__stars {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}
.qa-rating__count {
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
  margin-top: 4px;
  margin-left: 2px;
}
.qa-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
}
.qa-bar {
  display: grid;
  grid-template-columns: 1fr 36px;
  align-items: center;
  gap: 10px;
}
.qa-bar__track {
  height: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.qa-bar__fill {
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  transition: width 0.3s ease;
}
.qa-bar__label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.qa-bar__label .v-icon { color: rgba(0, 0, 0, 0.4); }

/* Empty state */
.qa-comments { min-width: 0; }
.qa-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14px 8px;
  gap: 4px;
}
.qa-empty__icon {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.45);
}
.qa-empty__title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}
.qa-empty__sub {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  max-width: 380px;
  margin-top: 2px;
}
.qa-empty__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s;
}
.qa-empty__cta:hover {
  background: rgba(20, 136, 209, 0.08);
}
.qa-empty__hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}
.qa-empty__hint .v-icon { color: rgba(0, 0, 0, 0.4); }

.qa-cta-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

/* Comment list */
.qa-comment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.qa-comment {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 12px;
}
.qa-comment:last-child { border-bottom: 0; padding-bottom: 0; }
.qa-comment__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.qa-comment__stars { display: inline-flex; gap: 0; }
.qa-comment__date {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}
.qa-comment__author {
  margin-top: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: #1a1a1a;
}
.qa-comment__text {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: rgba(0, 0, 0, 0.78);
  line-height: 1.5;
}

/* Rating input dialog */
.qa-rating-input {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.qa-rating-input__star {
  background: transparent;
  border: 0;
  color: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  padding: 4px;
  transition: color 0.14s, transform 0.1s;
}
.qa-rating-input__star.is-on,
.qa-rating-input__star:hover {
  color: rgb(var(--v-theme-primary));
}
.qa-rating-input__star:active { transform: scale(0.92); }

/* Mobile */
@media (max-width: 600px) {
  .qa { padding: 16px 14px; border-radius: 10px; }
  .qa-block + .qa-divider { margin: 18px -14px; }
  .qa-block__title { font-size: 17px; margin-bottom: 14px; }

  .qa-ask { flex-direction: column; gap: 8px; }
  .qa-ask__input, .qa-ask__btn { width: 100%; height: 44px; }

  .qa-reviews {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .qa-rating__avg { font-size: 38px; }
}
</style>
