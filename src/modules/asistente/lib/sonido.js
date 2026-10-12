// src/modules/asistente/lib/sonido.js
/**
 * LOS SONIDOS DEL ASISTENTE.
 *
 * Una respuesta del asistente la está esperando quien preguntó, que tiene la
 * pantalla delante: es suave, corta y no se repite.
 *
 *   envio      una nota sola, baja y breve: "salió la pregunta".
 *   respuesta  dos notas que suben: "llegó". Suena una vez, al cerrar la
 *              respuesta, no por bloque. Ni en error ni en tope (ya se ven).
 *
 * Las recetas y el silencio por usuario son los de Zondito
 * (`sazonik/features/asistente/bloques/sonido.ts`). POS 360 no tiene motor de
 * sonidos de la app, así que el motor está acá: un oscilador seno con WebAudio,
 * sin archivos. El AudioContext se crea o despierta dentro del gesto de enviar
 * (`despertar`), si no el navegador lo deja mudo.
 */

const SOL = 783.99, DO_ALTO = 1046.5, MI = 659.25;
/** Pico de volumen; `vol` de cada nota es relativo a esto. */
const PICO = 0.25;

/** Notas: { hz, en (s), dura (s), vol }. */
export const RECETAS = {
  envio: [{ hz: MI, en: 0, dura: 0.07, vol: 0.3 }],
  respuesta: [
    { hz: SOL, en: 0, dura: 0.09, vol: 0.4 },
    { hz: DO_ALTO, en: 0.08, dura: 0.16, vol: 0.35 },
  ],
};

/** El silencio del asistente es de cada persona, no del aparato: se guarda por usuario. */
export const claveSilencio = (usuario) => `asistente_silencio:${usuario ?? "anonimo"}`;

export function leerSilencio(usuario, almacen) {
  try { return almacen?.getItem(claveSilencio(usuario)) === "1"; } catch { return false; }
}

export function guardarSilencio(usuario, silencio, almacen) {
  try {
    if (silencio) almacen?.setItem(claveSilencio(usuario), "1");
    else almacen?.removeItem(claveSilencio(usuario));
  } catch { /* modo privado del navegador */ }
}

/** Si un turno termina con sonido de respuesta: sólo con respuesta de verdad. */
export const suenaAlCerrar = (estado) => estado === "listo";

// ── Motor ──

let ctx = null;

/** Crea o despierta el contexto de audio. Llamarlo en el gesto (click, Enter). */
export function despertar() {
  try {
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Toca una receta: subida de 15 ms y caída exponencial hasta casi cero. */
export function tocar(nombre) {
  const c = ctx || despertar();
  const notas = RECETAS[nombre];
  if (!c || !notas) return;
  try {
    const t0 = c.currentTime + 0.01;
    for (const n of notas) {
      const osc = c.createOscillator();
      const gan = c.createGain();
      const ini = t0 + n.en;
      const fin = ini + n.dura;
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.hz, ini);
      gan.gain.setValueAtTime(0.0001, ini);
      gan.gain.linearRampToValueAtTime(PICO * (n.vol ?? 1), ini + 0.015);
      gan.gain.exponentialRampToValueAtTime(0.001, fin);
      osc.connect(gan).connect(c.destination);
      osc.start(ini);
      osc.stop(fin + 0.02);
    }
  } catch { /* sin audio: la pantalla sigue igual */ }
}
