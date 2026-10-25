// src/modules/service/utils/whatsapp.js
//
// Abre el link wa.me que arma la API. Devuelve el link si el navegador bloqueo
// la pestaña (pasa cuando se abre despues de esperar a la API), para mostrarlo
// como boton; null si se abrio.
//
// Sin "noopener" en las opciones: con esa opcion window.open devuelve null
// siempre y no se distingue de un bloqueo. El opener se corta a mano.
export function abrirWhatsapp(link) {
  const ventana = window.open(link, "_blank");
  if (ventana) {
    ventana.opener = null;
    return null;
  }
  return link;
}
