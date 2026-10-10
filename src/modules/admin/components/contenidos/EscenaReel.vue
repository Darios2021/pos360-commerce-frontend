<!-- Una escena del reel tal como la dibuja la composición "revista" del servicio
     de contenidos: portada con el logo sobre el color de la marca, producto sobre
     el azul con la ficha en papel, y cierre con sucursales y redes. Todo en em:
     el ancho define el tamaño (270 px = 10 px de letra). -->
<template>
  <div class="er" :style="{ width: `${ancho}px`, height: `${(ancho * 16) / 9}px`, fontSize: `${ancho / 27}px`, '--er-pri': primario, '--er-osc': oscuro, '--er-ace': acento }">
    <!-- Portada -->
    <div v-if="tipo === 'intro'" class="er-portada">
      <img v-if="fuente?.marca?.logo" :src="fuente.marca.logo" alt="" class="er-logo" />
      <b v-else class="er-nombre">{{ fuente?.marca?.nombre }}</b>
    </div>

    <!-- Producto -->
    <template v-else-if="tipo === 'item' && item">
      <div class="er-arriba"><img :src="item.imagen" alt="" /></div>
      <div v-if="item.precio != null" class="er-precio">
        <span v-if="item.precioAnterior > item.precio" class="er-antes">Antes {{ pesos(item.precioAnterior) }}</span>
        <b>{{ pesos(item.precio) }}</b>
        <i v-if="descuento">-{{ descuento }}%</i>
      </div>
      <div class="er-ficha">
        <span v-if="item.etiqueta" class="er-etiqueta">{{ item.etiqueta }}</span>
        <b class="er-titulo">{{ item.titulo }}</b>
        <div v-for="(r, i) in renglones" :key="i" class="er-renglon"><b>{{ String(i + 1).padStart(2, "0") }}</b>{{ r }}</div>
        <div v-if="conCuotas && item.cuotas" class="er-cuotas"><b>{{ item.cuotas.cantidad }} cuotas</b> de {{ pesos(item.cuotas.valor) }}</div>
      </div>
    </template>

    <!-- Cierre -->
    <div v-else-if="tipo === 'cierre'" class="er-cierre">
      <div class="er-cierre__marca"><img v-if="fuente?.marca?.logo" :src="fuente.marca.logo" alt="" /></div>
      <div class="er-cierre__papel">
        <b class="er-llamado">{{ fuente?.textos?.llamado || "Vení a visitarnos" }}</b>
        <div v-for="s in fuente?.sucursales || []" :key="s.nombre" class="er-suc">
          <v-icon class="er-pin">mdi-map-marker</v-icon>
          <div><b>{{ s.nombre }}</b><span>{{ s.direccion }}</span></div>
        </div>
        <div class="er-redes">
          <span v-for="r in fuente?.redes || []" :key="r.red" :class="`is-${r.red}`"><v-icon>{{ ICONOS[r.red] || "mdi-web" }}</v-icon>{{ r.texto }}</span>
        </div>
        <span v-if="fuente?.textos?.enlace" class="er-enlace"><v-icon>mdi-web</v-icon>{{ fuente.textos.enlace }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tipo: { type: String, default: "item" },
  item: { type: Object, default: null },
  fuente: { type: Object, default: null },
  ancho: { type: Number, default: 270 },
  conCuotas: { type: Boolean, default: true },
});

