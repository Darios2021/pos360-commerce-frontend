// src/modules/cargador/lib/etiquetas.js
//
// Etiquetas por la térmica Bluetooth de la APK (la misma que imprime el
// ticket: Punto de Venta › Impresión). ESC/POS: el producto con su precio y
// código de barras CODE128; la derivación con su número en QR.
import { aPC437, columnasDe, partir } from "@/modules/pos/utils/escpos";
import { leerAjustesImpresion } from "@/modules/pos/utils/impresion";
import { imprimirBytes } from "@/app/native/impresoraBluetooth";
import { pesos, precioDe } from "./formato";

const ESC = 0x1b, GS = 0x1d, LF = 0x0a;

function texto(b, t, { centro = true, negrita = false, doble = false } = {}) {
  b.push(ESC, 0x61, centro ? 1 : 0, ESC, 0x45, negrita ? 1 : 0, GS, 0x21, doble ? 0x11 : 0);
  b.push(...aPC437(t), LF);
}

function code128(b, dato) {
  const d = aPC437("{B" + String(dato).slice(0, 40));
  b.push(ESC, 0x61, 1, GS, 0x68, 70, GS, 0x77, 2, GS, 0x48, 2, GS, 0x6b, 73, d.length, ...d, LF);
}

function qr(b, dato) {
  const d = aPC437(String(dato));
  const largo = d.length + 3;
  b.push(ESC, 0x61, 1);
  b.push(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00); // modelo 2
  b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, 8); // tamaño del módulo
  b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31); // corrección M
  b.push(GS, 0x28, 0x6b, largo & 0xff, largo >> 8, 0x31, 0x50, 0x30, ...d);
  b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30, LF);
}

function cerrar(b) {
  b.push(ESC, 0x45, 0, GS, 0x21, 0, ESC, 0x61, 0, ESC, 0x64, 4);
  return Uint8Array.from(b);
}

export function etiquetaProducto(p, anchoPapel = 58) {
  const b = [ESC, 0x40, ESC, 0x74, 0];
  for (const r of partir(String(p?.name || "Producto"), columnasDe(anchoPapel)).slice(0, 2)) texto(b, r, { negrita: true });
  texto(b, pesos(precioDe(p)), { negrita: true, doble: true });
  const cod = p?.barcode || p?.sku || p?.code;
  if (cod) {
    code128(b, cod);
    texto(b, String(cod));
  }
  return cerrar(b);
}

export function etiquetaDerivacion(t, anchoPapel = 58) {
  const b = [ESC, 0x40, ESC, 0x74, 0];
  const origen = t?.fromWarehouse?.branch?.name || "";
  const destino = t?.toWarehouse?.branch?.name || t?.toBranch?.name || "";
  qr(b, t?.number || "");
  texto(b, String(t?.number || ""), { negrita: true });
  if (origen || destino) for (const r of partir(`${origen} > ${destino}`, columnasDe(anchoPapel))) texto(b, r);
  return cerrar(b);
}

/** 'ok', 'sin-impresora' o 'fallo'. */
export async function imprimirEtiqueta(armar) {
  const a = leerAjustesImpresion();
  if (!a.bluetooth?.direccion) return "sin-impresora";
  const ok = await imprimirBytes(a.bluetooth.direccion, armar(a.anchoPapel));
  return ok ? "ok" : "fallo";
}

export const textoImpresion = { ok: "Etiqueta enviada a la impresora", "sin-impresora": "Sin impresora elegida", fallo: "La impresora no respondió" };
