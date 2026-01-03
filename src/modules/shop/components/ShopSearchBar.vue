<!-- src/modules/shop/components/ShopSearchBar.vue -->
<template>
  <div class="shop-searchbar" :class="{ compact }">
    <v-text-field
      v-model="localValue"
      density="comfortable"
      variant="outlined"
      hide-details
      clearable
      class="search"
      prepend-inner-icon="mdi-magnify"
      :placeholder="placeholder"
      @keyup.enter="emitSearch"
      @click:clear="emitClear"
    />

    <div v-if="showCount" class="count">
      {{ countLabel }}
    </div>

    <v-btn
      v-if="showButton"
      variant="tonal"
      :loading="loading"
      class="btn"
      @click="emitSearch"
    >
      {{ buttonText }}
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  loading: { type: Boolean, default: false },

  placeholder: { type: String, default: "Buscar…" },

  // UI
  showButton: { type: Boolean, default: true },
  buttonText: { type: String, default: "Buscar" },
  showCount: { type: Boolean, default: true },
  countLabel: { type: String, default: "" },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "search", "clear"]);

const localValue = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", String(v ?? "")),
});

function emitSearch() {
  emit("search", String(props.modelValue || "").trim());
}

function emitClear() {
  emit("update:modelValue", "");
  emit("clear");
}
</script>

<style scoped>
.shop-searchbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search {
  width: 420px;
  max-width: 100%;
}

.count {
  font-size: 13px;
  font-weight: 900;
  opacity: 0.75;
}

.btn {
  white-space: nowrap;
}

.shop-searchbar.compact .search {
  width: 100%;
}
</style>
