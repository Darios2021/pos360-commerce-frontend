// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/printA4FromLabelElement.js
//
// (Creá este archivo si aún no existe)

export async function printA4FromLabelElement(labelEl, opts = {}) {
  const size = String(opts.size || "100"); // "100" | "58"
  const copies = Math.max(1, Number(opts.copies || 8));
  const title = String(opts.title || "Etiquetas A4");

  if (!labelEl) throw new Error("printA4FromLabelElement: labelEl inválido.");

  const pageW = 210;
  const pageH = 297;

  const layout =
    size === "58"
      ? { cols: 3, rows: 6, cellW: 58, cellH: 40, gapX: 4, gapY: 4 }
      : { cols: 2, rows: 4, cellW: 100, cellH: 60, gapX: 5, gapY: 5 };

  const capacity = layout.cols * layout.rows;
  const pagesCount = Math.ceil(copies / capacity);

  const stylesHtml = collectDocumentStyles();

  let pagesHtml = "";
  for (let p = 0; p < pagesCount; p++) {
    const start = p * capacity;
    const end = Math.min(start + capacity, copies);

    pagesHtml += renderPage(labelEl.outerHTML, {
      ...layout,
      pageW,
      pageH,
      count: end - start,
      capacity,
    });
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>

  ${stylesHtml}

  <style>
    @page { size: A4; margin: 0; }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    * { box-sizing: border-box; }
    img { max-width: 100%; }

    .page {
      width: ${pageW}mm;
      height: ${pageH}mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; break-after: auto; }

    .grid {
      width: ${pageW}mm;
      height: ${pageH}mm;
      display: grid;
      align-content: start;
      justify-content: start;
    }

    .cell {
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }

    .label-wrap {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      transform: none !important;
    }
  </style>
</head>
<body>
  ${pagesHtml}

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
  if (!w) throw new Error("Popup bloqueado. Permití ventanas emergentes para imprimir.");

  w.document.open();
  w.document.write(html);
  w.document.close();
}

function renderPage(labelOuterHtml, cfg) {
  const gridW = cfg.cols * cfg.cellW + (cfg.cols - 1) * cfg.gapX;
  const gridH = cfg.rows * cfg.cellH + (cfg.rows - 1) * cfg.gapY;
  const marginLeft = (cfg.pageW - gridW) / 2;
  const marginTop = (cfg.pageH - gridH) / 2;

  let cells = "";
  for (let i = 0; i < cfg.capacity; i++) {
    if (i < cfg.count) {
      cells += `<div class="cell"><div class="label-wrap">${labelOuterHtml}</div></div>`;
    } else {
      cells += `<div class="cell"></div>`;
    }
  }

  return `
  <div class="page">
    <div class="grid" style="
      padding-left:${marginLeft}mm;
      padding-top:${marginTop}mm;
      grid-template-columns: repeat(${cfg.cols}, ${cfg.cellW}mm);
      grid-template-rows: repeat(${cfg.rows}, ${cfg.cellH}mm);
      column-gap:${cfg.gapX}mm;
      row-gap:${cfg.gapY}mm;
    ">
      ${cells}
    </div>
  </div>`;
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