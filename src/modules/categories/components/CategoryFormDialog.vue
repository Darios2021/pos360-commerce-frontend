<!-- src/modules/categories/components/CategoryFormDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="720" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <div class="text-caption text-medium-emphasis">
            Rubro = categoría padre · Subrubro = categoría con parent_id.
          </div>
        </div>

        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="errorText" type="error" variant="tonal" class="mb-4">
          {{ errorText }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="save">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Nombre *"
                prepend-inner-icon="mdi-format-title"
                :rules="[r.required]"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="form.parent_id"
                label="Rubro padre (opcional)"
                :items="parents"
                item-title="name"
                item-value="id"
                clearable
                prepend-inner-icon="mdi-shape-outline"
                hint="Si elegís un padre, esta categoría será un Subrubro."
                persistent-hint
              />
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="form.is_active"
                label="Activo"
                inset
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          @click="save"
          :loading="loading"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useCategoriesStore } from "../../../app/store/categories.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "saved"]);

const cats = useCategoriesStore();

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const loading = computed(() => !!cats.loading);
const errorText = computed(() => cats.error || "");
const title = computed(() => (props.mode === "edit" ? "Editar categoría" : "Nueva categoría"));

const parents = computed(() =>
  (cats.items || [])
    .filter((c) => !c.parent_id && Number(c.is_active ?? 1) !== 0)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
);

const formRef = ref(null);

const form = reactive({
  name: "",
  parent_id: null,
  is_active: true,
});

const r = {
  required: (v) => !!String(v ?? "").trim() || "Requerido",
};

function close() {
  localOpen.value = false;
}

function resetForm() {
  form.name = "";
  form.parent_id = null;
  form.is_active = true;
}

function fillFromItem(item) {
  form.name = item?.name ?? "";
  form.parent_id = item?.parent_id ?? null;
  form.is_active = Number(item?.is_active ?? 1) !== 0;
}

async function validateForm() {
  const res = await formRef.value?.validate?.();
  if (typeof res === "boolean") return res;
  if (res && typeof res === "object" && "valid" in res) return !!res.valid;
  return true;
}

async function save() {
  cats.clearError?.();

  const ok = await validateForm();
  if (!ok) return;

  const payload = {
    name: String(form.name || "").trim(),
    parent_id: form.parent_id ? Number(form.parent_id) : null,
    is_active: form.is_active ? 1 : 0,
  };

  if (props.mode === "edit" && props.item?.id) {
    await cats.update(props.item.id, payload);
  } else {
    await cats.create(payload);
  }

  if (cats.error) return;

  emit("saved");
  close();
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    await cats.fetchAll?.();

    if (props.mode === "edit" && props.item) fillFromItem(props.item);
    else resetForm();
  },
  { immediate: true }
);
</script>
