// src/modules/cargador/lib/aviso.js
// Aviso breve de las pantallas del teléfono (el mismo estado que MovilAviso).
import { useSnackbar } from "@/modules/pos/composables/useSnackbar";

export function avisar(texto) {
  useSnackbar().toast(texto, { timeout: 2400 });
}
