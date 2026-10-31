<!-- src/app/components/MarcaPos360.vue -->
<!-- Marca de POS 360 (logo oficial desde 2026-10-31) y sus variantes, en vector.
     Logo oficial: isotipo (carrito blanco dentro del cuadrado redondeado celeste) y "POS 360"
     en la letra cuadrada de la marca. Redibujado sobre el logo original.
       forma: "linea" (oficial, texto al lado) · "apilado" (texto debajo) · "isotipo" (solo el cuadrado)
       fondo: "claro" (cuadrado #1488d1, carrito blanco, texto con el token --m-tinta, que sigue al
              tema claro u oscuro) · "banda" (para el azul de marca: cuadrado blanco, carrito
              #0f6fae, texto blanco) · "mono" (todo navy #121e47 con carrito blanco: impresión)
     Los mismos armados en archivo, para usar fuera de la app: src/app/theme/marca/*.svg.
     Guía de uso: docs/marca.md · hoja visual: https://claude.ai/artifact/BdfAXwD85ZwAxB7q8pRLnT -->
<template>
  <svg v-if="forma === 'linea'" class="mk" :class="'mk--' + fondo" viewBox="0 0 4910 1200" role="img" aria-label="POS 360"><g transform="translate(0 0) scale(1)"><rect width="1200" height="1200" rx="260" class="mk-cuadro"/>
    <g transform="translate(233 185) scale(.8)" class="mk-carro"><path d="M35 133 H140 L175 628" fill="none" stroke="currentColor" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M195 274 H876 Q916 274 908 316 L842 626 Q836 660 805 660 H212 Q180 660 176 628 Z" fill="currentColor"/>
  <circle cx="298" cy="817" r="122" fill="currentColor"/><circle cx="648" cy="817" r="122" fill="currentColor"/></g></g><g transform="translate(1370 346.25) scale(1.75)"><path d="M26 290 V26 H242 a22 22 0 0 1 22 22 V143 a22 22 0 0 1 -22 22 H52" transform="translate(0 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M48 26 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V48 a22 22 0 0 1 22 -22 Z" transform="translate(318 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M264 78 V48 a22 22 0 0 0 -22 -22 H48 a22 22 0 0 0 -22 22 V123 a22 22 0 0 0 22 22 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V212" transform="translate(636 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M26 78 V48 a22 22 0 0 1 22 -22 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V212 M92 145 H264" transform="translate(1097.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M240 26 H48 a22 22 0 0 0 -22 22 V242 a22 22 0 0 0 22 22 H242 a22 22 0 0 0 22 -22 V167 a22 22 0 0 0 -22 -22 H26" transform="translate(1415.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M48 26 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V48 a22 22 0 0 1 22 -22 Z" transform="translate(1733.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/></g></svg>
  <svg v-else-if="forma === 'apilado'" class="mk" :class="'mk--' + fondo" viewBox="0 0 2124 1665" role="img" aria-label="POS 360"><g transform="translate(462 0) scale(1)"><rect width="1200" height="1200" rx="260" class="mk-cuadro"/>
    <g transform="translate(233 185) scale(.8)" class="mk-carro"><path d="M35 133 H140 L175 628" fill="none" stroke="currentColor" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M195 274 H876 Q916 274 908 316 L842 626 Q836 660 805 660 H212 Q180 660 176 628 Z" fill="currentColor"/>
  <circle cx="298" cy="817" r="122" fill="currentColor"/><circle cx="648" cy="817" r="122" fill="currentColor"/></g></g><g transform="translate(-0.12750000000005457 1360) scale(1.05)"><path d="M26 290 V26 H242 a22 22 0 0 1 22 22 V143 a22 22 0 0 1 -22 22 H52" transform="translate(0 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M48 26 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V48 a22 22 0 0 1 22 -22 Z" transform="translate(318 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M264 78 V48 a22 22 0 0 0 -22 -22 H48 a22 22 0 0 0 -22 22 V123 a22 22 0 0 0 22 22 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V212" transform="translate(636 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M26 78 V48 a22 22 0 0 1 22 -22 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V212 M92 145 H264" transform="translate(1097.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M240 26 H48 a22 22 0 0 0 -22 22 V242 a22 22 0 0 0 22 22 H242 a22 22 0 0 0 22 -22 V167 a22 22 0 0 0 -22 -22 H26" transform="translate(1415.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M48 26 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V48 a22 22 0 0 1 22 -22 Z" transform="translate(1733.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/></g></svg>
  <svg v-else class="mk" :class="'mk--' + fondo" viewBox="0 0 1200 1200" role="img" aria-label="POS 360"><g transform="translate(0 0) scale(1)"><rect width="1200" height="1200" rx="260" class="mk-cuadro"/>
    <g transform="translate(233 185) scale(.8)" class="mk-carro"><path d="M35 133 H140 L175 628" fill="none" stroke="currentColor" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M195 274 H876 Q916 274 908 316 L842 626 Q836 660 805 660 H212 Q180 660 176 628 Z" fill="currentColor"/>
  <circle cx="298" cy="817" r="122" fill="currentColor"/><circle cx="648" cy="817" r="122" fill="currentColor"/></g></g></svg>
</template>

<script setup>
defineProps({
  forma: { type: String, default: "linea" },   // linea | apilado | isotipo
  fondo: { type: String, default: "claro" },   // claro | banda | mono
});
</script>

<style scoped>
.mk { display: block; height: 100%; width: auto; }
.mk-cuadro { fill: #1488d1; }
.mk-carro { color: #fff; }
.mk-texto { stroke: var(--m-tinta, #121e47); }
.mk--banda .mk-cuadro { fill: #fff; }
.mk--banda .mk-carro { color: #0f6fae; }
.mk--banda .mk-texto { stroke: #fff; }
.mk--mono .mk-cuadro { fill: #121e47; }
.mk--mono .mk-texto { stroke: #121e47; }
</style>
