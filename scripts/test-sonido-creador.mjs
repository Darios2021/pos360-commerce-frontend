// Prueba: el creador de videos por campañas ofrece TODO lo que habilita la consola.
// Dado un GET /recursos con N músicas, voces y estilos, el creador expone los N
// (ni lista fija, ni recorte por estilo o campaña). Correr: npm run test:sonido
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { opcionesSonido } from "../src/modules/admin/components/contenidos/campanas.js";

const MUSICAS = ["pulso", "calma", "urbano", "phonk", "funk", "cumbia", "epica", "reggaeton", "cuarteto", "chacarera",
  "house", "deep", "synthwave", "trap", "afrobeat", "acustica", "jazz", "corporativa", "festiva"];
const VOCES = ["melanie", "valentina", "tomas", "lucia", "mateo"];
const ESTILOS = ["dinamico", "clasico", "tranquilo", "uno-sin-animacion"];

const recursos = {
  activo: true,
  musicas: MUSICAS.map((id, i) => ({ id, nombre: id, tipo: "musica", muestra: `/m/${id}.mp3`, porDefecto: i === 0 })),
  voces: VOCES.map((id) => ({ id, nombre: id, muestra: `/v/${id}.mp3` })),
  // Un estilo sin `animacion` también es una opción habilitada: no se descarta.
  estilos: ESTILOS.map((id) => ({ id, nombre: id, musica: id === "tranquilo" ? "calma" : "pulso", ...(id.startsWith("uno") ? {} : { animacion: { nombre: id } }) })),
  campanas: [{ id: "servicio-tecnico", estilo: "tranquilo", musica: "calma" }],
};

let fallas = 0;
const prueba = (nombre, fn) => {
  try { fn(); console.log(`ok   ${nombre}`); } catch (e) { fallas++; console.error(`FALLA ${nombre}\n     ${e.message}`); }
};

const ids = (l) => l.map((x) => x.id);
const o = opcionesSonido(recursos);

prueba(`expone las ${MUSICAS.length} músicas, en el orden del servicio`, () => assert.deepEqual(ids(o.musicas), MUSICAS));
prueba(`expone las ${VOCES.length} voces`, () => assert.deepEqual(ids(o.voces), VOCES));
prueba(`expone los ${ESTILOS.length} estilos`, () => assert.deepEqual(ids(o.estilos), ESTILOS));
prueba("con cualquier N (1..40) expone los N", () => {
  for (const n of [1, 2, 3, 7, 19, 40]) {
    const l = Array.from({ length: n }, (_, i) => ({ id: `x${i}` }));
    const r = opcionesSonido({ musicas: l, voces: l, estilos: l });
    assert.equal(r.musicas.length, n); assert.equal(r.voces.length, n); assert.equal(r.estilos.length, n);
  }
});
prueba("no inventa: sin recursos, listas vacías", () => {
  assert.deepEqual(opcionesSonido(null), { estilos: [], voces: [], musicas: [] });
  assert.deepEqual(opcionesSonido({}), { estilos: [], voces: [], musicas: [] });
});
prueba("sólo descarta lo que no es una opción (sin id)", () => {
  const r = opcionesSonido({ musicas: [{ id: "a" }, null, "b", { nombre: "sin id" }, { id: "c" }] });
  assert.deepEqual(ids(r.musicas), ["a", "c"]);
});
prueba("devuelve los mismos objetos (con su muestra para el ▶)", () => {
  assert.equal(o.musicas[1], recursos.musicas[1]);
  assert.ok(o.musicas.every((m) => m.muestra));
});

// La pantalla: cada lista del sonido sale de opcionesSonido y se recorre entera.
const vue = readFileSync(fileURLToPath(new URL("../src/modules/admin/components/contenidos/CreadorCampanas.vue", import.meta.url)), "utf8");
prueba("CreadorCampanas toma estilos, voces y músicas de opcionesSonido(recursos)", () => {
  assert.match(vue, /opcionesSonido\(props\.recursos\)/);
  for (const k of ["estilos", "voces", "musicas"]) assert.match(vue, new RegExp(`const ${k} = computed\\(\\(\\) => sonido\\.value\\.${k}\\)`));
});
prueba("CreadorCampanas recorre las listas completas (v-for sin recorte)", () => {
  assert.match(vue, /v-for="m in musicas"/);
  assert.match(vue, /v-for="v in voces"/);
  assert.match(vue, /v-for="s in estilos"/);
  assert.doesNotMatch(vue, /(musicas|voces|estilos)(\.value)?\.(slice|filter)\(/);
  assert.doesNotMatch(vue, /recursos\.(musicas|voces|estilos)/);
});
prueba("cada música tiene su ▶ y se puede elegir", () => {
  assert.match(vue, /@click="elegirMusica\(m\.id\)"/);
  assert.match(vue, /@click="oir\(`mus:\$\{m\.id\}`, m\.muestra\)"/);
});

if (fallas) { console.error(`\n${fallas} prueba(s) fallaron`); process.exit(1); }
console.log("\nTodas las pruebas pasaron");
