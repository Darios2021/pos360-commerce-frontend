// src/modules/asistente/lib/dibujo.js
/**
 * EL DIBUJO DE LAS RESPUESTAS DEL ASISTENTE, sin Vue.
 *
 * Los bloques tipados los define mostrador (`productos/mostrador/src/bloques.js`):
 * el contrato es de él, no de este sistema. Acá están las cuentas para
 * dibujarlos (escala de barras, geometría de la dona, montos cortos, pares de
 * gráficos, el pie) y los respaldos para cuando el servicio todavía no manda
 * bloques, etiquetas ni sugerencias.
 *
 * Copia de `sazonik/features/asistente/bloques/dibujo.ts` (Zondito), pasada a JS.
 * Lo único propio de POS 360: ETIQUETAS (suma arqueo y márgenes) y SUGERIDAS
 * (roles de la MATRIZ de la API: super_admin, admin, cajero).
 * Especificación: orchestrator/despachos/ZONDITO-asistente-diseno.md, frente C.
 *
 * Tipos de bloque (versión 1): titulo, texto, filas, columnas, dona, tabla, lista, aviso.
 * Unidad: 'ars' | 'u' | '%'.
 */

/** La versión del contrato que este cliente sabe dibujar. Una mayor se pinta como texto. */
export const VERSION = 1;

// ── Números ──

export const fmt = (n) => Math.round(n).toLocaleString("es-AR");
export const pesos = (n) => `$ ${fmt(n)}`;

export function valor(n, unidad = "u") {
  if (unidad === "ars") return pesos(n);
  if (unidad === "%") return `${fmt(n)} %`;
  return fmt(n);
}

/** Cifra corta para encima de una columna: `$ 141 k`, `$ 1,2 M`. */
export function corto(n, unidad = "ars") {
  if (unidad !== "ars") return valor(n, unidad);
  if (Math.abs(n) >= 1e6) return `$ ${(n / 1e6).toFixed(1).replace(".", ",")} M`;
  if (Math.abs(n) >= 1e3) return `$ ${Math.round(n / 1000)} k`;
  return pesos(n);
}

// ── Escalas ──

/** Ancho de una barra en %, con piso de 4 % sólo si hay algo que dibujar. */
export function anchoBarra(v, max) {
  if (!(max > 0) || !(v > 0)) return 0;
  return Math.max(4, (v / max) * 100);
}

/** Alto de una columna en px sobre un máximo de 118 (de 170 del gráfico, el resto es cifra y etiqueta). */
export const ALTO_COLUMNA = 118;
export function altoColumna(v, max) {
  if (!(max > 0) || !(v > 0)) return 0;
  return Math.max(4, (v / max) * ALTO_COLUMNA);
}

// ── Dona ──

export const DONA = { R: 48, ARO: 15, SEPARACION: 2.5, TOPE: 5 };
export const COLORES_DONA = ["var(--gx-p1)", "var(--gx-p2)", "var(--gx-p3)", "var(--gx-p4)", "var(--gx-gris)"];

/**
 * Gajos de la dona: como mucho 5 (lo que sobra suma en "Otros", por si el
 * servicio no lo recortó), cada uno con su trazo y su corrimiento sobre el aro.
 */
export function gajos(items) {
  let lista = items.filter((i) => i.valor > 0);
  if (lista.length > DONA.TOPE) {
    const resto = lista.slice(DONA.TOPE - 1).reduce((a, i) => a + i.valor, 0);
    lista = [...lista.slice(0, DONA.TOPE - 1), { etiqueta: "Otros", valor: resto }];
  }
  const total = lista.reduce((a, i) => a + i.valor, 0);
  const C = 2 * Math.PI * DONA.R;
  let acum = 0;
  const res = lista.map((i, k) => {
    const largo = total ? (i.valor / total) * C : 0;
    const g = {
      etiqueta: i.etiqueta, valor: i.valor,
      porcentaje: total ? Math.round((i.valor / total) * 100) : 0,
      color: COLORES_DONA[k],
      trazo: `${Math.max(0.5, largo - DONA.SEPARACION)} ${C}`,
      desplazamiento: -acum,
    };
    acum += largo;
    return g;
  });
  return { total, gajos: res };
}

