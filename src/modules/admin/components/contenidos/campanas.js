// Creador de videos por campañas (spec VIDEOS-campanas-diseno.md, frente C).
// Lógica sin pantalla: productos que propone cada campaña, plantillas de textos
// (respaldo cuando el servicio no devuelve `textos`) y el medidor de la voz.
// Las campañas habilitadas, ya agrupadas y con su chip, las manda el servicio
// en GET /recursos (`videos.campanas`); "Libre" la agrega la pantalla.

export const DUR = { portada: 2.6, itemVarios: 3, itemUno: 7, cierre: 3.4 };
export const CPS = 16; // caracteres dichos por segundo a ritmo normal, si la voz no trae `cps`
export const RITMOS = [
  { v: "pausada", t: "Pausada", velocidad: 0.9 },
  { v: "normal", t: "Normal", velocidad: 1 },
  { v: "agil", t: "Ágil", velocidad: 1.12 },
];
export const TOPE_PRODUCTOS = 6;
export const DESCUENTO_MIN = 25; // POS 360: descuento que cuenta como oferta (más los marcados como promo)
export const DIAS_NUEVO = 30; // "Nuevos": alta en el catálogo en los últimos 30 días
export const GRUPOS = [
  { k: "ahora", t: "Esta semana" },
  { k: "siempre", t: "Siempre" },
  { k: "vienen", t: "Se vienen" },
];

/* Sonido que ofrece el creador: exactamente lo que habilitó la consola en GET /recursos
   (estilos, voces y músicas), en el orden del servicio. La pantalla no agrega ni recorta:
   sólo descarta lo que no es una opción (sin id). Antes la música salía únicamente del
   estilo elegido y con tres estilos quedaban tres músicas de las 19 habilitadas. */
