<template>
  <div class="pos-layout">
    <section class="pos-layout__left">
      <slot name="left" />
    </section>

    <aside class="pos-layout__right">
      <slot name="right" />
    </aside>
  </div>
</template>

<script setup>
</script>

<style scoped>
.pos-layout {
  display: grid;
  grid-template-columns:
    var(--pos-grid-left, minmax(0, 1.45fr))
    var(--pos-grid-right, minmax(320px, 0.95fr));
  gap: var(--pos-grid-gap, 10px);
  height: 100%;
  min-height: 0;
}

.pos-layout__left,
.pos-layout__right {
  min-width: 0;
  min-height: 0;
}

.pos-layout__left {
  display: flex;
  flex-direction: column;
  gap: var(--pos-grid-gap, 10px);
}

.pos-layout__right {
  display: flex;
  flex-direction: column;
  gap: var(--pos-grid-gap, 10px);
}

@media (max-width: 960px) {
  .pos-layout {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>