// ── La pieza de respuesta ──

export const esGrafico = (b) => b.tipo === "filas" || b.tipo === "columnas" || b.tipo === "dona";

/**
 * Cómo se acomoda cada bloque en la grilla de dos columnas: los gráficos van de a
 * dos; uno sin pareja toma el ancho; el resto, siempre el ancho entero.
 */
export function emparejar(bloques) {
  return bloques.map((b, i) => {
    if (!esGrafico(b)) return "ancho";
    const antes = i > 0 && esGrafico(bloques[i - 1]);
    const despues = i < bloques.length - 1 && esGrafico(bloques[i + 1]);
    return antes || despues ? "par" : "ancho";
  });
}

/** "ventas, más vendidos y stock" */
export function enumerar(partes) {
  const p = partes.filter(Boolean);
  if (p.length <= 1) return p[0] || "";
  return `${p.slice(0, -1).join(", ")} y ${p[p.length - 1]}`;
}

/** Hora de San Juan, HH:MM. */
export function horaSanJuan(d = new Date()) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/San_Juan", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

// ── Respaldos mientras el servicio no manda lo nuevo ──

/**
 * Etiqueta de cada herramienta. Con el stream, la manda mostrador en cada
 * evento; esto es para el camino JSON, que sólo trae los nombres.
 */
export const ETIQUETAS = {
  estado_caja: "caja abierta", ventas: "ventas", cajas: "cierres", arqueo_de_caja: "arqueo",
  mas_vendidos: "más vendidos", margenes: "márgenes", stock: "stock",
};
export const etiquetaDe = (nombre) => ETIQUETAS[nombre] || String(nombre).replace(/_/g, " ");

/** Sin repetidos, en el orden en que se consultaron. */
export function etiquetasUnicas(nombres) {
  return [...new Set(nombres.map(etiquetaDe))];
}

/** Las preguntas de §B1 por rol; las reemplaza `estado.sugeridas` cuando el servicio las mande. */
const SUG = (pregunta, ...fuentes) => ({ pregunta, fuentes });
const DUENO = [
  SUG("¿Qué conviene para vender más?", "ventas", "mas_vendidos", "stock"),
  SUG("¿Cómo viene la caja abierta?", "estado_caja"),
  SUG("¿Cuánto se vendió hoy y con qué medios?", "ventas"),
  SUG("¿Qué cierres de la semana tuvieron diferencia?", "cajas"),
  SUG("¿Qué fue lo más vendido en 30 días?", "mas_vendidos"),
  SUG("¿Qué margen dejaron las ventas del mes?", "margenes"),
];
export const SUGERIDAS = {
  super_admin: DUENO,
  admin: DUENO,
  cajero: [
    SUG("¿Cómo viene la caja abierta?", "estado_caja"),
    SUG("¿Cuánto se vendió hoy y con qué medios?", "ventas"),
    SUG("¿Qué productos están sin stock?", "stock"),
  ],
};

/** Primer día del mes que viene, 'AAAA-MM-DD' (de San Juan). */
export function renuevaPorDefecto(d = new Date()) {
  const [a, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/San_Juan", year: "numeric", month: "2-digit" })
    .format(d).split("-").map(Number);
  const sig = m === 12 ? [a + 1, 1] : [a, m + 1];
  return `${sig[0]}-${String(sig[1]).padStart(2, "0")}-01`;
}
/** 'AAAA-MM-DD' → 'DD/MM' */
export const diaMes = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : iso);

/** Topes que cortan hasta fin de mes. Los de conversación abren una nueva. */
export const TOPES_DEL_MES = ["usd_comercio", "tokens_comercio", "usd_global", "tokens_global"];
export const TOPES_DE_CONVERSACION = ["turnos_conversacion", "tokens_conversacion"];

