// src/modules/asistente/lib/leerStream.js
/**
 * LECTURA DEL STREAM DEL ASISTENTE (text/event-stream), sin Vue.
 *
 * Mostrador manda los eventos `herramienta`, `bloque`, `fin` y `error`, y un
 * latido `: ping` cada 15 s. Los pedazos que llegan por la red no respetan los
 * límites de un evento: se junta hasta la línea en blanco que lo cierra.
 *
 * Copia de `sazonik/features/asistente/bloques/leerStream.ts` (Zondito), pasada a JS.
 */

/** Separa un texto acumulado en eventos completos ({ evento, datos }); devuelve también lo que sobra. */
export function partir(buffer) {
  const eventos = [];
  const t = buffer.replace(/\r\n?/g, "\n");
  const piezas = t.split("\n\n");
  const resto = piezas.pop() ?? "";
  for (const pieza of piezas) {
    let evento = "message";
    const datos = [];
    for (const linea of pieza.split("\n")) {
      if (!linea || linea.startsWith(":")) continue; // latido o comentario
      const i = linea.indexOf(":");
      const campo = i < 0 ? linea : linea.slice(0, i);
      const val = i < 0 ? "" : linea.slice(i + 1).replace(/^ /, "");
      if (campo === "event") evento = val;
      else if (campo === "data") datos.push(val);
    }
    if (!datos.length) continue;
    const crudo = datos.join("\n");
    let json;
    try { json = JSON.parse(crudo); } catch { json = crudo; }
    eventos.push({ evento, datos: json });
  }
  return { eventos, resto };
}

/** Recorre el cuerpo de una respuesta SSE evento por evento. */
export async function* leerEventos(cuerpo) {
  const lector = cuerpo.getReader();
  const dec = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await lector.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const { eventos, resto } = partir(buffer);
      buffer = resto;
      for (const e of eventos) yield e;
    }
    buffer += dec.decode();
    const { eventos } = partir(buffer + "\n\n");
    for (const e of eventos) yield e;
  } finally {
    lector.releaseLock();
  }
}
