<!-- src/modules/users/components/UserUpsertDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="820">
    <v-card rounded="xl" class="pa-2">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between px-4 pt-4">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ mode === "create" ? "Crear usuario" : "Editar usuario" }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Alta de usuario con roles y sucursales
          </div>
        </div>

        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="pt-4">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.first_name"
              label="Nombre"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.last_name"
              label="Apellido"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.username"
              label="Usuario"
              variant="outlined"
              density="comfortable"
              hide-details
              :disabled="mode === 'edit'"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.email"
              label="Email"
              variant="outlined"
              density="comfortable"
              hide-details
              :disabled="mode === 'edit'"
            />
          </v-col>

          <v-col cols="12" md="12" v-if="mode === 'create'">
            <v-text-field
              v-model="form.password"
              label="Contraseña"
              type="password"
              variant="outlined"
              density="comfortable"
              hide-details
              hint="Mínimo 8 caracteres"
              persistent-hint
            />
          </v-col>

          <v-col cols="12" class="pt-2">
            <v-switch
              v-model="form.is_active"
              inset
              color="primary"
              label="Usuario activo"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.role_ids"
              :items="roles"
              item-title="name"
              item-value="id"
              label="Roles"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              hide-details
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Tip: admin/super_admin ven Configuración. cashier vende POS.
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.branch_ids"
              :items="branches"
              item-title="name"
              item-value="id"
              label="Sucursales habilitadas"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              hide-details
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Se usan para restringir operaciones por sucursal.
            </div>
          </v-col>
        </v-row>

        <!-- ✅ Reset password solo en EDIT -->
        <v-divider class="my-5" />

        <div v-if="mode === 'edit'">
          <div class="text-subtitle-2 font-weight-bold mb-2">Cambiar contraseña</div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="pass.newPass"
                label="Nueva contraseña"
                type="password"
                variant="outlined"
                density="comfortable"
                hide-details
                hint="Mínimo 8 caracteres"
                persistent-hint
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="pass.newPass2"
                label="Repetir contraseña"
                type="password"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>

            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                variant="tonal"
                color="primary"
                :loading="pass.loading"
                :disabled="!pass.newPass || pass.loading"
                @click="onResetPassword"
              >
                <v-icon start>mdi-lock-reset</v-icon>
                Actualizar contraseña
              </v-btn>
            </v-col>
          </v-row>

          <div v-if="pass.msg" class="text-caption text-medium-emphasis mt-2">
            {{ pass.msg }}
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="submit">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { UsersService } from "@/app/services/users.service";

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

const pass = reactive({
  newPass: "",
  newPass2: "",
  loading: false,
  msg: "",
});

watch(
  () => [props.mode, props.item, props.open],
  () => {
    if (!props.open) return;

    const u = props.item || {};
    form.first_name = u.first_name || "";
    form.last_name = u.last_name || "";
    form.username = u.username || "";
    form.email = u.email || "";
    form.password = "";
    form.is_active = typeof u.is_active === "boolean" ? u.is_active : true;

    // roles pueden venir como ["admin"] o [{id,name}]
    form.role_ids = Array.isArray(u.role_ids)
      ? [...u.role_ids]
      : Array.isArray(u.roles)
      ? u.roles
          .map((r) => (typeof r === "object" ? r.id : null))
          .filter(Boolean)
      : [];

    // branches pueden venir como [{id,name}]
    form.branch_ids = Array.isArray(u.branch_ids)
      ? [...u.branch_ids]
      : Array.isArray(u.branches)
      ? u.branches
          .map((b) => (typeof b === "object" ? b.id : null))
          .filter(Boolean)
      : [];

    pass.newPass = "";
    pass.newPass2 = "";
    pass.msg = "";
    pass.loading = false;
  },
  { immediate: true }
);

function close() {
  openLocal.value = false;
}

function submit() {
  // payload para store/backend
  emit("save", {
    first_name: form.first_name,
    last_name: form.last_name,
    username: form.username,
    email: form.email,
    password: form.password || undefined,
    is_active: form.is_active,
    role_ids: form.role_ids || [],
    branch_ids: form.branch_ids || [],
  });
}

async function onResetPassword() {
  pass.msg = "";

  if (String(pass.newPass || "").length < 8) {
    pass.msg = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }
  if (pass.newPass !== pass.newPass2) {
    pass.msg = "Las contraseñas no coinciden.";
    return;
  }

  try {
    pass.loading = true;
    const id = props?.item?.id;
    if (!id) throw new Error("Usuario inválido");

    const resp = await UsersService.resetPassword(id, { password: pass.newPass });
    pass.msg = resp?.message || "✅ Contraseña actualizada";

    pass.newPass = "";
    pass.newPass2 = "";
  } catch (e) {
    pass.msg = e?.response?.data?.message || e?.message || "Error actualizando contraseña";
  } finally {
    pass.loading = false;
  }
}
</script>
