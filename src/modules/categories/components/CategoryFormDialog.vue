<!-- src/modules/categories/components/CategoryFormDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="720" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <div class="text-caption text-medium-emphasis">
            Creá un Rubro (raíz) o una Subcategoría dentro de otra.
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
            <!-- ✅ Tipo super explícito -->
            <v-col cols="12">
              <v-radio-group v-model="kind" inline>
                <v-radio label="Rubro (categoría raíz)" value="root" />
                <v-radio label="Subcategoría" value="child" />
              </v-radio-group>

              <div class="text-caption text-medium-emphasis mt-1">
                <span v-if="kind === 'root'">Se guardará sin padre (parent_id = NULL).</span>
                <span v-else>Se guardará dentro de la categoría padre seleccionada.</span>
              </div>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Nombre *"
                prepend-inner-icon="mdi-format-title"
                :rules="[r.required]"
              />
            </v-col>

            <!-- ✅ Padre obligatorio solo si es child -->
            <v-col cols="12" v-if="kind === 'child'">
              <v-select
                v-model="form.parent_id"
                label="Categoría padre *"
                :items="parentOptions"
                item-title="label"
                item-value="id"
                prepend-inner-icon="mdi-shape-outline"
                :rules="[r.requiredParent]"
                hint="Elegí dónde colgar esta subcategoría."
                persistent-hint
              />
              <div v-if="selectedParentLabel" class="text-caption text-medium-emphasis mt-1">
                Se creará dentro de: <b>{{ selectedParentLabel }}</b>
              </div>
            </v-col>

            <v-col cols="12">
              <v-switch v-model="form.is_active" label="Activo" inset />
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

  // ✅ presets para crear intuitivo desde el árbol
  presetKind: { type: String, default: "root" }, // root | child
  presetParentId: { type: [Number, String, null], default: null },
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

const formRef = ref(null);

const form = reactive({
  name: "",
  parent_id: null,
  is_active: true,
});

// ✅ root / child
const kind = ref("root");

const r = {
  required: (v) => !!String(v ?? "").trim() || "Requerido",
  requiredParent: (v) => (kind.value === "root" ? true : !!v || "Seleccioná una categoría padre"),
};

function buildTreeList(sourceItems, excludeId = null) {
  const childrenByParent = new Map();
  for (const c of sourceItems) {
    const id = Number(c.id);
    if (excludeId && id === Number(excludeId)) continue;
    if (Number(c.is_active ?? 1) === 0) continue;

    const pid = Number(c.parent_id || 0);
    if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
    childrenByParent.get(pid).push(c);
  }
  for (const [k, arr] of childrenByParent) {
    arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    childrenByParent.set(k, arr);
  }

  const out = [];
  const walk = (parentId, depth) => {
    const kids = childrenByParent.get(Number(parentId || 0)) || [];
    for (const k of kids) {
      const prefix = depth > 0 ? "— ".repeat(depth) : "";
      out.push({ id: Number(k.id), label: `${prefix}${k.name}` });
      walk(k.id, depth + 1);
    }
  };
  walk(0, 0);
  return out;
}

const parentOptions = computed(() => {
  const excludeId = props.mode === "edit" ? props.item?.id : null;
  return buildTreeList(cats.items || [], excludeId);
});

const selectedParentLabel = computed(() => {
  if (!form.parent_id) return "";
  const opt = parentOptions.value.find((x) => Number(x.id) === Number(form.parent_id));
  return opt?.label?.replace(/^(\—\s)+/, "") || "";
});

function close() {
  localOpen.value = false;
}

function resetForm() {
  form.name = "";
  form.parent_id = null;
  form.is_active = true;

  // ✅ presets para create
  kind.value = props.presetKind === "child" ? "child" : "root";
  form.parent_id = props.presetParentId ? Number(props.presetParentId) : null;

  if (kind.value === "root") form.parent_id = null;
}

function fillFromItem(item) {
  form.name = item?.name ?? "";
  form.parent_id = item?.parent_id ?? null;
  form.is_active = Number(item?.is_active ?? 1) !== 0;
  kind.value = item?.parent_id ? "child" : "root";
}

// si cambia kind a root => parent null
watch(
  () => kind.value,
  (k) => {
    if (k === "root") form.parent_id = null;
  }
);

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
    is_active: form.is_active ? 1 : 0,
  };

  // 🔑 NORMALIZACIÓN CLAVE
  if (kind.value === "root") {
    payload.parent_id = null;
  } else {
    payload.parent_id = Number(form.parent_id);
  }

  // 🚨 seguridad extra
  if (kind.value === "child" && !payload.parent_id) {
    cats.error = "Debés seleccionar una categoría padre.";
    return;
  }

  try {
    if (props.mode === "edit" && props.item?.id) {
      await cats.update(props.item.id, payload);
    } else {
      await cats.create(payload);
    }
  } catch (e) {
    // el store ya setea error
    return;
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