const esOpcion = (x) => Boolean(x) && typeof x === "object" && x.id != null && x.id !== "";
export function opcionesSonido(r) {
  const de = (l) => (Array.isArray(l) ? l.filter(esOpcion) : []);
  return { estilos: de(r?.estilos), voces: de(r?.voces), musicas: de(r?.musicas) };
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// La campaña de siempre: productos y textos a elección. No viaja al servicio.
export const LIBRE = {
  id: "libre",
  nombre: "Libre",
  grupo: "siempre",
  libre: true,
  productos: { regla: "masVendidos", n: 3 },
  textos: {
    titular: "Mirá lo que hay",
    bajada: "En {local}",
    etiqueta: "",
    vozIntro: "Mirá lo que tenemos en {local}.",
    vozItem: "{producto}, {precio}.",
    vozCierre: "Escribinos por WhatsApp.",
    llamado: "Te esperamos",
    caption: "{productos} en {local}.",
  },
};

export const pesos = (n) => (n == null ? "" : `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`);
export const seg = (n) => `${Number(n).toLocaleString("es-AR", { maximumFractionDigits: 1 })} s`;
export const descuentoDe = (p) => (Number(p?.precioAnterior) > Number(p?.precio) && Number(p?.precio) > 0 ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0);
const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const esNuevo = (p, hoy = Date.now()) => Boolean(p?.alta) && hoy - Date.parse(p.alta) <= DIAS_NUEVO * 864e5;
export const tienePlan = (p) => Boolean(p?.cuotas && Number(p.cuotas.cantidad) > 1 && Number(p.cuotas.valor) > 0);
const vendidos = (p) => Number(p?.vendidos30d) || 0;
const porVendidos = (l) => l.slice().sort((a, b) => vendidos(b) - vendidos(a));

/* ── Medidor: lo que dura una línea dicha ── */
// Los precios se dicen largos ("once mil quinientos pesos"): cuentan más que sus cifras.
export const dicho = (t) => String(t || "")
  .replace(/\$\s?[\d.]+/g, (m) => "x".repeat(m.replace(/\D/g, "").length * 3 + 6))
  .replace(/\d+/g, (m) => "x".repeat(m.length * 3));
export const durVoz = (t, { cps = CPS, ritmo = "normal" } = {}) => {
  const r = RITMOS.find((x) => x.v === ritmo)?.velocidad ?? 1;
  return dicho(t).length / ((Number(cps) || CPS) * r);
};
export const durEscena = (tipo, cuantos) => (tipo === "portada" ? DUR.portada : tipo === "cierre" ? DUR.cierre : cuantos === 1 ? DUR.itemUno : DUR.itemVarios);

/* ── Coincidencia con un pedido o una categoría ── */
// "cercos eléctricos" tiene que encontrar "CERCO ELECTRICO 1000 MTS": sin tildes ni
// mayúsculas, palabra por palabra y singular o plural (2026-10-25: con el filtro
// entero contra el texto, "cercos electrico" no coincidía con nada y la campaña
// mostraba los más vendidos). Las palabras de relleno del pedido no cuentan.
const RELLENO = new Set(["de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o", "en", "con", "para", "por", "a", "al",
  "promo", "promos", "promocion", "oferta", "ofertas", "campana", "video", "videos", "reel", "esta", "este", "semana", "mes", "hoy", "finde",
  "puse", "quiero", "hace", "hacer", "armar", "todo", "todos", "toda", "todas", "nuevo", "nuevos", "nueva", "nuevas"]);
const raiz = (w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
export const palabrasDe = (t) => normalizar(t).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !RELLENO.has(w)).map(raiz);
// Una palabra del pedido coincide con una del producto si una empieza como la otra
// ("electric" con "electrico", "camar" con "camara").
const pegan = (a, b) => a.startsWith(b) || b.startsWith(a);
const textoDe = (p) => palabrasDe(`${p?.categoria || ""} ${p?.titulo || p?.nombre || ""}`);
/** Cuántas palabras del pedido tiene el producto (0 = no tiene nada que ver). */
export function puntaje(pedido, p) {
  const del = textoDe(p);
  return palabrasDe(pedido).filter((w) => del.some((x) => pegan(w, x))).length;
}
const partesDe = (filtro) => String(filtro || "").split(/[,;]|\by\b/).map(palabrasDe).filter((ws) => ws.length);
const tituloDe = (p) => palabrasDe(p?.titulo || p?.nombre || "");
/**
 * El filtro de una campaña de categoría ("cámaras, alarmas"): coincide alguna de sus
 * partes, con todas sus palabras entre categoría y nombre, o con la primera (la que
 * nombra el producto) en el nombre. Así "CERCO PERIMETRAL" toma el "ENERGIZADOR DE
 * CERCO", que el catálogo tiene en ALARMAS DOMICILIARIAS (2026-10-25).
 */
export function coincideFiltro(filtro, p) {
  const del = textoDe(p);
  const tit = tituloDe(p);
  return partesDe(filtro).some((ws) => ws.every((w) => del.some((x) => pegan(w, x))) || tit.some((x) => pegan(ws[0], x)));
}
/** Cuántas palabras del filtro tiene el NOMBRE del producto (la categoría sola no suma). */
function enNombre(filtro, p) {
  const tit = tituloDe(p);
  return Math.max(0, ...partesDe(filtro).map((ws) => ws.filter((w) => tit.some((x) => pegan(w, x))).length));
}
/**
 * Los del filtro, en orden: primero los que lo dicen en el nombre (el producto en
 * sí), después los que sólo comparten la categoría (accesorios); dentro de cada
 * grupo, los más vendidos y, a igual venta, los de mayor precio.
 */
export function ordenarPorFiltro(filtro, lista) {
  return lista
    .filter((p) => coincideFiltro(filtro, p))
    // Basta con que el nombre lo diga: contar palabras ponía primero el cartel
    // "PELIGRO (cerco electrico)" antes que el energizador.
    .map((p) => ({ p, n: enNombre(filtro, p) > 0 ? 1 : 0 }))
    .sort((a, b) => b.n - a.n || vendidos(b.p) - vendidos(a.p) || (Number(b.p.precio) || 0) - (Number(a.p.precio) || 0))
    .map((x) => x.p);
}

/** Las palabras que nombran productos en un pedido ("PUSE CERCOS ELECTRICOS" → "cercos electricos"). */
export function filtroDePedido(pedido) {
  return normalizar(pedido).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !RELLENO.has(w)).join(" ");
}

