<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/shop/ShopSortSelect.vue -->
<template>
  <div class="ml-sort" :class="{ disabled: disabled }">
    <span class="ml-sort-label">Ordenar por</span>

    <button class="ml-sort-btn" type="button" :disabled="disabled" @click="open = !open">
      <span class="ml-sort-value">{{ currentLabel }}</span>
      <span class="ml-sort-caret" :class="{ up: open }">▾</span>
    </button>

    <div v-if="open" class="ml-sort-menu" role="menu">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="ml-sort-item"
        type="button"
        :class="{ on: String(modelValue) === String(opt.value) }"
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "relevance" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);

const options = [
  { value: "relevance", label: "Más relevantes" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
];

const currentLabel = computed(() => {
  const found = options.find((o) => String(o.value) === String(props.modelValue));
  return found ? found.label : "Más relevantes";
});

function select(v) {
  emit("update:modelValue", String(v || "relevance"));
  open.value = false;
}

function onDocClick(e) {
  // cerrar cuando clickeas afuera
  const el = e.target?.closest?.(".ml-sort");
  if (!el) open.value = false;
}

onMounted(() => document.addEventListener("click", onDocClick, true));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick, true));
</script>

<style scoped>
.ml-sort {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  position: relative;
  user-select: none;
}

.ml-sort.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.ml-sort-label {
  font-size: 13px;
  color: rgba(0,0,0,.7);
  font-weight: 600;
}

.ml-sort-btn {
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,.18);
  background: #fff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.ml-sort-value {
  font-size: 13px;
  font-weight: 700;
  color: rgba(0,0,0,.82);
  white-space: nowrap;
}

.ml-sort-caret {
  font-size: 12px;
  opacity: 0.7;
  transform: translateY(-1px);
  transition: transform .15s ease;
}
.ml-sort-caret.up {
  transform: rotate(180deg) translateY(1px);
}

.ml-sort-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0,0,0,.18);
  padding: 6px;
  z-index: 50;
}

.ml-sort-item {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 10px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(0,0,0,.86);
}

.ml-sort-item:hover {
  background: rgba(0,0,0,.04);
}

.ml-sort-item.on {
  background: rgba(52,131,250,.12);
  font-weight: 900;
}
</style>
