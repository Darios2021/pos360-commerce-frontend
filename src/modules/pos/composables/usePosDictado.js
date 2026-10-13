// Dictado por voz para el buscador del POS (2026-10-13).
//
// Usa la Web Speech API del navegador: sin claves ni costo por uso. El audio
// lo procesa el navegador; este codigo no lo envia ni lo guarda en ningun
// servicio propio. Mismo patron que useDictado de Alade (es-AR, parciales,
// sin abrir un getUserMedia propio porque en Android le quita el microfono al
// reconocimiento), con estas diferencias:
//   · se corta solo: al resultado final, tras 1,2 s de silencio, a los 8 s o
//     si en 5 s no se detecto voz; el boton nunca queda rojo colgado;
//   · el comando "borrar" limpia el campo y corta el dictado;
//   · se descartan cantidades dichas al principio ("dos coca cola"): el
//     buscador no agrega al carrito, asi que solo se busca el producto;
//   · estados claros: inactivo, escuchando, error (con mensaje en español).
//
// El reconocedor se resuelve al tocar el boton, no al cargar el modulo, para
// poder inyectar uno falso en las pruebas.
import { ref, onBeforeUnmount } from "vue";

const NUMEROS = new Set([
  "un", "uno", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete",
  "ocho", "nueve", "diez", "doce", "veinte",
]);

const MENSAJES = {
  "not-allowed": "El micrófono está bloqueado. Habilitalo en los permisos del navegador para este sitio.",
  "service-not-allowed": "El micrófono está bloqueado. Habilitalo en los permisos del navegador para este sitio.",
  "no-speech": "No se escuchó nada. Tocá el micrófono y hablá de nuevo.",
  "audio-capture": "No se encontró un micrófono en este equipo.",
  network: "El dictado necesita conexión a internet.",
  "language-not-supported": "El navegador no soporta dictado en español.",
};

function resolverReconocedor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function normalizar(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,;:!?¿¡]/g, "")
    .trim();
}

/** "dos coca cola" => "coca cola". Solo si despues del numero hay mas texto. */
export function limpiarDictado(texto) {
  const t = String(texto || "").replace(/\s+/g, " ").trim();
  const partes = t.split(" ");
  if (partes.length > 1 && NUMEROS.has(normalizar(partes[0]))) return partes.slice(1).join(" ");
  return t;
}

/** El comando de voz que limpia el buscador. */
export function esComandoBorrar(texto) {
  const n = normalizar(texto);
  return n === "borrar" || n === "borra" || n === "borrar todo";
}

// Tiempos del corte automatico (v2, 2026-10-13: "a veces queda abierto").
export const SILENCIO_MS = 1200; // tras el ultimo resultado
export const TOPE_MS = 8000; // maximo de una escucha
export const SIN_VOZ_MS = 5000; // si nunca se detecto voz

/**
 * alTexto(texto): parciales mientras se habla (solo mostrar, no buscar).
 * alTerminar(texto): una sola vez al cerrar la escucha, con el texto final.
 * alBorrar(): comando de voz "borrar".
 */
export function usePosDictado({ alTexto, alTerminar, alBorrar } = {}) {
  const soportado = !!resolverReconocedor();
  const escuchando = ref(false);
  const error = ref("");
  let reconocedor = null;
  let finales = "";
  let parcial = "";
  let huboVoz = false;
  let borrado = false;
  let tSilencio = null;
  let tTope = null;
  let tSinVoz = null;

  function limpiarTimers() {
    clearTimeout(tSilencio);
    clearTimeout(tTope);
    clearTimeout(tSinVoz);
    tSilencio = tTope = tSinVoz = null;
  }

  function cortar() {
    try { reconocedor?.stop(); } catch { /* ya estaba cortado */ }
  }

  // Cierre unico: el boton vuelve a reposo pase lo que pase (onend, error,
  // corte del navegador o nuestros timers) y se entrega el texto una vez.
  function cerrar() {
    limpiarTimers();
    const estaba = escuchando.value;
    escuchando.value = false;
    if (!estaba) return;
    if (borrado) return;
    const texto = limpiarDictado(`${finales} ${parcial}`.replace(/\s+/g, " ").trim());
    if (texto) alTerminar?.(texto);
    else if (!huboVoz && !error.value) error.value = "No se escuchó nada. Tocá el micrófono y hablá de nuevo.";
  }

  function alternar() {
    if (!resolverReconocedor()) {
      error.value = "Este navegador no permite buscar por voz. Probá con Chrome o Edge.";
      return;
    }
    if (escuchando.value) { cortar(); return; }

    error.value = "";
    finales = "";
    parcial = "";
    huboVoz = false;
    borrado = false;
    try {
      const Reconocedor = resolverReconocedor();
      reconocedor = new Reconocedor();
      reconocedor.lang = "es-AR";
      reconocedor.continuous = true;
      reconocedor.interimResults = true;
      reconocedor.maxAlternatives = 1;

      reconocedor.onresult = (ev) => {
        huboVoz = true;
        clearTimeout(tSinVoz);
        let hayFinal = false;
        parcial = "";
        for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
          const r = ev.results[i];
          if (r.isFinal) {
            const dicho = r[0].transcript;
            if (esComandoBorrar(dicho)) {
              finales = "";
              borrado = true;
              alBorrar?.();
              cortar();
              return;
            }
            finales += `${finales ? " " : ""}${dicho.trim()}`;
            hayFinal = true;
          } else {
            parcial += r[0].transcript;
          }
        }
        if (esComandoBorrar(parcial)) return;
        const texto = limpiarDictado(`${finales} ${parcial}`.trim());
        if (texto) alTexto?.(texto);
        // Resultado final: se corta. Si solo hay parciales, corta el silencio.
        if (hayFinal) { cortar(); return; }
        clearTimeout(tSilencio);
        tSilencio = setTimeout(cortar, SILENCIO_MS);
      };
      reconocedor.onspeechend = () => cortar();
      reconocedor.onend = cerrar;
      reconocedor.onerror = (ev) => {
        const codigo = ev?.error || "desconocido";
        if (codigo === "aborted") return;
        error.value = MENSAJES[codigo] || `No se pudo usar el dictado (${codigo}).`;
        cerrar();
      };
      reconocedor.start();
      escuchando.value = true;
      tTope = setTimeout(cortar, TOPE_MS);
      tSinVoz = setTimeout(cortar, SIN_VOZ_MS);
    } catch (e) {
      error.value = "No se pudo iniciar el dictado. Probá de nuevo.";
      limpiarTimers();
      escuchando.value = false;
    }
  }

  function limpiarError() { error.value = ""; }

  onBeforeUnmount(() => { limpiarTimers(); try { reconocedor?.abort?.(); } catch { /* nada que cortar */ } });

  return { soportado, escuchando, error, alternar, limpiarError, detener: cortar };
}
