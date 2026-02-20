// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/printLabel.js
//
// FIX: imprime con estilos reales (copia <style> y <link rel="stylesheet"> del documento actual)
// y fuerza tamaño @page en mm.
// Nota: al imprimir en impresora normal, igual tenés que elegir el "Tamaño de papel" correcto
// en "Más ajustes" (A4 vs tamaño personalizado). Para PDF suele respetar mejor @page.

export async function printLabelElement(el, opts = {}) {
  const wMm = Number(opts.wMm || 100);
  const hMm = Number(opts.hMm || 60);
  const title = String(opts.title || "Etiqueta");

  if (!el) throw new Error("printLabelElement: elemento inválido.");

  // ✅ Copia estilos actuales (Vuetify + scoped SFC + etc.)
  const stylesHtml = collectDocumentStyles();

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>

  ${stylesHtml}

  <style>
    /* ✅ Tamaño real del papel */
    @page { size: ${wMm}mm ${hMm}mm; margin: 0; }

    html, body {
      width: ${wMm}mm;
      height: ${hMm}mm;
      margin: 0;
      padding: 0;
      background: #fff;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ✅ Contenedor exacto */
    .sheet {
      width: ${wMm}mm;
      height: ${hMm}mm;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      overflow: hidden;
    }

    /* ✅ Reset mínimo para evitar “cosas raras” */
    * { box-sizing: border-box; }
    img { max-width: 100%; }

    /* ✅ Evitar breaks */
    .no-break { page-break-inside: avoid; break-inside: avoid; }

    /* ✅ IMPORTANTE: por si el elemento traía transforms del preview */
    .print-root { transform: none !important; }
  </style>
</head>
<body>
  <div class="sheet no-break">
    <div class="print-root">${el.outerHTML}</div>
  </div>

  <script>
    (async function(){
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const imgs = Array.from(document.images || []);
        await Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload=r; i.onerror=r; })));
      } catch(e){}

      // pequeño delay para que a Chrome le de tiempo a aplicar CSS
      setTimeout(() => { window.focus(); window.print(); }, 120);

      // cerrar suave (si molesta lo sacamos)
      setTimeout(() => { try { window.close(); } catch(e){} }, 1400);
    })();
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) throw new Error("Bloqueo de popups: permití ventanas emergentes para imprimir.");

  w.document.open();
  w.document.write(html);
  w.document.close();
}

function collectDocumentStyles() {
  // ✅ Incluye styles inline + links CSS (vuetify / fonts / etc)
  const nodes = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"));

  // Si tenés CSP o links cross-origin, algunos pueden fallar igual.
  // Pero en tu caso Vite + Vuetify local normalmente OK.
  return nodes
    .map((n) => {
      // Evitar duplicar algunos prints que Chrome mete
      const html = n.outerHTML || "";
      return html;
    })
    .join("\n");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}