// src/modules/cargador/lib/useLector.js
//
// Cámara del lector del cargador, en la webapp y en la APK.
//  - APK: startScan() + evento barcodesScanned del plugin ML Kit, con la
//    cámara dibujada detrás de la vista (app/native/escaner.js). Pide el
//    permiso de cámara; si se niega, estado "sin-permiso" (la pantalla ofrece
//    abrir los ajustes y al volver se reintenta). Se corta al pasar a segundo
//    plano y vuelve al regresar.
//    Plan B si startScan() falla en el teléfono: scan(), la pantalla propia
//    de Google, en bucle (estado "google"; al cancelarla, "pausa").
//  - Webapp: getUserMedia + BarcodeDetector en bucle.
//  - Además, un lector de códigos por teclado (pistola USB o Bluetooth que
//    "tipea" el código y Enter) mientras la pantalla está abierta.
// Una lectura igual a la anterior se ignora durante `pausaIguales` ms: en el
// lote, apuntar dos segundos al mismo código no suma dos veces.
import { onBeforeUnmount, onMounted, ref } from "vue";
import { isCapacitor } from "@/app/utils/runtime";
import { lecturaContinua, abrirAjustes, disponible, escanear, linternaNativa, hayLinternaNativa } from "@/app/native/escaner";

const FORMATOS = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "itf", "codabar"];

export function useLector({ alLeer, pausaIguales = 1500, activo = () => true } = {}) {
  const video = ref(null);
  // idle | iniciando | leyendo | sin-camara | sin-permiso | google | pausa
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
  let enGoogle = false;

  function entregar(raw, { siempre = false } = {}) {
    const c = String(raw || "").trim();
    if (!c || !vivo || !activo()) return;
    const ahora = Date.now();
    // La cámara ve el mismo código muchas veces por segundo; la pistola no:
    // cada Enter es una lectura a propósito.
    if (!siempre && c === ultimo && ahora - ultimoEn < pausaIguales) return;
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
      const r = await lecturaContinua(entregar);
      if (r?.cortar) {
        cortarNativo = r.cortar;
        if (!vivo) return detener();
        estado.value = "leyendo";
        puedeLinterna.value = await hayLinternaNativa();
        return;
      }
      if (!vivo) return;
      if (r?.motivo === "sin-permiso") {
        estado.value = "sin-permiso";
        return;
      }
      // Plan B: el escáner de Google (no usa el permiso de la app).
      if (await disponible()) return bucleGoogle();
    }
    await iniciarWeb();
  }

  async function bucleGoogle() {
    if (enGoogle) return;
    enGoogle = true;
    estado.value = "google";
    try {
      while (vivo) {
        let c = null;
        try { c = await escanear(); } catch { c = null; }
        if (!vivo) break;
        if (!c) { estado.value = "pausa"; break; }
        entregar(c, { siempre: true });
        // Espera a que la pantalla termine con la lectura (aviso, búsqueda).
        while (vivo && !activo()) await new Promise((ok) => setTimeout(ok, 200));
      }
    } finally {
      enGoogle = false;
    }
  }

  /** Vuelve a abrir el escáner de Google después de cancelarlo. */
  function reanudar() {
    if (vivo && !enGoogle) bucleGoogle();
  }

  async function permitir() {
    await abrirAjustes();
  }

  // Solo la cámara: el componente sigue montado.
  async function soltarNativo() {
    const c = cortarNativo;
    cortarNativo = null;
    linterna.value = false;
    if (c) await c();
  }

  async function detener() {
    vivo = false;
    if (reloj) clearTimeout(reloj);
    reloj = null;
    detector = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    await soltarNativo();
  }

  // Segundo plano: se suelta la cámara nativa; al volver se retoma (también
  // después de dar el permiso en los ajustes). El escáner de Google tapa la
  // app con su pantalla y eso también la manda a segundo plano: ahí no se toca.
  let pausadoNativo = false;
  async function alSegundoPlano() {
    if (!vivo || enGoogle) return;
    if (cortarNativo) {
      pausadoNativo = true;
      await soltarNativo();
    }
  }
  function alFrente() {
    if (!vivo || enGoogle) return;
    if (pausadoNativo || estado.value === "sin-permiso") {
      pausadoNativo = false;
      iniciar();
    }
  }
  function alCambiarVisibilidad() {
    if (document.hidden) alSegundoPlano();
    else alFrente();
  }

  async function alternarLinterna() {
    if (cortarNativo) {
      if (await linternaNativa(!linterna.value)) linterna.value = !linterna.value;
      return;
    }
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
      if (tecleo.length >= 3) entregar(tecleo, { siempre: true });
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
    if (isCapacitor()) {
      document.addEventListener("visibilitychange", alCambiarVisibilidad);
      // Capacitor avisa también con estos eventos de document.
      document.addEventListener("pause", alSegundoPlano);
      document.addEventListener("resume", alFrente);
    }
    iniciar();
  });
  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onTecla);
    document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    document.removeEventListener("pause", alSegundoPlano);
    document.removeEventListener("resume", alFrente);
    detener();
  });

  return { video, estado, linterna, puedeLinterna, alternarLinterna, olvidarUltimo, entregar, reanudar, permitir };
}
