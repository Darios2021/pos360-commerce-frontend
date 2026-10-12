// src/app/native/impresoraBluetooth.js
//
// Puente con el plugin propio de la APK que le habla a la termica por
// Bluetooth (android/.../ImpresoraBluetoothPlugin.java). El ticket lo arma
// pos/utils/escpos.js, igual que para la PC del mostrador: aca solo cambia
// el camino por el que llega a la impresora.
//
// Solo lista impresoras ya emparejadas en Ajustes de Android > Bluetooth.

import { registerPlugin } from "@capacitor/core";
import { isCapacitor } from "@/app/utils/runtime";

const Plugin = registerPlugin("ImpresoraBluetooth");

export function hayBluetooth() {
  return isCapacitor();
}

/** [{ nombre, direccion }] de las impresoras emparejadas. Tira error con texto para el usuario. */
export async function emparejadas() {
  const { impresoras } = await Plugin.emparejadas();
  return Array.isArray(impresoras) ? impresoras : [];
}

function base64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Manda los bytes ESC/POS. Devuelve true si la impresora los recibio. */
export async function imprimirBytes(direccion, bytes) {
  if (!isCapacitor() || !direccion) return false;
  try {
    const r = await Plugin.imprimir({ direccion, datos: base64(bytes) });
    return !!r?.ok;
  } catch {
    return false;
  }
}
