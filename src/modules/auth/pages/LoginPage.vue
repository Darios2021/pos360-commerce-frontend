<!-- src/modules/auth/pages/LoginPage.vue -->
<!-- Ingreso según el kit de POS 360 (src/app/theme/movil.css) y la maqueta aprobada
     (docs/diseno-movil, pantalla 1 "Ingreso"): Usuario o email, Contraseña,
     Mantener sesión y Entrar. Tokens --m-* para los dos temas, sin hex sueltos
     salvo el blanco sobre la banda. En escritorio suma la banda de marca a la izquierda. -->
<template>
  <div class="lg m-vista">
    <!-- ══ MARCA (solo escritorio) ══ -->
    <aside class="lg-side">
      <div class="lg-side__cuerpo">
        <div class="lg-side__marca">POS 360</div>
        <h1 class="lg-side__tit">Punto de venta, stock y tienda online para comercios.</h1>

        <ul class="lg-side__lista">
          <li v-for="f in FUNCIONES" :key="f.t">
            <span class="lg-side__ico"><v-icon size="20">{{ f.i }}</v-icon></span>
            <span class="lg-side__tx"><b>{{ f.t }}</b><small>{{ f.d }}</small></span>
          </li>
        </ul>
      </div>

      <footer class="lg-pie lg-pie--banda">
        <span><b>POS 360</b> · <a href="https://sanjuansistemas.com/" target="_blank" rel="noopener">San Juan Sistemas</a></span>
        <span class="m-num">© {{ year }}</span>
      </footer>
    </aside>

    <!-- ══ INGRESO ══ -->
    <main class="lg-main">
      <form class="lg-pz m-pz" novalidate @submit.prevent="submit">
        <img :src="LOGO" alt="POS 360" class="lg-logo" />

        <div v-if="error" class="lg-error" role="alert">
          <v-icon size="20">mdi-alert-circle-outline</v-icon>
          <span>{{ error }}</span>
        </div>

        <div class="m-cmp">
          <label for="lg-user">Usuario o email</label>
          <input
            id="lg-user"
            v-model="identifier"
            class="m-inp"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            autofocus
            :disabled="loading"
          />
        </div>

        <div class="m-cmp">
          <label for="lg-pass">Contraseña</label>
          <div class="m-inpw sinpre">
            <input
              id="lg-pass"
              v-model="password"
              class="m-inp"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="act"
              :aria-label="showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPwd = !showPwd"
            >
              <v-icon size="22">{{ showPwd ? "mdi-eye-off-outline" : "mdi-eye-outline" }}</v-icon>
            </button>
          </div>
        </div>

        <button type="button" class="m-sw" :class="{ on: remember }" role="switch" :aria-checked="remember" @click="remember = !remember">
          <span>Mantener sesión</span><span class="t"></span>
        </button>

        <!-- APK: cerrojo de huella al abrir la app (app/native/huella.js) -->
        <button
          v-if="huellaOk"
          type="button"
          class="m-sw"
          :class="{ on: conHuella }"
          role="switch"
          :aria-checked="conHuella"
          @click="conHuella = !conHuella"
        >
          <span>Entrar con huella la próxima vez</span><span class="t"></span>
        </button>

        <button type="submit" class="m-btn lg-btn" :disabled="!canSubmit">
          <v-progress-circular v-if="loading" indeterminate size="22" width="2" />
          <template v-else>Entrar</template>
        </button>

        <div class="m-centro">
          <a class="m-lnk" href="mailto:soporte@sanjuantecnologia.com">Contactar soporte</a>
        </div>
      </form>

      <footer class="lg-pie lg-pie--canvas">
        <span><b>POS 360</b> · <a href="https://sanjuansistemas.com/" target="_blank" rel="noopener">San Juan Sistemas</a></span>
        <span class="m-num">© {{ year }}</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import { huellaDisponible, activarHuella } from "@/app/native/huella";

const router = useRouter();
const auth = useAuthStore();

// Logo POS 360 (carrito celeste).
const LOGO = "https://storage-files.cingulado.org/pos360/media/1777400527242-60fdb9fd89279d42.webp";

