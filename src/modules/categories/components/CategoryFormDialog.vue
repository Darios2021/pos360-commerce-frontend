<!-- src/modules/categories/components/CategoryFormDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="720" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <div class="text-caption text-medium-emphasis">
            Creá un Rubro (raíz) o una Subcategoría (ecommerce) dentro de un rubro.
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
              <v-radio-group v-model="kind" inline>
                <v-radio label="Rubro (categoría raíz)" value="root" />
                <v-radio label="Subcategoría (ecommerce)" value="child" />
              </v-radio-group>

              <div class="text-caption text-medium-emphasis mt-1">
                <span v-if="kind === 'root'">Se guardará como rubro (parent_id = NULL).</span>
                <span v-else>Se guardará como subcategoría real (tabla subcategories) dentro del rubro seleccionado.</span>
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
                v-model="form.category_id"
                label="Rubro padre *"
                :items="parentOptions"
                item-title="label"
                item-value="id"
                prepend-inner-icon="mdi-shape-outline"
                :rules="[r.requiredParent]"
                hint="Elegí el rubro donde colgar esta subcategoría (ecommerce)."
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
import http from "../../../app/api/http"; // ✅ usamos http directo para /categories/:id/subcategories

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },

  // presets para crear intuitivo desde el árbol
  presetKind: { type: String, default: "root" }, // root | child
  presetParentId: { type: [Number, String, null], default: null }, // ⚠️ en legacy esto era parent_id
});

const emit = defineEmits(["update:open", "saved"]);

const cats = useCategoriesStore();

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const loading = computed(() => !!cats.loading);
const errorText = computed(() => cats.error || "");
const title = computed(() => (props.mode === "edit" ? "Editar" : "Nuevo"));

const formRef = ref(null);

const form = reactive({
  name: "",
  // ✅ ecommerce: category_id para subcategories
  category_id: null,
  is_active: true,
});

// root / child
const kind = ref("root");

const r = {
  required: (v) => !!String(v ?? "").trim() || "Requerido",
  requiredParent: (v) => (kind.value === "root" ? true : !!v || "Seleccioná un rubro padre"),
};

// ✅ SOLO rubros padre (categories.parent_id NULL)
const parentOptions = computed(() => {
  const parents = (cats.parents || []).map((c) => ({
    id: Number(c.id),
    label: String(c.name || "").trim(),
  }));
  parents.sort((a, b) => a.label.localeCompare(b.label, "es"));
  return parents;
});

const selectedParentLabel = computed(() => {
  if (!form.category_id) return "";
  const opt = parentOptions.value.find((x) => Number(x.id) === Number(form.category_id));
  return opt?.label || "";
});

function close() {
  localOpen.value = false;
}

function resetForm() {
  form.name = "";
  form.category_id = null;
  form.is_active = true;

  kind.value = props.presetKind === "child" ? "child" : "root";

  // ✅ presetParentId viene del árbol (legacy). En el admin lo usás como rubro seleccionado.
  form.category_id = props.presetParentId ? Number(props.presetParentId) : null;

  if (kind.value === "root") form.category_id = null;
}

function fillFromItem(item) {
  // ⚠️ en modo edit, si editás una categoría legacy, mantenemos ese comportamiento
  // Para editar subcategorías ecommerce, lo ideal es un modal aparte (si querés lo armamos).
  form.name = item?.name ?? "";
  form.is_active = Number(item?.is_active ?? 1) !== 0;

  // si viene parent_id => era legacy. Si no, rubro.
  kind.value = item?.parent_id ? "child" : "root";
  form.category_id = item?.parent_id ? Number(item.parent_id) : null;
}

watch(
  () => kind.value,
  (k) => {
    if (k === "root") form.category_id = null;
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

  const name = String(form.name || "").trim();
  const is_active = form.is_active ? 1 : 0;

  try {
    if (props.mode === "edit" && props.item?.id) {
      // ✅ Edit (legacy category)
      await cats.update(props.item.id, {
        name,
        is_active,
        parent_id: kind.value === "root" ? null : Number(form.category_id || 0) || null,
      });
    } else {
      if (kind.value === "root") {
        // ✅ Crear rubro (categories)
        await cats.create({ name, is_active, parent_id: null });
      } else {
        // ✅ Crear subcategoría REAL (subcategories)
        const categoryId = Number(form.category_id || 0);
        if (!categoryId) {
          cats.error = "Debés seleccionar un rubro padre.";
          return;
        }

        const { data } = await http.post(`/categories/${categoryId}/subcategories`, {
          name,
          is_active,
        });

        if (!data?.ok) throw new Error(data?.message || "Error creando subcategoría");
      }
    }
  } catch (e) {
    cats.error = e?.response?.data?.message || e?.message || String(e);
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

    await cats.fetchAll?.(true);

    if (props.mode === "edit" && props.item) fillFromItem(props.item);
    else resetForm();
  },
  { immediate: true }
);
</script>
