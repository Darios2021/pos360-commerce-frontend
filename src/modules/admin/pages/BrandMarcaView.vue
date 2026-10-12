<!-- /admin/shop/branding — Marca del comercio: nombre, logos, colores y tipografía.
     Fuente única de la marca (tienda, emails y videos). Un solo botón Guardar. -->

<template>
  <div class="sp mk">
    <header class="mk-cab">
      <div>
        <div class="mk-migas">Tienda</div>
        <h1>Marca</h1>
      </div>
      <div v-if="!cargando" class="mk-estado" :class="{ 'is-sucio': sucio }">
        <i></i><span>{{ sucio ? "Cambios sin guardar" : "Guardado" }}</span>
      </div>
      <button class="mk-guardar" type="button" :disabled="!puedeGuardar" @click="guardar">
        {{ guardando ? "Guardando" : "Guardar" }}
      </button>
    </header>

    <div class="mk-vista">
      <div class="mk-editor">
        <div v-if="error" class="mk-error" role="alert">{{ error }}</div>

        <template v-if="cargando">
          <div v-for="n in 4" :key="n" class="mk-bloque mk-esqueleto" aria-hidden="true">
            <span class="mk-esq-t"></span>
            <span class="mk-esq-c"></span>
          </div>
        </template>

        <template v-else>
          <!-- Nombre -->
          <section class="mk-bloque">
            <h2>Nombre</h2>
            <div class="mk-campo">
              <label for="mk-nombre">Nombre del comercio</label>
              <input
                id="mk-nombre"
                v-model="est.nombre"
                class="mk-texto"
                :class="{ 'is-error': faltaNombre }"
                maxlength="60"
                autocomplete="organization"
              />
              <span v-if="faltaNombre" class="mk-campo-error">Falta el nombre</span>
            </div>
          </section>

          <!-- Logo -->
          <section class="mk-bloque">
            <h2>Logo</h2>
            <div class="mk-logos">
              <div v-for="s in SLOTS" :key="s.k" class="mk-logo">
                <label class="mk-logo-caja" :class="s.fondo">
                  <img v-if="est.logos[s.k].url" :src="abs(est.logos[s.k].url)" :alt="`Logo ${s.n}`" />
                  <img
                    v-else-if="s.usaPrincipal && est.logos.principal.url"
                    :src="abs(est.logos.principal.url)"
                    alt=""
                    class="is-tenue"
                  />
                  <span v-else-if="!s.usaPrincipal" class="mk-logo-vacio">PNG, SVG o WEBP</span>
                  <input
                    type="file"
                    :accept="s.accept"
                    :aria-label="`Elegir logo ${s.n}`"
                    @change="elegirLogo(s.k, $event)"
                  />
                </label>
                <div class="mk-logo-pie">
                  <span>{{ s.n }}</span>
                  <button
                    v-if="est.logos[s.k].url && s.k !== 'principal'"
                    type="button"
                    class="mk-quitar"
                    @click="quitarLogo(s.k)"
                  >Quitar</button>
                  <span v-else-if="s.usaPrincipal" class="mk-chip">Usa principal</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Colores -->
          <section class="mk-bloque">
            <h2>Colores</h2>
            <div class="mk-colores">
              <div v-for="c in COLORES" :key="c.k" class="mk-color">
                <label class="mk-muestra" :style="{ background: est.colores[c.k], color: tinta(est.colores[c.k]) }">
                  {{ c.n }}
                  <input
                    type="color"
                    :value="est.colores[c.k]"
                    :aria-label="c.n"
                    @input="est.colores[c.k] = $event.target.value.toLowerCase()"
                  />
                </label>
                <div class="mk-color-pie">
                  <input
                    class="mk-hex"
                    :value="est.colores[c.k]"
                    maxlength="7"
                    spellcheck="false"
                    :aria-label="`${c.n} en hexadecimal`"
                    @change="hexCambio(c.k, $event)"
                  />
                  <div class="mk-fila">
                    <span class="mk-chip" :class="chipContraste(est.colores[c.k]).cls">
                      {{ chipContraste(est.colores[c.k]).texto }}
                    </span>
                    <span v-if="esPredeterminado(c.campo, est.colores[c.k])" class="mk-chip">Predeterminado</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Tipografía -->
          <section class="mk-bloque">
            <h2>Tipografía</h2>
            <div class="mk-campo">
              <span class="mk-rotulo">Titulares</span>
              <div class="mk-tipos" role="radiogroup" aria-label="Titulares">
                <button
                  v-for="t in TITULARES"
                  :key="t.id"
                  type="button"
                  class="mk-tipo"
                  role="radio"
                  :aria-checked="est.titulares === t.id"
                  @click="est.titulares = t.id"
                >
                  <span
                    class="mk-aa mk-ftit"
                    :style="{ ...vars(t.id, 'titulares', 'tit'), textTransform: est.mayus ? 'uppercase' : 'none' }"
                  >Cámara 2MP</span>
                  <span class="mk-n">{{ t.nombre }}</span>
                </button>
              </div>
            </div>
            <label class="mk-interruptor">
              <input v-model="est.mayus" type="checkbox" /> Titulares en mayúsculas
            </label>
            <div class="mk-campo">
              <span class="mk-rotulo">Texto</span>
              <div class="mk-tipos" role="radiogroup" aria-label="Texto">
                <button
                  v-for="t in TEXTOS"
                  :key="t.id"
                  type="button"
                  class="mk-tipo"
                  role="radio"
                  :aria-checked="est.texto === t.id"
                  @click="est.texto = t.id"
                >
                  <span class="mk-aa mk-ftxt" :style="vars(t.id, 'texto', 'txt')">Retiro en sucursal</span>
                  <span class="mk-n">{{ t.nombre }}</span>
                </button>
              </div>
            </div>
          </section>
        </template>
      </div>

      <!-- Vista previa -->
      <aside class="mk-previa" aria-label="Vista previa" :style="varsPrevia">
        <div class="mk-seg" role="tablist">
          <button type="button" role="tab" :aria-selected="previa === 'tienda'" @click="previa = 'tienda'">Tienda</button>
          <button type="button" role="tab" :aria-selected="previa === 'reel'" @click="previa = 'reel'">Reel</button>
        </div>

        <div v-if="previa === 'tienda'" class="mk-marco">
          <div class="t-head" :style="{ background: C.principal }">
            <img v-if="logoTienda" :src="abs(logoTienda)" alt="Logo" />
            <b v-else :style="{ color: tinta(C.principal) }">{{ est.nombre }}</b>
            <div class="t-busca">Buscar productos</div>
          </div>
          <div class="t-cuerpo mk-ftxt">
            <div class="t-banner" :style="{ background: `linear-gradient(135deg, ${C.principal}, ${C.oscuro})` }">
              <div class="h mk-ftit" :style="mayus">Seguridad para tu casa</div>
              <div class="b">Cámaras, alarmas e instalación en San Juan</div>
              <div class="btn" :style="{ background: C.acento, color: tinta(C.acento) }">Ver ofertas</div>
            </div>
            <div class="t-cards">
              <div v-for="p in PRODUCTOS" :key="p.t" class="t-card">
                <div class="img" v-html="CAMARA"></div>
                <div class="info">
                  <div class="tit">{{ p.t }}</div>
                  <div class="pre">{{ p.p }}</div>
                  <div class="cuo">{{ p.c }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="mk-marco">
          <div class="reel-wrap">
            <div
              class="reel mk-ftxt"
              :style="{ background: `radial-gradient(120% 80% at 50% 30%, ${C.principal} 0%, ${C.oscuro} 75%)` }"
            >
              <img v-if="logoOscuro" class="r-logo" :src="abs(logoOscuro)" alt="Logo" />
              <b v-else class="r-logo r-logo-txt">{{ est.nombre }}</b>
              <div class="r-medio">
                <div class="r-foto" v-html="CAMARA"></div>
                <div class="r-tit mk-ftit" :style="mayus">Cámara IP Wifi 2MP</div>
                <div class="r-desc">Bullet · Visión nocturna · Exterior</div>
                <div
                  class="r-precio mk-ftit-fam"
                  :style="{ background: C.acento, color: tinta(C.acento) }"
                >$ 54.900</div>
              </div>
              <div class="r-ins" :style="{ background: C.oscuro }">15% OFF</div>
              <div class="r-pie">
                <div class="r-sello" :style="{ background: C.acento, color: tinta(C.acento) }">
                  Retiro en sucursal o envío en San Juan
                </div>
                <div class="r-llamado">sanjuantecnologia.com/shop</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import "@/modules/products/styles/proveedores.css";
import {
  getShopBranding,
  updateShopBranding,
  uploadShopImage,
  removeShopImage,
} from "@/modules/shop/service/admin.shopBranding.api";
import {
  getShopThemeAdminFull,
  updateShopThemeAdminFull,
} from "@/modules/shop/service/admin.shopTheme.api";
import {
  TITULARES,
  TEXTOS,
  estiloTipografia,
  GOOGLE_FONTS_MARCA,
} from "@/modules/shop/utils/tipografiasMarca";

/* ── piezas fijas ── */
const SLOTS = [
  { k: "principal", n: "Principal", fondo: "is-claro", recurso: "logo", campo: "logo_url", accept: "image/png,image/svg+xml,image/webp" },
  { k: "claro", n: "Sobre claro", fondo: "is-claro", recurso: "logo-light", campo: "logo_light_url", accept: "image/png,image/svg+xml,image/webp", usaPrincipal: true },
  { k: "oscuro", n: "Sobre oscuro", fondo: "is-oscuro", recurso: "logo-dark", campo: "logo_dark_url", accept: "image/png,image/svg+xml,image/webp", usaPrincipal: true },
  { k: "icono", n: "Ícono", fondo: "is-gris", recurso: "favicon", campo: "favicon_url", accept: "image/png,image/svg+xml,image/webp,image/x-icon,.ico" },
];
const COLORES = [
  { k: "principal", n: "Principal", campo: "primary" },
  { k: "acento", n: "Acento", campo: "accent" },
  { k: "oscuro", n: "Fondo oscuro", campo: "dark" },
];
const PRODUCTOS = [
  { t: "Cámara IP Wifi 2MP Bullet", p: "$ 54.900", c: "6 cuotas de $ 10.450" },
  { t: "Kit alarma inalámbrica 8 zonas", p: "$ 189.000", c: "6 cuotas de $ 35.990" },
];
const CAMARA =
  '<svg viewBox="0 0 120 80" width="70%" height="70%" aria-hidden="true"><rect x="18" y="26" width="70" height="30" rx="8" fill="#e8ebf0"/><circle cx="76" cy="41" r="10" fill="#1d2633"/><circle cx="76" cy="41" r="4" fill="#3b82f6"/><rect x="40" y="56" width="10" height="16" fill="#cfd5de"/><rect x="28" y="70" width="34" height="5" rx="2" fill="#cfd5de"/></svg>';

/* ── estado ── */
const cargando = ref(true);
const guardando = ref(false);
const error = ref("");
const previa = ref("tienda");

const fabrica = ref({ primary: "#0e2134", accent: "#3483fa", dark: "#0b1220", font_heading: "inter", heading_upper: false, font_body: "inter" });
const predeterminado = ref({});

function vacio() {
  return {
    nombre: "",
    logos: { principal: { url: "", file: null }, claro: { url: "", file: null }, oscuro: { url: "", file: null }, icono: { url: "", file: null } },
    colores: { principal: "", acento: "", oscuro: "" },
    titulares: "inter",
    mayus: false,
    texto: "inter",
  };
}
const est = reactive(vacio());
const guardado = ref(vacio());

// Lo que se compara para saber si hay cambios (sin los File).
function huella(e) {
  return JSON.stringify({
    nombre: e.nombre,
    logos: Object.fromEntries(Object.entries(e.logos).map(([k, v]) => [k, v.url])),
    colores: e.colores,
    titulares: e.titulares,
    mayus: e.mayus,
    texto: e.texto,
  });
}
const sucio = computed(() => !cargando.value && huella(est) !== huella(guardado.value));
const faltaNombre = computed(() => !cargando.value && !String(est.nombre || "").trim());
const puedeGuardar = computed(() => sucio.value && !faltaNombre.value && !guardando.value && !cargando.value);

/* ── url de archivos ── */
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const assetBase = (() => {
  const cut = String(base || "").replace(/\/api(\/v\d+)?$/i, "");
  return (cut || base).replace(/\/+$/, "");
})();
function abs(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  return `${assetBase}${s.startsWith("/") ? "" : "/"}${s}`;
}

/* ── color ── */
function lum(hex) {
  const v = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const valido = (h) => /^#[0-9a-f]{6}$/i.test(String(h || ""));
function contraste(a, b) {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function tinta(hex) {
  return valido(hex) && lum(hex) > 0.4 ? "#111111" : "#ffffff";
}
function chipContraste(hex) {
  if (!valido(hex)) return { cls: "", texto: "" };
  const r = contraste(hex, "#ffffff");
  if (r >= 4.5) return { cls: "is-ok", texto: `Contraste ${r.toFixed(1)}` };
  if (r >= 3) return { cls: "is-aviso", texto: `Contraste ${r.toFixed(1)}` };
  return { cls: "is-aviso", texto: `Contraste bajo ${r.toFixed(1)}` };
}
function hexCambio(k, ev) {
  let v = String(ev.target.value || "").trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (valido(v)) est.colores[k] = v.toLowerCase();
  ev.target.value = est.colores[k];
}
function esPredeterminado(campo, valor) {
  return predeterminado.value[campo] === true && String(valor).toLowerCase() === fabrica.value[campo];
}

/* ── logos ── */
const objectUrls = [];
function elegirLogo(k, ev) {
  const f = ev?.target?.files?.[0] || null;
  if (ev?.target) ev.target.value = "";
  if (!f) return;
  const u = URL.createObjectURL(f);
  objectUrls.push(u);
  est.logos[k] = { url: u, file: f };
}
function quitarLogo(k) {
  est.logos[k] = { url: "", file: null };
}

/* ── vista previa ── */
const C = computed(() => ({
  principal: valido(est.colores.principal) ? est.colores.principal : fabrica.value.primary,
  acento: valido(est.colores.acento) ? est.colores.acento : fabrica.value.accent,
  oscuro: valido(est.colores.oscuro) ? est.colores.oscuro : fabrica.value.dark,
}));
const logoOscuro = computed(() => est.logos.oscuro.url || est.logos.principal.url);
const logoTienda = computed(() =>
  lum(C.value.principal) > 0.4 ? est.logos.claro.url || est.logos.principal.url : logoOscuro.value
);
// El style.css global fuerza Inter con !important en todo: las tipografías
// viajan como variables CSS y las aplican reglas más específicas (abajo).
function vars(id, rol, pre) {
  const e = estiloTipografia(id, rol);
  return { [`--${pre}-f`]: e.fontFamily, [`--${pre}-w`]: String(e.fontWeight), [`--${pre}-st`]: e.fontStretch };
}
const varsPrevia = computed(() => ({ ...vars(est.titulares, "titulares", "tit"), ...vars(est.texto, "texto", "txt") }));
const mayus = computed(() => ({ textTransform: est.mayus ? "uppercase" : "none" }));

/* ── carga ── */
function aplicar(item, temaResp) {
  const t = temaResp?.theme || {};
  fabrica.value = { ...fabrica.value, ...(temaResp?.defaults || {}) };
  predeterminado.value = temaResp?.predeterminado || {};
  const f = fabrica.value;
  const e = vacio();
  e.nombre = item?.name || "";
  for (const s of SLOTS) e.logos[s.k] = { url: item?.[s.campo] || "", file: null };
  e.colores = {
    principal: (t.primary || f.primary).toLowerCase(),
    acento: (t.accent || t.secondary || f.accent).toLowerCase(),
    oscuro: (t.dark || f.dark).toLowerCase(),
  };
  e.titulares = t.font_heading || f.font_heading;
  e.mayus = typeof t.heading_upper === "boolean" ? t.heading_upper : f.heading_upper;
  e.texto = t.font_body || f.font_body;
  return e;
}
function copiar(e) {
  return {
    ...e,
    logos: Object.fromEntries(Object.entries(e.logos).map(([k, v]) => [k, { ...v }])),
    colores: { ...e.colores },
  };
}

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const [item, tema] = await Promise.all([getShopBranding(), getShopThemeAdminFull()]);
    const e = aplicar(item, tema);
    guardado.value = copiar(e);
    Object.assign(est, copiar(e));
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar la marca.";
  } finally {
    cargando.value = false;
  }
}

/* ── guardar ── */
// Lo que el comercio no cargó y sigue en el valor de fábrica viaja null:
// así el servicio de videos distingue "no cargado" de "cargado igual".
function valorTema(campo, valor) {
  if (predeterminado.value[campo] === true && valor === fabrica.value[campo]) return null;
  return valor;
}

async function guardar() {
  if (!puedeGuardar.value) return;
  guardando.value = true;
  error.value = "";
  try {
    // 1. Logos que cambiaron, en paralelo.
    const cambios = SLOTS.filter((s) => est.logos[s.k].url !== guardado.value.logos[s.k].url);
    const res = await Promise.allSettled(
      cambios.map(async (s) => {
        const it = est.logos[s.k].file
          ? await uploadShopImage(s.recurso, est.logos[s.k].file)
          : await removeShopImage(s.recurso);
        const url = it?.[s.campo] || "";
        guardado.value.logos[s.k] = { url, file: null };
        est.logos[s.k] = { url, file: null };
      })
    );
    const falla = res.find((r) => r.status === "rejected");
    if (falla) throw falla.reason;

    // 2. Nombre.
    const item = await updateShopBranding({ name: String(est.nombre).trim() });

    // 3. Tema.
    const tema = await updateShopThemeAdminFull({
      primary: valorTema("primary", est.colores.principal),
      accent: valorTema("accent", est.colores.acento),
      dark: valorTema("dark", est.colores.oscuro),
      font_heading: valorTema("font_heading", est.titulares),
      heading_upper: valorTema("heading_upper", est.mayus),
      font_body: valorTema("font_body", est.texto),
    });
    if (!tema) throw new Error("No se pudo guardar la marca.");

    // 4. Lo guardado pasa a ser lo actual.
    const e = aplicar(item, tema);
    guardado.value = copiar(e);
    Object.assign(est, copiar(e));
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar la marca.";
  } finally {
    guardando.value = false;
  }
}

/* ── salir con cambios ── */
onBeforeRouteLeave(() => {
  if (sucio.value && !window.confirm("Hay cambios sin guardar. ¿Salir igual?")) return false;
  return true;
});

/* ── tipografías: solo en esta vista ── */
let linkFuentes = null;
onMounted(() => {
  linkFuentes = document.createElement("link");
  linkFuentes.rel = "stylesheet";
  linkFuentes.href = GOOGLE_FONTS_MARCA;
  document.head.appendChild(linkFuentes);
  cargar();
});
onBeforeUnmount(() => {
  linkFuentes?.remove();
  objectUrls.forEach((u) => URL.revokeObjectURL(u));
});
</script>

<style scoped>
.mk {
  --mk-kit: #02498b;
  --mk-kit-2: #023a6f;
  --mk-ok: #00873f;
  --mk-aviso: #c26a00;
  --mk-mal: #d63b3b;
  --mk-pieza-2: var(--sp-hover);
  font-family: Inter, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}
.mk button, .mk input { font: inherit; color: inherit; }
.mk :focus-visible { outline: 2px solid var(--mk-kit); outline-offset: 2px; }

/* Cabecera: un solo botón */
.mk-cab { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mk-migas { font-size: 13px; color: var(--sp-suave); }
.mk-cab h1 { font-size: 24px; font-weight: 800; letter-spacing: -.015em; margin: 2px 0 0; }
.mk-estado { margin-left: auto; font-size: 12px; color: var(--sp-suave); display: flex; align-items: center; gap: 6px; }
.mk-estado i { width: 8px; height: 8px; border-radius: 50%; background: #00a650; display: inline-block; }
.mk-estado.is-sucio i { background: var(--mk-aviso); }
.mk-guardar { background: var(--mk-kit); color: #fff !important; border: 0; height: 40px; padding: 0 22px; border-radius: 10px; font-weight: 700; cursor: pointer; min-width: 120px; }
.mk-cab > div:first-child + .mk-guardar { margin-left: auto; }
.mk-guardar:hover:not(:disabled) { background: var(--mk-kit-2); }
.mk-guardar:disabled { opacity: .45; cursor: default; }

.mk-vista { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 420px); gap: 20px; align-items: start; }
.mk-editor { display: grid; gap: 16px; min-width: 0; }
.mk-bloque { background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 14px; padding: 18px; display: grid; gap: 14px; min-width: 0; }
.mk-bloque h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--sp-suave); margin: 0; }
.mk-campo { display: grid; gap: 6px; }
.mk-campo label, .mk-rotulo { font-size: 12px; font-weight: 600; color: var(--sp-suave); }
.mk-texto { height: 40px; border: 1px solid var(--sp-borde); background: var(--sp-caja); border-radius: 10px; padding: 0 12px; width: 100%; }
.mk-texto.is-error { border-color: var(--mk-mal); }
.mk-campo-error { font-size: 12px; color: var(--mk-mal); font-weight: 600; }
.mk-error { background: rgba(214, 59, 59, .1); color: var(--mk-mal); border: 1px solid rgba(214, 59, 59, .3); border-radius: 12px; padding: 10px 14px; font-weight: 600; font-size: 13px; }

/* Esqueleto */
.mk-esqueleto { min-height: 120px; }
.mk-esq-t, .mk-esq-c { display: block; border-radius: 8px; background: var(--mk-pieza-2); animation: mk-pulso 1.2s ease-in-out infinite; }
.mk-esq-t { width: 90px; height: 12px; }
.mk-esq-c { height: 64px; }
@keyframes mk-pulso { 50% { opacity: .5; } }

/* Logos */
.mk-logos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.mk-logo { display: grid; gap: 6px; }
.mk-logo-caja { position: relative; aspect-ratio: 4 / 3; border-radius: 12px; border: 1px dashed var(--sp-borde); display: grid; place-items: center; overflow: hidden; cursor: pointer; padding: 10px; max-width: 100%; }
.mk-logo-caja.is-claro { background: #ffffff; }
.mk-logo-caja.is-oscuro { background: #0b1220; }
.mk-logo-caja.is-gris { background: var(--mk-pieza-2); }
.mk-logo-caja img { max-width: 100%; max-height: 100%; object-fit: contain; }
.mk-logo-caja img.is-tenue { opacity: .35; }
.mk-logo-vacio { font-size: 11px; color: #8a94a6; text-align: center; }
.mk-logo-caja input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.mk-logo-pie { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: var(--sp-suave); gap: 6px; }
.mk-quitar { background: none; border: 0; color: var(--mk-mal) !important; font-size: 12px; cursor: pointer; padding: 0; }
.mk-chip { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: var(--mk-pieza-2); color: var(--sp-suave); white-space: nowrap; }
.mk-chip:empty { display: none; }
.mk-chip.is-ok { background: rgba(0, 166, 80, .12); color: var(--mk-ok); }
.mk-chip.is-aviso { background: rgba(194, 106, 0, .14); color: var(--mk-aviso); }

/* Colores */
.mk-colores { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.mk-color { border: 1px solid var(--sp-borde); border-radius: 12px; overflow: hidden; display: grid; }
.mk-muestra { height: 64px; position: relative; display: flex; align-items: flex-end; padding: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
.mk-muestra input[type="color"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.mk-color-pie { padding: 8px 10px; display: grid; gap: 6px; background: var(--sp-caja); }
.mk-fila { display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap; }
.mk-hex { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; border: 1px solid var(--sp-borde); background: var(--sp-caja); border-radius: 8px; height: 30px; padding: 0 8px; width: 100%; min-width: 0; text-transform: lowercase; }

/* Tipografía */
.mk-tipos { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.mk-tipo { border: 1px solid var(--sp-borde); border-radius: 12px; padding: 10px 12px; background: var(--sp-caja); cursor: pointer; text-align: left; display: grid; gap: 4px; min-width: 0; }
.mk-tipo[aria-checked="true"] { border-color: var(--mk-kit); box-shadow: 0 0 0 2px var(--mk-kit) inset; }
.mk-aa { font-size: 22px; line-height: 1.05; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mk-n { font-size: 11px; color: var(--sp-suave); font-weight: 600; }
.mk-interruptor { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; cursor: pointer; width: fit-content; }
.mk-interruptor input { width: 36px; height: 20px; appearance: none; background: var(--sp-borde); border-radius: 999px; position: relative; cursor: pointer; transition: background .15s; }
.mk-interruptor input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgba(0, 0, 0, .2); }
.mk-interruptor input:checked { background: var(--mk-kit); }
.mk-interruptor input:checked::after { transform: translateX(16px); }

/* Tipografías de la marca (ganan al Inter !important global) */
.mk .mk-ftxt, .mk .mk-ftxt * { font-family: var(--txt-f) !important; }
.mk .mk-ftxt.mk-aa { font-weight: var(--txt-w) !important; }
.mk .mk-ftit, .mk .mk-ftxt .mk-ftit { font-family: var(--tit-f) !important; font-weight: var(--tit-w) !important; font-stretch: var(--tit-st) !important; }
.mk .mk-ftxt .mk-ftit-fam { font-family: var(--tit-f) !important; font-stretch: var(--tit-st) !important; }

/* Vista previa */
.mk-previa { position: sticky; top: 16px; display: grid; gap: 10px; }
.mk-seg { display: inline-flex; background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 12px; padding: 3px; width: fit-content; }
.mk-seg button { border: 0; background: none; padding: 6px 14px; border-radius: 9px; font-weight: 600; font-size: 13px; cursor: pointer; color: var(--sp-suave); }
.mk-seg button[aria-selected="true"] { background: var(--mk-kit); color: #fff; }
.mk-marco { border-radius: 14px; overflow: hidden; border: 1px solid var(--sp-borde); background: #ebebeb; }

/* Tienda */
.t-head { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
.t-head img { height: 30px; max-width: 140px; object-fit: contain; }
.t-head b { font-size: 14px; white-space: nowrap; }
.t-busca { flex: 1; height: 32px; border-radius: 8px; background: #fff; min-width: 0; display: flex; align-items: center; padding: 0 10px; color: #8a94a6; font-size: 12px; }
.t-cuerpo { padding: 14px; display: grid; gap: 12px; color: #111; }
.t-banner { border-radius: 12px; padding: 18px; color: #fff; display: grid; gap: 6px; }
.t-banner .h { font-size: 26px; line-height: 1; }
.t-banner .b { font-size: 13px; opacity: .9; }
.t-banner .btn { justify-self: start; margin-top: 6px; border-radius: 10px; padding: 8px 14px; font-weight: 700; font-size: 13px; }
.t-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.t-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0, 0, 0, .08); }
.t-card .img { aspect-ratio: 1; background: #f4f4f4; display: grid; place-items: center; }
.t-card .info { padding: 8px 10px; display: grid; gap: 2px; }
.t-card .tit { font-size: 12.5px; line-height: 1.25; }
.t-card .pre { font-size: 18px; font-weight: 400; }
.t-card .cuo { font-size: 11px; color: #00a650; font-weight: 600; }

/* Reel 9:16 */
.reel-wrap { display: grid; place-items: center; background: #0b0f17; padding: 14px; }
.reel { width: min(100%, 300px); aspect-ratio: 9 / 16; border-radius: 12px; overflow: hidden; position: relative; color: #fff; display: grid; grid-template-rows: auto 1fr auto; padding: 18px 16px; max-width: 100%; }
.reel .r-logo { height: 26px; max-width: 130px; object-fit: contain; justify-self: center; margin-top: 18px; }
.reel .r-logo-txt { height: auto; font-size: 14px; text-align: center; }
.reel .r-medio { align-self: center; display: grid; gap: 10px; }
.reel .r-foto { background: #fff; border-radius: 12px; aspect-ratio: 4 / 3; display: grid; place-items: center; }
.reel .r-tit { font-size: 30px; line-height: .98; letter-spacing: -.5px; text-wrap: balance; }
.reel .r-desc { font-size: 11.5px; opacity: .85; }
.reel .r-precio { justify-self: start; border-radius: 10px; padding: 6px 12px; font-size: 22px; font-weight: 800; }
.reel .r-ins { position: absolute; top: 74px; left: 14px; font-size: 13px; font-weight: 900; padding: 4px 8px; border-radius: 6px; color: #fff; box-shadow: 0 0 0 1px rgba(255, 255, 255, .25); }
.reel .r-pie { display: grid; gap: 6px; justify-items: center; margin-bottom: 30px; }
.reel .r-sello { font-size: 10.5px; padding: 4px 9px; border-radius: 999px; font-weight: 600; }
.reel .r-llamado { font-size: 12px; font-weight: 700; opacity: .95; }

@media (max-width: 1080px) {
  .mk-vista { grid-template-columns: minmax(0, 1fr); }
  .mk-previa { position: static; }
}
@media (max-width: 760px) {
  .mk-logos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mk-colores { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .mk * { transition: none !important; animation: none !important; }
}
</style>

<style>
/* Modo oscuro del admin (sin scoped: el tema vive en un ancestro). */
:is(.v-theme--dark, .v-theme--adminDark) .sp.mk {
  --mk-kit: #4f8cff;
  --mk-kit-2: #3b74e0;
}
</style>
