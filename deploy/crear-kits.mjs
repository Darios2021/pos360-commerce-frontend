// Alta de los kits de seguridad como productos reales (is_kit=1) en pos360.
//
// Uso:  POS_USER=<usuario> POS_PASS=<clave> node crear-kits.mjs [--dry]
//
// - Precio: suma de sus componentes. NO inventa un descuento de kit; si se
//   quiere un ahorro real, se baja el price_discount del kit despues.
// - track_stock: 0. El kit no tiene stock propio (asi lo dice el modelo) y
//   la disponibilidad por componentes no esta implementada.
// - Idempotente por nombre: si el kit ya existe, no lo duplica.

import { readFileSync } from "node:fs";

const BASE = "https://sanjuantecnologia.com/api/v1";
const CATEGORIA = 11;          // SEGURIDAD ELECTRONICA
const BRANCHES = [1, 3];       // Casa Central + Rivadavia
const DRY = process.argv.includes("--dry");

const USER = process.env.POS_USER;
const PASS = process.env.POS_PASS;
if (!USER || !PASS) { console.error("faltan POS_USER / POS_PASS"); process.exit(1); }

const kitsSrc = readFileSync(
  "/home/artemis/Escritorio/Repos/productos/asd2a12/pos360-commerce-frontend/src/modules/shop/data/kits.seguridad.js",
  "utf8"
);

// Parseo del archivo de definiciones para no duplicar la fuente de verdad.
const KITS = [];
for (const bloque of kitsSrc.split(/\n  \{\n    id: "/).slice(1)) {
  const id = bloque.split('"')[0];
  const nombre = (bloque.match(/nombre:\s*"([^"]+)"/) || [])[1];
  const resumen = (bloque.match(/resumen:\s*\n?\s*"([\s\S]*?)",\n/) || [])[1]?.replace(/\s+/g, " ").trim();
  const comps = [...bloque.matchAll(/\{ product_id: (\d+), qty: (\d+),/g)]
    .map((m) => ({ component_id: Number(m[1]), qty: Number(m[2]) }));
  if (id && nombre && comps.length) KITS.push({ id, nombre, resumen, comps });
}
console.log(`definiciones leidas: ${KITS.length}`);

const j = async (path, opts = {}) => {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  const txt = await r.text();
  let body; try { body = JSON.parse(txt); } catch { body = txt; }
  return { status: r.status, body };
};

// 1) login
const log = await j("/auth/login", {
  method: "POST",
  body: JSON.stringify({ identifier: USER, password: PASS }),
});
if (log.status !== 200 || !log.body?.token) {
  console.error("login fallo:", log.status, log.body?.message || log.body);
  process.exit(1);
}
const TOKEN = log.body.token;
const auth = { authorization: `Bearer ${TOKEN}` };
console.log("login OK");

// 2) precios de los componentes, del catalogo publico
const cat = await j(`/public/catalog?branch_id=3&category_id=${CATEGORIA}&include_children=1&in_stock=0&limit=200`);
const idx = {};
for (const p of cat.body?.items || []) idx[Number(p.product_id)] = p;
const precio = (p) => {
  const n = (v) => Number(v) || 0;
  return { lista: n(p?.price_list) || n(p?.price), desc: n(p?.price_discount) || n(p?.price_list) || n(p?.price) };
};

// 3) que ya existe, para no duplicar
const yaHay = await j(`/public/catalog?branch_id=3&category_id=${CATEGORIA}&include_children=1&in_stock=0&limit=200`);
const nombresExistentes = new Set((yaHay.body?.items || []).map((p) => String(p.name || "").trim().toUpperCase()));

for (const k of KITS) {
  if (nombresExistentes.has(k.nombre.trim().toUpperCase())) {
    console.log(`SALTEADO (ya existe): ${k.nombre}`);
    continue;
  }
  const faltan = k.comps.filter((c) => !idx[c.component_id]);
  if (faltan.length) {
    console.log(`SALTEADO (faltan componentes ${faltan.map((f) => f.component_id)}): ${k.nombre}`);
    continue;
  }
  let lista = 0, desc = 0;
  for (const c of k.comps) {
    const pp = precio(idx[c.component_id]);
    lista += pp.lista * c.qty;
    desc  += pp.desc  * c.qty;
  }

  const payload = {
    name: k.nombre,
    description: k.resumen || "",
    category_id: CATEGORIA,
    is_kit: true,
    is_active: true,
    track_stock: false,
    price_list: Number(lista.toFixed(2)),
    price_discount: Number(desc.toFixed(2)),
    branch_id: 3,
    branch_ids: BRANCHES,
    kit_items: k.comps.map((c, i) => ({ ...c, sort_order: i })),
  };

  if (DRY) {
    console.log(`[dry] ${k.nombre}  lista=${payload.price_list}  desc=${payload.price_discount}  items=${k.comps.length}`);
    continue;
  }

  const r = await j("/products", { method: "POST", headers: auth, body: JSON.stringify(payload) });
  if (r.status >= 200 && r.status < 300) {
    const pid = r.body?.item?.id || r.body?.data?.id || r.body?.id;
    console.log(`CREADO id=${pid}  ${k.nombre}  $${payload.price_discount}`);
  } else {
    console.error(`ERROR ${r.status} en ${k.nombre}:`, JSON.stringify(r.body).slice(0, 400));
  }
}