const ICONOS = { whatsapp: "mdi-whatsapp", instagram: "mdi-instagram", facebook: "mdi-facebook", tiktok: "mdi-music-note", youtube: "mdi-youtube", x: "mdi-alpha-x" };
const primario = computed(() => props.fuente?.marca?.colores?.primario || "#02498b");
const oscuro = computed(() => props.fuente?.estilo?.oscuro || props.fuente?.marca?.colores?.fondo || "#071c2f");
const acento = computed(() => props.fuente?.estilo?.acento || "#1786d2");
const pesos = (n) => `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
const descuento = computed(() => {
  const a = Number(props.item?.precioAnterior), p = Number(props.item?.precio);
  return a > p && p > 0 ? Math.round((1 - p / a) * 100) : 0;
});
// Igual que el servicio: se parte por "·" o por punto seguido, hasta 3 renglones.
const renglones = computed(() => String(props.item?.descripcion || "").split(/\s*·\s*|\.\s+/).map((x) => x.trim()).filter(Boolean).slice(0, 3));
</script>

<style>
.er { position: relative; overflow: hidden; border-radius: 1.4em; background: #f3efe7; color: #16171a; font-family: Inter, sans-serif; text-align: left; white-space: normal; box-shadow: 0 10px 30px rgba(7, 28, 47, .25); flex-shrink: 0; line-height: 1.2; }
.er-portada, .er-arriba, .er-cierre__marca { background: radial-gradient(ellipse 85% 60% at 50% 40%, color-mix(in srgb, var(--er-pri) 70%, #4aa3ff) 0%, var(--er-pri) 38%, var(--er-osc) 100%); }
.er-portada { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.er-logo { width: 72%; max-height: 30%; object-fit: contain; }
.er-nombre { color: #fff; font-size: 2em; font-weight: 900; text-align: center; padding: 0 1em; }
.er-arriba { height: 52%; display: flex; align-items: center; justify-content: center; }
.er-arriba img { width: 66%; height: 80%; object-fit: contain; filter: drop-shadow(0 .8em 1.4em rgba(0, 0, 0, .35)); }
.er-precio { position: absolute; left: 1.2em; top: 46%; display: flex; flex-direction: column; background: #fff; padding: .6em 1em; border-radius: .4em; box-shadow: 0 .6em 1.6em rgba(0, 0, 0, .18); }
.er-precio b { font-size: 1.9em; font-weight: 900; color: var(--er-pri); letter-spacing: -.02em; white-space: nowrap; }
.er-precio i { position: absolute; right: -.6em; top: -.9em; background: #16171a; color: #fff; font-style: normal; font-size: .8em; font-weight: 900; padding: .2em .5em; border-radius: .3em; }
.er-antes { font-size: .8em; color: #8a8f99; text-decoration: line-through; white-space: nowrap; }
.er-ficha { padding: 2.4em 1.4em 0; }
.er-etiqueta { display: block; font-size: .7em; font-weight: 800; letter-spacing: .08em; color: var(--er-ace); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.er-titulo { display: block; font-family: "Archivo Narrow", Inter, sans-serif; font-size: 1.5em; font-weight: 900; line-height: 1.02; text-transform: uppercase; margin: .25em 0 .5em; }
.er-renglon { display: flex; gap: .6em; font-size: .9em; padding: .3em 0; border-bottom: 1px solid #ddd6c8; }
.er-renglon b { color: var(--er-ace); }
.er-cuotas { margin-top: .6em; font-size: 1.1em; }
.er-cuotas b { color: var(--er-pri); }
.er-cierre { position: absolute; inset: 0; display: flex; flex-direction: column; }
.er-cierre__marca { height: 32%; display: flex; align-items: center; justify-content: center; }
.er-cierre__marca img { width: 62%; max-height: 50%; object-fit: contain; }
.er-cierre__papel { flex: 1; padding: 1.6em 1.4em; display: flex; flex-direction: column; gap: .7em; }
.er-llamado { font-family: "Archivo Narrow", Inter, sans-serif; font-size: 2.2em; font-weight: 900; line-height: .98; text-transform: uppercase; border-bottom: 2px solid #16171a; padding-bottom: .2em; }
.er-suc { display: flex; gap: .4em; align-items: flex-start; }
.er-suc div { display: flex; flex-direction: column; }
.er-suc b { font-size: 1.1em; font-weight: 900; color: var(--er-pri); text-transform: uppercase; }
.er-suc span { font-size: .75em; }
.er-pin.v-icon { font-size: 1.6em; color: var(--er-pri); }
.er-redes { display: flex; flex-wrap: wrap; gap: .4em; margin-top: .3em; }
.er-redes span { max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: inline-flex; align-items: center; gap: .3em; font-size: .75em; font-weight: 800; padding: .3em .6em; border-radius: .3em; background: #fff; }
.er-redes span.is-whatsapp { background: #25d366; color: #fff; }
.er-redes .v-icon, .er-enlace .v-icon { font-size: 1.3em; }
.er-enlace { max-width: 100%; overflow: hidden; white-space: nowrap; display: inline-flex; align-items: center; gap: .3em; font-size: .75em; font-weight: 700; color: var(--er-pri); }
</style>