// ── Validación del lado del cliente ──

const str = (x) => typeof x === "string" && x.length > 0;
const num = (x) => typeof x === "number" && Number.isFinite(x);
const UNIDADES = ["ars", "u", "%"];
const fuentes = (f) => [].concat(f ?? []).filter(str);

/**
 * El servicio ya valida; esto sólo evita que un bloque mal formado rompa la
 * pantalla. Un tipo desconocido o roto devuelve null y no se pinta.
 */
export function normalizar(x) {
  if (!x || typeof x !== "object") return null;
  switch (x.tipo) {
    case "titulo":
      return str(x.texto) ? { tipo: "titulo", texto: x.texto, alcance: str(x.alcance) ? x.alcance : undefined } : null;
    case "texto":
      return str(x.texto) ? { tipo: "texto", texto: x.texto, fuente: fuentes(x.fuente) } : null;
    case "filas":
    case "columnas":
    case "dona": {
      if (!str(x.titulo) || !Array.isArray(x.items)) return null;
      const items = x.items.filter((i) => i && str(i.etiqueta) && num(i.valor));
      if (!items.length) return null;
      const unidad = UNIDADES.includes(x.unidad) ? x.unidad : "u";
      const base = { titulo: x.titulo, alcance: str(x.alcance) ? x.alcance : undefined, unidad, fuente: fuentes(x.fuente) };
      if (x.tipo === "filas") {
        return {
          tipo: "filas", ...base,
          items: items.slice(0, 8).map((i) => ({
            etiqueta: i.etiqueta, valor: i.valor,
            detalle_valor: num(i.detalle_valor) ? i.detalle_valor : undefined,
            detalle_unidad: UNIDADES.includes(i.detalle_unidad) ? i.detalle_unidad : undefined,
          })),
        };
      }
      if (x.tipo === "columnas") {
        return {
          tipo: "columnas", ...base, items: items.slice(0, 12).map((i) => ({ etiqueta: i.etiqueta, valor: i.valor })),
          destacar: Array.isArray(x.destacar) ? x.destacar.filter(Number.isInteger) : undefined,
        };
      }
      return { tipo: "dona", ...base, items: items.map((i) => ({ etiqueta: i.etiqueta, valor: i.valor })) };
    }
    case "tabla": {
      if (!Array.isArray(x.columnas) || !Array.isArray(x.filas)) return null;
      const columnas = x.columnas.filter(str).slice(0, 4);
      const filas = x.filas.filter(Array.isArray).slice(0, 6)
        .map((f) => f.slice(0, columnas.length).map((c) => (num(c) ? c : String(c ?? ""))));
      return columnas.length && filas.length ? { tipo: "tabla", fuente: fuentes(x.fuente), columnas, filas } : null;
    }
    case "lista": {
      const items = Array.isArray(x.items) ? x.items.filter((i) => i && str(i.titulo)).slice(0, 5)
        .map((i) => ({ titulo: i.titulo, detalle: str(i.detalle) ? i.detalle : "" })) : [];
      return items.length ? { tipo: "lista", titulo: str(x.titulo) ? x.titulo : undefined, fuente: fuentes(x.fuente), items } : null;
    }
    case "aviso":
      return str(x.texto) && ["info", "atencion", "problema"].includes(x.nivel)
        ? { tipo: "aviso", nivel: x.nivel, texto: x.texto, fuente: fuentes(x.fuente) } : null;
    default:
      return null;
  }
}

/**
 * Los bloques de una respuesta JSON. Sin `bloques` (el servicio de hoy) o con una
 * versión que este cliente no conoce, el texto plano en un solo bloque.
 */
export function bloquesDeRespuesta(j) {
  if (Array.isArray(j.bloques) && (j.version ?? 1) <= VERSION) {
    const b = j.bloques.map(normalizar).filter(Boolean);
    if (b.length) return b;
  }
  return str(j.texto) ? [{ tipo: "texto", texto: j.texto }] : [];
}
