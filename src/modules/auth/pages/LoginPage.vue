<!-- src/modules/auth/pages/LoginPage.vue -->
<!-- Ingreso según el kit de POS 360 (src/app/theme/movil.css) y la maqueta aprobada
     (docs/diseno-movil, pantalla 1 "Ingreso"): Usuario o email, Contraseña,
     Mantener sesión y Entrar. Tokens --m-* para los dos temas, sin hex sueltos
     salvo el blanco sobre la banda. En escritorio suma la banda de marca a la izquierda. -->
<template>
  <div class="lg m-vista">
    <!-- ══ MARCA (solo escritorio) ══ -->
    <aside class="lg-side">
      <img :src="LOGO" alt="" aria-hidden="true" class="lg-side__agua" />

      <div class="lg-side__cuerpo">
        <img :src="LOGO" alt="POS 360" class="lg-side__logo" />
        <h1 class="lg-side__tit">Punto de venta, stock y tienda online <span>para comercios.</span></h1>

        <ul class="lg-side__lista">
          <li v-for="f in FUNCIONES" :key="f.t">
            <span class="lg-side__ico"><v-icon size="24">{{ f.i }}</v-icon></span>
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

/* ══ Banda de marca ══
   Banda del kit (--m-banda) que baja al navy del logo (#121e47, --m-avatar en claro).
   El logo va en blanco arriba y gigante como marca de agua. */
.lg-side {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 48px 64px 24px;
  background: linear-gradient(160deg, var(--m-banda) 0%, #121e47 78%);
  color: var(--m-banda-ink);
}
.lg-side > :not(.lg-side__agua) { position: relative; z-index: 1; }
.lg-side__agua {
  position: absolute;
  width: 720px;
  right: -250px;
  bottom: -150px;
  filter: brightness(0) invert(1);
  opacity: 0.05;
  pointer-events: none;
  user-select: none;
}
.lg-side__cuerpo { margin: auto 0; max-width: 560px; }
.lg-side__logo {
  display: block;
  width: 220px;
  margin: -26px 0 18px -6px; /* el archivo trae aire arriba y abajo */
  filter: brightness(0) invert(1);
}
.lg-side__tit {
  font-size: clamp(36px, 3.4vw, 50px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: #fff;
  margin: 0 0 40px;
}
.lg-side__tit span { color: #a6d8fa; }
.lg-side__lista {
  list-style: none; margin: 0; padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.lg-side__lista li {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.lg-side__ico {
  width: 44px; height: 44px;
  flex: none;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--m-accion);
  color: #fff;
}
.lg-side__ico .v-icon { color: #fff; }
.lg-side__tx { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lg-side__tx b { font-size: 16px; font-weight: 800; color: #fff; }
.lg-side__tx small { font-size: 13px; line-height: 1.4; opacity: 0.78; }

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
  max-width: 420px;
  margin: auto 0;
  padding: 28px 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lg-logo {
  display: block;
  display: none; /* en escritorio el logo ya está en la banda */
  width: 170px;
  margin: -20px auto -8px; /* el archivo trae aire arriba y abajo */
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
  max-width: 420px;
  margin-top: 16px;
  color: var(--m-sobre-canvas);
}

/* Teléfono (corte del kit: menos de 960 px): sin banda, pieza a lo ancho */
@media (max-width: 1180px) {
  .lg-side { padding: 40px 40px 24px; }
  .lg-side__lista { grid-template-columns: 1fr; }
  .lg-side__lista li { flex-direction: row; align-items: center; padding: 14px; }
}

@media (max-width: 959.98px) {
  .lg { grid-template-columns: 1fr; }
  .lg-side { display: none; }
  .lg-main { padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
  .lg-pie--canvas { display: flex; }
  .lg-logo { display: block; }
  .lg-pz { padding: 24px 20px 16px; }
}
</style>
