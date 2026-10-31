<!-- src/modules/auth/pages/LoginPage.vue -->
<!-- Ingreso según el kit de POS 360 (src/app/theme/movil.css) y la maqueta aprobada
     (docs/diseno-movil, pantalla 1 "Ingreso"): Usuario o email, Contraseña,
     Mantener sesión y Entrar. Tokens --m-* para los dos temas.
     Escritorio: banda de marca a la izquierda y panel de ingreso a altura completa.
     Teléfono (menos de 960 px): franja de marca arriba con el logo y el ingreso debajo. -->
<template>
  <div class="lg m-vista">
    <!-- ══ MARCA ══ -->
    <aside class="lg-side">
      <div class="lg-side__cuerpo">
        <img :src="LOGO" alt="POS 360" class="lg-side__logo" />
        <h1 class="lg-side__tit">Sistema de gestión <span>para comercios.</span></h1>

        <LoginFlujo class="lg-side__flujo" />
      </div>

      <footer class="lg-pie lg-pie--banda">
        <span><b>POS 360</b> · <a href="https://sanjuansistemas.com/" target="_blank" rel="noopener">San Juan Sistemas</a></span>
        <span class="m-num">© {{ year }}</span>
      </footer>
    </aside>

    <!-- ══ INGRESO ══ -->
    <main class="lg-main">
      <form class="lg-form" novalidate @submit.prevent="submit">
        <h2 class="lg-h">Ingresar</h2>

        <div v-if="error" class="lg-error" role="alert">
          <v-icon size="20">mdi-alert-circle-outline</v-icon>
          <span>{{ error }}</span>
        </div>

        <div class="m-cmp">
          <label for="lg-user">Usuario o email</label>
          <input
            id="lg-user"
            ref="userEl"
            v-model="identifier"
            class="m-inp lg-inp"
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
              ref="passEl"
              v-model="password"
              class="m-inp lg-inp"
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

        <button type="submit" class="m-btn lg-btn" :disabled="loading">
          <v-progress-circular v-if="loading" indeterminate size="22" width="2" />
          <template v-else>Entrar</template>
        </button>
      </form>

      <footer class="lg-pie lg-pie--main">
        <span><b>POS 360</b> · <a href="https://sanjuansistemas.com/" target="_blank" rel="noopener">San Juan Sistemas</a></span>
        <span class="m-num">© {{ year }}</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import { huellaDisponible, activarHuella } from "@/app/native/huella";
import LoginFlujo from "@/modules/auth/components/LoginFlujo.vue";

const router = useRouter();
const auth = useAuthStore();

// Logo POS 360 (carrito celeste, fondo transparente). En la banda va en blanco por filtro.
const LOGO = "https://storage-files.cingulado.org/pos360/media/1777400527242-60fdb9fd89279d42.webp";


const identifier = ref("");
const password   = ref("");
const showPwd    = ref(false);
const remember   = ref(true);
const userEl     = ref(null);
const passEl     = ref(null);

// APK: ofrecer la huella solo si el telefono la tiene configurada.
const huellaOk  = ref(false);
const conHuella = ref(true);
huellaDisponible().then((ok) => { huellaOk.value = ok; });

const loading = ref(false);
const error   = ref(null);

const year = new Date().getFullYear();

// Textos de error del kit (informe 5, Ingreso).
function mensajeDeError(e) {
  if (!e?.response) return "Sin conexión";
  if (e.status === 401 || e.response.status === 401) return "Usuario o contraseña incorrectos";
  return e?.friendlyMessage || "Usuario o contraseña incorrectos";
}

async function submit() {
  if (loading.value) return;
  // El botón queda siempre activo: si falta un dato, el foco va a ese campo.
  if (!identifier.value.trim()) { userEl.value?.focus(); return; }
  if (!password.value) { passEl.value?.focus(); return; }

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
/* Todo sale de los tokens --m-* de movil.css: claro y oscuro sin reglas aparte.
   Único color fuera de tokens: el navy del logo (#121e47) al pie del degradé de la banda. */
.lg {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  background: var(--m-pieza);
}

/* ══ Banda de marca ══ */
.lg-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 48px 64px 24px;
  background: linear-gradient(160deg, var(--m-banda) 0%, #121e47 80%);
  color: var(--m-banda-ink);
}
.lg-side__cuerpo { margin: auto 0; max-width: 700px; }
.lg-side__logo {
  display: block;
  width: 180px;
  margin: -22px 0 10px -5px; /* el archivo trae aire arriba y abajo */
  filter: brightness(0) invert(1);
}
.lg-side__tit {
  font-size: clamp(32px, 2.9vw, 44px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: #fff;
  margin: 0 0 28px;
}
.lg-side__tit span { color: #a6d8fa; }

/* Flujo de canales (LoginFlujo.vue): se achica con zoom si falta lugar */
.lg-side__flujo { margin-top: 8px; }
@media (max-height: 880px) { .lg-side__flujo { zoom: 0.85; } }
@media (max-height: 760px) { .lg-side__flujo { zoom: 0.72; } }
@media (max-width: 1080px) and (min-width: 960px) { .lg-side__flujo { zoom: 0.68 !important; } }

/* ══ Ingreso ══ */
.lg-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 40px 24px;
  background: var(--m-pieza);
}
.lg-form {
  width: 100%;
  max-width: 380px;
  margin: auto 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.lg-h {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--m-tinta);
  margin: 0 0 6px;
}
/* Campo relleno con la variante del kit; al enfocar pasa a pieza con borde de acción */
.lg-inp {
  background: var(--m-variante);
  border-color: transparent;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.lg-inp:focus { background: var(--m-pieza); }
.lg-inp:disabled { opacity: 0.6; }
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
.lg-btn {
  border: 0;
  cursor: pointer;
  margin-top: 6px;
  transition: background 0.15s, box-shadow 0.15s;
}
.lg-btn:hover:not(:disabled) {
  background: var(--m-accion-osc) !important;
  box-shadow: 0 6px 18px rgba(15, 111, 174, 0.28);
}
.lg-btn:disabled { opacity: 1; cursor: default; }

/* ══ Pie ══ */
.lg-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
  font-size: 13px;
  width: 100%;
}
.lg-pie b { font-weight: 700; }
.lg-pie a { color: inherit; text-decoration: none; border-bottom: 1px solid currentColor; }
.lg-pie--banda { border-top: 1px solid rgba(255, 255, 255, 0.18); opacity: 0.85; }
.lg-pie--main { display: none; max-width: 380px; color: var(--m-suave); border-top: 1px solid var(--m-linea2); }

@media (max-width: 1180px) {
  .lg-side { padding: 40px 40px 24px; }
  .lg-side__flujo { zoom: 0.8; }
}

/* Teléfono (corte del kit): franja de marca arriba, ingreso debajo */
@media (max-width: 959.98px) {
  .lg { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .lg-side {
    padding: calc(32px + env(safe-area-inset-top, 0px)) 16px 32px;
    align-items: center;
    gap: 0;
  }
  .lg-side__cuerpo { margin: 0; }
  .lg-side__logo { width: 168px; margin: -20px auto -20px; }
  .lg-side__tit,
  .lg-side__flujo,
  .lg-pie--banda { display: none; }
  .lg-main { padding: 28px 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
  .lg-form { margin: 0 0 auto; }
  .lg-pie--main { display: flex; margin-top: 32px; }
}
</style>