/* ── Productos que propone cada campaña ── */
// filtro: "sug" (la regla de la campaña), "vend", "off", "nue", "cuo".
export function propuestos(c, catalogo, { filtro = "sug", promoIds = new Set(), hoy = Date.now() } = {}) {
  const ps = catalogo.slice();
  const off = (l) => l.filter((p) => descuentoDe(p) > 0).sort((a, b) => descuentoDe(b) - descuentoDe(a));
  const promo = (l) => l.filter((p) => promoIds.has(String(p.id))).sort((a, b) => descuentoDe(b) - descuentoDe(a));
  const nue = (l) => l.filter((p) => esNuevo(p, hoy)).sort((a, b) => Date.parse(b.alta) - Date.parse(a.alta));
  const cuo = (l) => l.filter(tienePlan).sort((a, b) => b.precio - a.precio);
  const primero = (arriba) => { const ids = new Set(arriba.map((p) => p.id)); return [...arriba, ...porVendidos(ps.filter((p) => !ids.has(p.id)))]; };
  if (filtro === "vend") return porVendidos(ps);
  // Los que eligió el local para la campaña (productos.ids), en su orden y primero. Un id
  // que ya no está en el stock se saltea.
  const elegidos = (c?.productos?.ids || []).map((id) => ps.find((p) => String(p.id) === String(id))).filter(Boolean);
  if (filtro === "sug" && elegidos.length) return primero(elegidos);
  if (filtro === "off") return off(ps);
  if (filtro === "nue") return nue(ps);
  if (filtro === "cuo") return cuo(ps);
  const r = c?.productos?.regla;
  if (r === "descuento") {
    // POS 360: los marcados como promo y los de 25 % o más primero (spec §6 de los hallazgos).
    const fuertes = [...promo(ps), ...off(ps).filter((p) => descuentoDe(p) >= DESCUENTO_MIN)];
    const vistos = new Set();
    return primero([...fuertes, ...off(ps)].filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id))));
  }
  if (r === "promo") return primero([...promo(ps), ...off(ps)].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i));
  if (r === "nuevos") return primero(nue(ps));
  if (r === "conCuotas") return primero(cuo(ps));
  if (r === "categoria") {
    // Sólo los de la categoría: completar con los más vendidos mezclaba productos que
    // no tienen nada que ver con la campaña ("Cercos eléctricos" con un cargador).
    return ordenarPorFiltro(c.productos.filtro, ps);
  }
  return porVendidos(ps);
}
// "Sugeridos" del selector suma los marcados como promo (POS 360).
export function sugeridos(c, catalogo, opts = {}) {
  const l = propuestos(c, catalogo, opts);
  const promo = catalogo.filter((p) => opts.promoIds?.has(String(p.id)));
  const ids = new Set();
  return [...l.slice(0, 12), ...promo, ...l.slice(12)].filter((p) => (ids.has(p.id) ? false : ids.add(p.id)));
}

