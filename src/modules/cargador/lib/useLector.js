// src/modules/cargador/lib/useLector.js
//
// Cámara del lector del cargador, en la webapp y en la APK.
//  - APK: startScan() + evento barcodesScanned del plugin ML Kit, con la
//    cámara dibujada detrás de la vista (app/native/escaner.js).
//  - Webapp: getUserMedia + BarcodeDetector en bucle.
//  - Además, un lector de códigos por teclado (pistola USB o Bluetooth que
//    "tipea" el código y Enter) mientras la pantalla está abierta.
// Una lectura igual a la anterior se ignora durante `pausaIguales` ms: en el
// lote, apuntar dos segundos al mismo código no suma dos veces.
import { onBeforeUnmount, onMounted, ref } from "vue";
import { isCapacitor } from "@/app/utils/runtime";
import { lecturaContinua } from "@/app/native/escaner";

const FORMATOS = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "itf", "codabar"];

export function useLector({ alLeer, pausaIguales = 1500, activo = () => true } = {}) {
  const video = ref(null);
  // idle | iniciando | leyendo | sin-camara
  const estado = ref("idle");
  const linterna = ref(false);
  const puedeLinterna = ref(false);

  let ultimo = "";
  let ultimoEn = 0;
  let stream = null;
  let detector = null;
  let reloj = null;
  let cortarNativo = null;
  let vivo = true;

  function entregar(raw) {
    const c = String(raw || "").trim();
    if (!c || !vivo || !activo()) return;
    const ahora = Date.now();
    if (c === ultimo && ahora - ultimoEn < pausaIguales) return;
    ultimo = c;
    ultimoEn = ahora;
    try { navigator.vibrate?.(40); } catch { /* sin vibrador */ }
    alLeer(c);
  }

  async function iniciarWeb() {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
      estado.value = "sin-camara";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!vivo) return detener();
      if (video.value) {
        video.value.srcObject = stream;
        await video.value.play().catch(() => {});
      }
      const caps = stream.getVideoTracks()?.[0]?.getCapabilities?.() || {};
      puedeLinterna.value = !!caps.torch;
      detector = new window.BarcodeDetector({ formats: FORMATOS });
      estado.value = "leyendo";
      const ciclo = async () => {
        if (!vivo || !detector) return;
        try {
          if (video.value && video.value.readyState >= 2 && activo()) {
            const codigos = await detector.detect(video.value);
            if (codigos?.length) entregar(codigos[0].rawValue);
          }
        } catch { /* cuadro sin código */ }
        reloj = setTimeout(ciclo, 200);
      };
      ciclo();
    } catch {
      estado.value = "sin-camara";
    }
  }

  async function iniciar() {
    estado.value = "iniciando";
    if (isCapacitor()) {
      cortarNativo = await lecturaContinua(entregar);
      if (!vivo) return detener();
      if (cortarNativo) {
        estado.value = "leyendo";
        return;
      }
    }
    await iniciarWeb();
  }

  async function detener() {
    vivo = false;
    if (reloj) clearTimeout(reloj);
    reloj = null;
    detector = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (cortarNativo) await cortarNativo();
    cortarNativo = null;
  }

  async function alternarLinterna() {
    if (!stream || !puedeLinterna.value) return;
    try {
      await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: !linterna.value }] });
      linterna.value = !linterna.value;
    } catch { /* el teléfono no la deja */ }
  }

  // Pistola por teclado: caracteres seguidos y Enter. Si el foco está en un
  // campo de texto, el campo se lo queda.
  let tecleo = "";
  let tecleoEn = 0;
  function onTecla(e) {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    const ahora = Date.now();
    if (ahora - tecleoEn > 300) tecleo = "";
    tecleoEn = ahora;
    if (e.key === "Enter") {
      if (tecleo.length >= 3) entregar(tecleo);
      tecleo = "";
      return;
    }
    if (e.key && e.key.length === 1) tecleo += e.key;
  }

  /** Para volver a leer el mismo código a propósito (después de un aviso). */
  function olvidarUltimo() {
    ultimo = "";
    ultimoEn = 0;
  }

  onMounted(() => {
    window.addEventListener("keydown", onTecla);
    iniciar();
  });
  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onTecla);
    detener();
  });

  return { video, estado, linterna, puedeLinterna, alternarLinterna, olvidarUltimo, entregar };
}
