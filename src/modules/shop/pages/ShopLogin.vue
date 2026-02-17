<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopLogin.vue -->
<template>
  <div class="sl">
    <div class="sl-card">
      <div class="sl-title">Ingresá</div>
      <div class="sl-sub">
        Entrá con Google para ver tus compras y avanzar más rápido.
      </div>

      <v-alert v-if="error" type="error" variant="tonal" class="mt-3">
        {{ error }}
      </v-alert>

      <v-alert v-else-if="!googleClientId" type="warning" variant="tonal" class="mt-3">
        Falta configurar <b>VITE_GOOGLE_CLIENT_ID</b> en el frontend.
        <br />
        (Es el mismo valor que ya tenés en backend: <b>GOOGLE_CLIENT_ID</b>)
      </v-alert>

      <!-- ✅ Botón Google (GIS) -->
      <div class="sl-google" v-if="googleClientId">
        <div ref="gisBtn" class="sl-gis-btn" />
        <div class="sl-note">
          Al continuar, aceptás iniciar sesión con tu cuenta Google.
        </div>
      </div>

      <div class="sl-actions">
        <v-btn variant="tonal" @click="goBack">Volver</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!googleClientId" @click="promptGoogle">
          Continuar
        </v-btn>
      </div>

      <div class="sl-foot">
        ¿Problemas con el navegador interno de Instagram/Facebook?
        Probá “Abrir en navegador”.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useShopAuthStore } from "@/modules/shop/store/shopAuth.store";

const route = useRoute();
const router = useRouter();
const auth = useShopAuthStore();

const loading = ref(false);
const error = ref(null);

const gisBtn = ref(null);

const googleClientId = computed(() => String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim());
const redirectTo = computed(() => String(route.query.redirect || "/shop"));

function goBack() {
  // vuelve al redirect si venía de ahí, sino al home shop
  const r = redirectTo.value || "/shop";
  router.replace(r).catch(() => router.replace("/shop").catch(() => {}));
}

// ========================
// GIS loader
// ========================
let scriptEl = null;

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(true);

    const existing = document.querySelector('script[data-gis="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    scriptEl = document.createElement("script");
    scriptEl.src = "https://accounts.google.com/gsi/client";
    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.dataset.gis = "1";

    scriptEl.onload = () => resolve(true);
    scriptEl.onerror = reject;

    document.head.appendChild(scriptEl);
  });
}

async function onGoogleCredentialResponse(resp) {
  try {
    loading.value = true;
    error.value = null;

    const credential = resp?.credential;
    if (!credential) throw new Error("No llegó credential de Google.");

    await auth.loginGoogle({ credential });

    // si login ok, redirigir
    const target = redirectTo.value || "/shop";
    router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
  } catch (e) {
    const msg = e?.friendlyMessage || e?.message || String(e);
    error.value = msg;
  } finally {
    loading.value = false;
  }
}

async function initGis() {
  if (!googleClientId.value) return;

  await loadGisScript();

  await nextTick();

  // init
  window.google.accounts.id.initialize({
    client_id: googleClientId.value,
    callback: onGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  // render button (visible)
  if (gisBtn.value) {
    gisBtn.value.innerHTML = "";
    window.google.accounts.id.renderButton(gisBtn.value, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left",
      width: 320,
    });
  }
}

function promptGoogle() {
  if (!window.google?.accounts?.id) return;
  // abre el prompt (si el usuario tocó "Continuar")
  window.google.accounts.id.prompt();
}

onMounted(async () => {
  try {
    // si ya está logueado, no mostramos login
    await auth.fetchMe({ force: true });
    if (auth.isLogged) {
      const target = redirectTo.value || "/shop";
      return router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
    }

    await initGis();
  } catch (e) {
    error.value = e?.message || String(e);
  }
});

onBeforeUnmount(() => {
  try {
    // opcional: no cancelo globalmente porque puede afectar otros renders
  } catch {}
});
</script>

<style scoped>
.sl {
  min-height: calc(100vh - 120px);
  display: grid;
  place-items: center;
  padding: 28px 12px;
  background: #f4f4f4;
}

.sl-card {
  width: min(640px, calc(100% - 16px));
  background: #fff;
  border-radius: 18px;
  padding: 22px 22px 18px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.14);
}

.sl-title {
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 6px;
}

.sl-sub {
  font-size: 13px;
  opacity: 0.8;
}

.sl-google {
  margin-top: 14px;
  display: grid;
  gap: 10px;
  justify-items: start;
}

.sl-gis-btn {
  min-height: 46px;
}

.sl-note {
  font-size: 12px;
  opacity: 0.75;
}

.sl-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.sl-foot {
  margin-top: 14px;
  font-size: 12px;
  opacity: 0.7;
}
</style>
