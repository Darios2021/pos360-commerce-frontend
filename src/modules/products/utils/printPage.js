// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/printPage.js
//
// Imprime un nodo DOM completo como página A4 (o el tamaño que indiques)
// copiando estilos del documento actual (Vuetify + SFC scoped).
//
// Uso:
//   import { printPageElement } from "@/modules/products/utils/printPage";
//   await printPageElement(el, { wMm: 210, hMm: 297, title: "Etiquetas A4" });

export async function printPageElement(el, opts = {}) {
  const wMm = Number(opts.wMm || 210);
  const hMm = Number(opts.hMm || 297);
  const title = String(opts.title || "Imprimir");

  if (!el) throw new Error("printPageElement: elemento inválido.");

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
      overflow: visible;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    * { box-sizing: border-box; }
    img { max-width: 100%; }

    /* ✅ Permitir páginas múltiples con cortes limpios */
    .page { width: ${wMm}mm; height: ${hMm}mm; page-break-after: always; break-after: page; }
    .page:last-child { page-break-after: auto; break-after: auto; }

    /* Evitar cortes internos dentro de celdas */
    .no-break { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body>
  ${el.outerHTML}

  <script>
    (async function(){
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const imgs = Array.from(document.images || []);
        await Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload=r; i.onerror=r; })));
      } catch(e){}
      setTimeout(() => { window.focus(); window.print(); }, 140);
      setTimeout(() => { try { window.close(); } catch(e){} }, 1500);
    })();
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=980,height=740");
  if (!w) throw new Error("Bloqueo de popups: permití ventanas emergentes para imprimir.");

  w.document.open();
  w.document.write(html);
  w.document.close();
}

function collectDocumentStyles() {
  const nodes = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"));
  return nodes.map((n) => n.outerHTML || "").join("\n");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}