const FUNCIONES = [
  { i: "mdi-storefront-outline", t: "Mostrador y tienda online", d: "Un solo catálogo y un solo stock para los dos." },
  { i: "mdi-package-variant-closed", t: "Stock por sucursal", d: "Derivaciones entre sucursales y productos sin stock." },
  { i: "mdi-cash-register", t: "Caja", d: "Apertura, ingresos, egresos y cierre con arqueo." },
  { i: "mdi-chart-box-outline", t: "Reportes", d: "Ventas por día, por medio de pago y por sucursal." },
];

const identifier = ref("");
const password   = ref("");
const showPwd    = ref(false);
const remember   = ref(true);

// APK: ofrecer la huella solo si el telefono la tiene configurada.
const huellaOk  = ref(false);
const conHuella = ref(true);
huellaDisponible().then((ok) => { huellaOk.value = ok; });

const loading = ref(false);
const error   = ref(null);

const year = new Date().getFullYear();

const canSubmit = computed(
  () => !!identifier.value.trim() && !!password.value && !loading.value
);

// Textos de error del kit (informe 5, Ingreso).
function mensajeDeError(e) {
  if (!e?.response) return "Sin conexión";
  if (e.status === 401 || e.response.status === 401) return "Usuario o contraseña incorrectos";
  return e?.friendlyMessage || "Usuario o contraseña incorrectos";
}

async function submit() {
  if (!canSubmit.value) return;
  loading.value = true;
  error.value = null;
  try {
    await auth.login({
      identifier: identifier.value.trim(),
      password: password.value,
      remember: remember.value,
    });
    if (huellaOk.value) activarHuella(conHuella.value && remember.value);
    router.replace({ name: "home" });
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Todo sale de los tokens --m-* de movil.css: claro y oscuro sin reglas aparte. */
.lg {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

/* ══ Banda de marca ══ */
.lg-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 48px 56px 24px;
  background: var(--m-banda);
  color: var(--m-banda-ink);
}
.lg-side__cuerpo { margin: auto 0; max-width: 480px; }
.lg-side__marca { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 16px; }
.lg-side__tit {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 32px;
}
.lg-side__lista { list-style: none; margin: 0; padding: 0; }
.lg-side__lista li {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}
.lg-side__ico {
  width: 40px; height: 40px;
  flex: none;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.lg-side__ico .v-icon { color: #fff; }
.lg-side__tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lg-side__tx b { font-size: 15px; font-weight: 600; color: #fff; }
.lg-side__tx small { font-size: 13px; opacity: 0.8; }

/* ══ Ingreso ══ */
.lg-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px 24px;
  background: var(--m-canvas);
}
.lg-pz {
  width: 100%;
  max-width: 400px;
  margin: auto 0;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lg-logo {
  display: block;
  width: 120px; height: 120px;
  object-fit: contain;
  margin: 0 auto 4px;
}
.lg-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--m-rojo-tinte);
  color: var(--m-rojo);
  font-size: 15px;
  font-weight: 600;
}
.lg-error .v-icon { color: var(--m-rojo); }
.lg-btn { border: 0; cursor: pointer; margin-top: 4px; }
.lg-btn:disabled { cursor: default; }
.m-inp:disabled { opacity: 0.6; }

/* ══ Pie ══ */
.lg-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
  font-size: 13px;
}
.lg-pie b { font-weight: 700; }
.lg-pie a { color: inherit; text-decoration: none; border-bottom: 1px solid currentColor; }
.lg-pie--banda { border-top: 1px solid rgba(255, 255, 255, 0.18); opacity: 0.85; }
.lg-pie--canvas {
  display: none;
  width: 100%;
  max-width: 400px;
  margin-top: 16px;
  color: var(--m-sobre-canvas);
}

/* Teléfono (corte del kit: menos de 960 px): sin banda, pieza a lo ancho */
@media (max-width: 959.98px) {
  .lg { grid-template-columns: 1fr; }
  .lg-side { display: none; }
  .lg-main { padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
  .lg-pie--canvas { display: flex; }
  .lg-logo { width: 104px; height: 104px; }
}
</style>
