<!-- src/app/components/CampoFecha.vue -->
<!-- Campo de fecha: muestra dd/mm/aaaa y abre un calendario al tocarlo.
     Trabaja con "AAAA-MM-DD" (lo que guarda la API). -->
<template>
  <v-menu v-model="abierto" :close-on-content-click="false" location="bottom start">
    <template #activator="{ props: act }">
      <v-text-field
        :model-value="texto"
        v-bind="act"
        :disabled="disabled"
        :clearable="clearable"
        readonly
        density="comfortable"
        variant="outlined"
        hide-details
        append-inner-icon="mdi-calendar-month-outline"
        placeholder="dd/mm/aaaa"
        class="campo-fecha num"
        @click:clear="emit('update:modelValue', null)"
      />
    </template>
    <v-card class="campo-fecha__menu">
      <v-date-picker
        :model-value="fecha"
        hide-header
        show-adjacent-months
        color="primary"
        @update:model-value="elegir"
      />
      <div class="campo-fecha__pie">
        <v-btn variant="text" color="primary" @click="hoy">Hoy</v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue"]);
const abierto = ref(false);

const fecha = computed(() => {
  const s = String(props.modelValue || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
});
const texto = computed(() => {
  const s = String(props.modelValue || "").slice(0, 10);
  const [y, m, d] = s.split("-");
  return d ? `${d}/${m}/${y}` : "";
});

function aIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function elegir(v) {
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d)) return;
  emit("update:modelValue", aIso(d));
  abierto.value = false;
}
function hoy() { elegir(new Date()); }
</script>

<style>
.campo-fecha input { cursor: pointer; }
.campo-fecha__menu { border-radius: 12px !important; overflow: hidden; }
.campo-fecha__pie { display: flex; justify-content: flex-end; padding: 0 8px 8px; }
</style>