/* ── Plantillas (respaldo local, mismas reglas que el servicio, spec §1.3) ── */
const PIDE_CUOTAS = /\{(cuotas|valorCuota)\}/;
const fechaLarga = (iso) => { const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`); return `${d.getDate()} de ${MESES[d.getMonth()]}`; };
export function llenar(t, x) {
  return String(t || "")
    .replace(/\{(\w+)\}/g, (_, k) => (x[k] == null ? "" : x[k]))
    .replace(/Antes\s*,\s*ahora/g, "Ahora")
    .replace(/\.\s*Antes\s*\./g, ".")
    .replace(/\s+([.,:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
export function contexto(c, prods, fuente, hoy = new Date()) {
  const cats = {};
  let top = "";
  for (const p of prods) { if (!p.categoria) continue; cats[p.categoria] = (cats[p.categoria] || 0) + 1; if (!top || cats[p.categoria] > cats[top]) top = p.categoria; }
  const conPlan = prods.find(tienePlan);
  const whatsapp = (fuente?.redes || []).find((r) => r.red === "whatsapp")?.texto || fuente?.textos?.contacto || "";
  return {
    local: fuente?.marca?.nombre || "",
    dia: DIAS[hoy.getDay()],
    fecha: c?.proxima ? fechaLarga(c.proxima) : "",
    hasta: c?.hasta ? fechaLarga(c.hasta) : "",
    categoria: String(top || "").toLowerCase(),
    offMax: Math.max(0, ...prods.map(descuentoDe)) || null,
    cuotas: conPlan ? conPlan.cuotas.cantidad : null,
    n: prods.length,
    productos: prods.map((p) => p.titulo).join(", "),
    precio: prods[0] ? pesos(prods[0].precio) : "",
    whatsapp,
  };
}
export function contextoItem(base, p) {
  return {
    ...base,
    producto: p.titulo,
    precio: pesos(p.precio),
    antes: descuentoDe(p) ? pesos(p.precioAnterior) : "",
    off: descuentoDe(p) || null,
    caracteristica: String(p.descripcion || "").split(/\s*·\s*|\.\s+/)[0] || "",
    // Cuotas sólo con plan vigente del producto: nunca se inventan.
    cuotas: tienePlan(p) ? p.cuotas.cantidad : null,
    valorCuota: tienePlan(p) ? pesos(p.cuotas.valor) : null,
    stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : null,
  };
}
// Una plantilla que pide un dato que no hay (cuotas sin plan, descuento sin precio anterior) no se usa.
const faltaDato = (t, x) => [...String(t || "").matchAll(/\{(\w+)\}/g)].some(([, k]) => x[k] == null || x[k] === "");
export function etiquetaDe(c, x) {
  let t = c.textos?.etiqueta || "";
  if (PIDE_CUOTAS.test(t) && x.cuotas == null) t = x.off ? "{off} % OFF" : "";
  if (faltaDato(t, x)) t = x.off ? "{off} % OFF" : "";
  return llenar(t, x).slice(0, 24);
}
export function variantesItem(c, x) {
  const v = [c.textos?.vozItem, "{producto}. Antes {antes}, ahora {precio}.", "{producto}: {cuotas} cuotas de {valorCuota}.", "{producto}, {precio}.", "{producto}."];
  return v.filter((t) => t && !faltaDato(t, x)).map((t) => llenar(t, x)).filter((t, i, a) => t && a.indexOf(t) === i);
}
export const primeraQueEntra = (l, d, medir) => { for (let i = 0; i < l.length; i++) if (medir(l[i]) <= d) return i; return Math.max(0, l.length - 1); };
export function variantesPortada(c, base, titular, bajada) {
  const t = c.textos || {};
  return [llenar(t.vozIntro, base), [titular, bajada].filter(Boolean).join(". ") + ".", base.local ? `En ${base.local}: ${String(titular).toLowerCase()}.` : ""]
    .concat(titular ? [`${titular}.`] : [])
    .filter((x, i, a) => x && x !== "." && a.indexOf(x) === i);
}
export function variantesCierre(c, base, llamado) {
  const t = c.textos || {};
  return [llenar(t.vozCierre, base), `${llamado}. Escribinos al WhatsApp.`, base.local ? `Te esperamos en ${base.local}.` : "", llamado ? `${llamado}.` : ""]
    .filter((x, i, a) => x && a.indexOf(x) === i);
}
// Los textos de toda la campaña con las plantillas (respaldo de POST /guion).
export function textosLocales(c, prods, fuente, medir, hoy = new Date()) {
  const base = contexto(c, prods, fuente, hoy);
  const t = c.textos || {};
  const titular = llenar(faltaDato(t.titular, base) ? c.nombre : t.titular, base).slice(0, 40);
  const bajada = llenar(faltaDato(t.bajada, base) ? "" : t.bajada, base).slice(0, 60);
  const llamado = llenar(t.llamado, base).slice(0, 30);
  const d = durEscena("item", prods.length);
  // Cada línea entra en su escena: la primera variante que entra, de la más rica a la más corta.
  const entra = (l, dur) => l[primeraQueEntra(l, dur, medir)] || "";
  return {
    origen: "local",
    apertura: { titular, bajada, voz: entra(variantesPortada(c, base, titular, bajada), DUR.portada) },
    escenas: prods.map((p) => {
      const x = contextoItem(base, p);
      const vs = variantesItem(c, x);
      return { id: p.id, etiqueta: etiquetaDe(c, x), voz: vs[primeraQueEntra(vs, d, medir)] || "" };
    }),
    cierre: { llamado, voz: entra(variantesCierre(c, base, llamado), DUR.cierre) },
    publicacion: llenar(faltaDato(t.caption, base) ? "{productos} en {local}." : t.caption, base),
    titulo: `${c.nombre}${base.fecha ? ` · ${base.fecha}` : ""}`,
  };
}
