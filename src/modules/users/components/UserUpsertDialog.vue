<!-- src/modules/users/components/UserUpsertDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="860">
    <v-card rounded="xl">
      <div class="d-flex align-center justify-space-between px-5 pt-5">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ mode === 'create' ? 'Crear usuario' : 'Editar usuario' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ mode === 'create' ? 'Alta de usuario con roles y sucursales' : `ID #${item?.id ?? '—'}` }}
          </div>
        </div>

        <v-btn icon="mdi-close" variant="text" @click="openLocal = false" />
      </div>

      <v-divider class="my-4" />

      <v-card-text class="pt-0">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.first_name" label="Nombre" variant="outlined" density="comfortable" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.last_name" label="Apellido" variant="outlined" density="comfortable" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.username" label="Usuario" variant="outlined" density="comfortable" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.email" label="Email" variant="outlined" density="comfortable" />
          </v-col>

          <v-col cols="12" md="6" v-if="mode === 'create'">
            <v-text-field
              v-model="form.password"
              label="Contraseña"
              type="password"
              variant="outlined"
              density="comfortable"
              hint="Mínimo 8 caracteres"
              persistent-hint
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="form.is_active"
              inset
              color="primary"
              label="Usuario activo"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.role_ids"
              :items="roleItems"
              item-title="title"
              item-value="value"
              multiple
              chips
              clearable
              label="Roles"
              variant="outlined"
              density="comfortable"
              :hint="roleHint"
              persistent-hint
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.branch_ids"
              :items="branchItems"
              item-title="title"
              item-value="value"
              multiple
              chips
              clearable
              label="Sucursales habilitadas"
              variant="outlined"
              density="comfortable"
              hint="Se usan para restringir operaciones por sucursal."
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-5 py-4">
        <v-btn variant="tonal" @click="openLocal = false">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="loading" @click="save">
          <v-icon start>mdi-content-save-outline</v-icon>
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "save"]);

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const roleItems = computed(() =>
  (props.roles || []).map((r) => ({
    title: r.description ? `${r.name} — ${r.description}` : r.name,
    value: Number(r.id),
  }))
);

const branchItems = computed(() =>
  (props.branches || []).map((b) => ({
    title: b.name,
    value: Number(b.id),
  }))
);

const roleHint = computed(() => "Tip: admin/super_admin ven Configuración. cashier vende POS.");

const form = reactive({
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  is_active: true,
  role_ids: [],
  branch_ids: [],
});

function resetFromItem() {
  const u = props.item || {};
  form.first_name = u.first_name ?? "";
  form.last_name = u.last_name ?? "";
  form.username = u.username ?? "";
  form.email = u.email ?? "";
  form.password = "";
  form.is_active = u.is_active !== false;

  // roles: puede venir como ["cashier"] o como [{id,name}]
  const rs = u.roles || [];
  form.role_ids = rs
    .map((x) => (typeof x === "object" ? Number(x.id) : null))
    .filter((n) => Number.isFinite(n) && n > 0);

  // branches: puede venir como ["Rivadavia"] o [{id,name}]
  const bs = u.branches || [];
  form.branch_ids = bs
    .map((x) => (typeof x === "object" ? Number(x.id) : null))
    .filter((n) => Number.isFinite(n) && n > 0);
}

watch(
  () => [props.open, props.mode, props.item],
  () => {
    if (props.open) resetFromItem();
  },
  { immediate: true }
);

function save() {
  const payload = {
    first_name: String(form.first_name || "").trim() || null,
    last_name: String(form.last_name || "").trim() || null,
    username: String(form.username || "").trim() || null,
    email: String(form.email || "").trim() || null,
    is_active: Boolean(form.is_active),
    role_ids: Array.isArray(form.role_ids) ? form.role_ids : [],
    branch_ids: Array.isArray(form.branch_ids) ? form.branch_ids : [],
  };

  if (props.mode === "create") {
    payload.password = String(form.password || "");
  }

  emit("save", payload);
}
</script>
