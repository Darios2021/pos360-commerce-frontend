// src/app/native/huella.js
//
// INGRESO CON HUELLA AL BACKOFFICE (solo en la APK).
//
// La sesion del backoffice ya queda guardada en el telefono (Mantener sesion).
// La huella no reemplaza la contrasena: es un cerrojo. Si esta activa, al
// abrir la app se pide la huella (o el PIN del telefono) antes de mostrar
// nada; "Usar contraseña" cierra la sesion y vuelve al ingreso.
//
// Se activa en el ingreso ("Entrar con huella la próxima vez") y se apaga en
// Impresión y teléfono. El aviso de huella del shop es otro (utils/tokenStorage.js).
//
// Reusa el helper del shop sobre @aparajita/capacitor-biometric-auth.

import { isCapacitor } from "@/app/utils/runtime";
import { checkBiometricAvailability, authenticateBiometric } from "@/app/utils/biometric";

const CLAVE = "pos360.huella";

export async function huellaDisponible() {
  if (!isCapacitor()) return false;
  const r = await checkBiometricAvailability();
  return !!r.available;
}

export function huellaActiva() {
  try { return localStorage.getItem(CLAVE) === "1"; } catch { return false; }
}

export function activarHuella(si) {
  try {
    if (si) localStorage.setItem(CLAVE, "1");
    else localStorage.removeItem(CLAVE);
  } catch { /* sin almacenamiento: queda apagada */ }
}

export function pedirHuella() {
  return authenticateBiometric({
    title: "POS 360",
    reason: "Entrar con huella",
  });
}
