<!-- src/app/components/MarcaPos360.vue -->
<!-- Logo oficial de POS 360 (2026-10-31): isotipo (carrito blanco dentro del cuadrado
     redondeado celeste) y "POS 360" en la letra cuadrada de la marca, en una línea.
     Vector redibujado sobre el logo original; los colores salen de los tokens del kit,
     así el texto acompaña al tema claro u oscuro. Prop `banda`: versión para fondo azul
     (cuadrado blanco, carrito azul, texto blanco). Hoja de aplicaciones:
     https://claude.ai/artifact/BdfAXwD85ZwAxB7q8pRLnT -->
<template>
  <svg class="mk" viewBox="0 0 4910 1200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="POS 360"><g transform="translate(0 0) scale(1)"><rect width="1200" height="1200" rx="260" class="mk-cuadro"/>
    <g transform="translate(233 185) scale(.8)" class="mk-carro"><path d="M35 133 H140 L175 628" fill="none" stroke="currentColor" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M195 274 H876 Q916 274 908 316 L842 626 Q836 660 805 660 H212 Q180 660 176 628 Z" fill="currentColor"/>
  <circle cx="298" cy="817" r="122" fill="currentColor"/><circle cx="648" cy="817" r="122" fill="currentColor"/></g></g><g transform="translate(1370 346.25) scale(1.75)"><path d="M26 290 V26 H242 a22 22 0 0 1 22 22 V143 a22 22 0 0 1 -22 22 H52" transform="translate(0 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M48 26 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V48 a22 22 0 0 1 22 -22 Z" transform="translate(318 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M264 78 V48 a22 22 0 0 0 -22 -22 H48 a22 22 0 0 0 -22 22 V123 a22 22 0 0 0 22 22 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V212" transform="translate(636 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M26 78 V48 a22 22 0 0 1 22 -22 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V212 M92 145 H264" transform="translate(1097.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M240 26 H48 a22 22 0 0 0 -22 22 V242 a22 22 0 0 0 22 22 H242 a22 22 0 0 0 22 -22 V167 a22 22 0 0 0 -22 -22 H26" transform="translate(1415.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/><path d="M48 26 H242 a22 22 0 0 1 22 22 V242 a22 22 0 0 1 -22 22 H48 a22 22 0 0 1 -22 -22 V48 a22 22 0 0 1 22 -22 Z" transform="translate(1733.1 0)" fill="none" class="mk-texto" stroke-width="60" stroke-linejoin="round" stroke-linecap="butt"/></g></svg>
</template>

<style scoped>
.mk { display: block; height: 100%; width: auto; }
.mk-cuadro { fill: #1488d1; }
.mk-carro { color: #fff; }
.mk-texto { stroke: var(--m-tinta, #121e47); }
</style>
