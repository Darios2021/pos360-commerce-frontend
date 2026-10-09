<template>
  <div class="pos-grid-layout">
    <div class="pos-grid__topbar">
      <slot name="topbar" />
    </div>

    <div class="pos-grid__search">
      <slot name="search" />
    </div>

    <div class="pos-grid__right">
      <div class="pos-grid__caja">
        <slot name="caja" />
      </div>

      <div class="pos-grid__cart">
        <slot name="cart" />
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.pos-grid-layout {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  display: grid;
  gap: 0;
  overflow: hidden;
  box-sizing: border-box;
  /* Como el mostrador de Zondito: el catálogo a la izquierda (barra de
     teclas arriba) y el panel de 340 px de alto completo a la derecha. */
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: 56px minmax(0, 1fr);
  grid-template-areas:
    "topbar right"
    "search right";
}

.pos-grid__topbar,
.pos-grid__search,
.pos-grid__right,
.pos-grid__caja,
.pos-grid__cart {
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
}

.pos-grid__topbar {
  grid-area: topbar;
  overflow: hidden;
  background: var(--z-barra, #ffffff);
  border-bottom: 1px solid var(--z-linea, rgba(15, 23, 42, 0.06));
}

.pos-grid__search {
  grid-area: search;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pos-grid__right {
  grid-area: right;
  min-height: 0;
  max-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  align-content: stretch;
  background: var(--z-panel, #ffffff);
  border-left: 1px solid var(--z-linea, rgba(15, 23, 42, 0.06));
}

.pos-grid__caja,
.pos-grid__cart {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 960px) {
  .pos-grid-layout {
    overflow: auto;
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "topbar"
      "search"
      "right";
  }

  .pos-grid__right {
    grid-template-rows: auto minmax(220px, 1fr);
  }
}
</style>