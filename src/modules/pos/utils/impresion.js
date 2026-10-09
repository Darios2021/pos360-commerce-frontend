// src/modules/pos/utils/impresion.js
//
// IMPRESION DIRECTA DEL TICKET EN LA TERMICA DEL MOSTRADOR.
//
// Por defecto el ticket sale por el cuadro de impresion de Chrome, y el cajero
// tiene que elegir impresora y confirmar cada vez. En modo "directa" el ticket
// se arma como texto ESC/POS (utils/escpos.js) y lo entrega el programa local
// de la PC (public/shop/app/impresora): sale derecho, sin cuadro. Si el
// programa no contesta, se imprime por el navegador como antes: el cajero
// nunca se queda sin ticket.
//
// Los ajustes se guardan en ESTA computadora: cada mostrador tiene su
// impresora. Se cambian en Punto de Venta › Impresion, con un ticket de prueba.
// Mecanica tomada de Sazonik (utils/impresion.ts).

import { ticketEscPos } from "./escpos";

const CLAVE = "pos360.impresion";
export const AJUSTES_DE_FABRICA = { modo: "navegador", anchoPapel: 80 };

export function leerAjustesImpresion() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (!g) return { ...AJUSTES_DE_FABRICA };
    return {
      modo: g.modo === "directa" ? "directa" : "navegador",
      anchoPapel: Number(g.anchoPapel) === 58 ? 58 : 80,
    };
  } catch {
    return { ...AJUSTES_DE_FABRICA };
  }
}

export function guardarAjustesImpresion(a) {
  try { localStorage.setItem(CLAVE, JSON.stringify(a)); } catch { /* modo privado: queda de fabrica */ }
}

/** El programa local (pos360-impresora.ps1). Solo escucha en esta PC. */
export const PROGRAMA_LOCAL = "http://127.0.0.1:17891";
/** Se pega una vez en PowerShell, en la PC que tiene la termica. */
export const COMANDO_INSTALAR =
  "irm https://sanjuantecnologia.com/shop/app/impresora/instalar.ps1 | iex";

async function pedirAlPrograma(ruta, init = {}, ms = 2500) {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ms);
  try {
    const r = await fetch(PROGRAMA_LOCAL + ruta, { ...init, signal: corte.signal, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(reloj);
  }
}

/** Si el programa local responde, la impresora en la que imprime; si no, null. */
export async function estadoProgramaLocal() {
  try {
    const e = await pedirAlPrograma("/estado");
    return e?.ok ? { impresora: e.impresora || "", version: e.version || "" } : null;
  } catch {
    return null;
  }
}

function base64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Manda el ticket al programa local. Devuelve true si la impresora lo recibio. */
async function imprimirDirecto(datos, a) {
  try {
    // text/plain: es un pedido "simple" y el navegador no necesita consultar antes.
    const r = await pedirAlPrograma("/imprimir", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: base64(ticketEscPos(datos, a.anchoPapel)),
    }, 6000);
    return !!r?.ok;
  } catch {
    return false;
  }
}

/**
 * Imprime el ticket. En modo directo va como texto a la termica; si el
 * programa local no responde, o en modo navegador, corre `porElNavegador`.
 * Devuelve por donde salio: 'directa' quiere decir que la impresora ya lo
 * recibio, y la pantalla tiene que decirlo, porque no se abre ningun cuadro.
 *
 * `datos` = { sale, companyName, branchName }.
 */
export async function imprimirTicket(datos, porElNavegador) {
  const a = leerAjustesImpresion();
  if (a.modo === "directa" && await imprimirDirecto(datos, a)) return "directa";
  porElNavegador?.();
  return "navegador";
}
