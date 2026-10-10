// src/modules/pos/composables/useTeclasModal.js
//
// Teclado de una ventana del POS mientras está abierta: escucha en window
// (fase capture, como la barra) y le pasa la tecla al manejador. El
// manejador devuelve true si la usó; en ese caso se corta para que no la
// procese nadie más (ni la barra ni el campo enfocado).
//
// `enCampo` avisa si el foco está en un campo de texto: los dígitos y las
// letras son del campo, salvo que la ventana decida otra cosa.
import { onBeforeUnmount, watch } from "vue";

export function enCampo(e) {
  const t = e?.target;
  const tag = String(t?.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable === true;
}

export function useTeclasModal(abierto, manejador) {
  function onKey(e) {
    if (!abierto.value || e.repeat && e.key === "Enter") return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (manejador(e) === true) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  watch(
    abierto,
    (v) => {
      if (v) window.addEventListener("keydown", onKey, { capture: true });
      else window.removeEventListener("keydown", onKey, { capture: true });
    },
    { immediate: true }
  );
  onBeforeUnmount(() => window.removeEventListener("keydown", onKey, { capture: true }));
}
