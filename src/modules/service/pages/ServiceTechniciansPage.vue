<!-- src/modules/service/pages/ServiceTechniciansPage.vue
     Quien es tecnico del servicio tecnico. Solo admin.

     Los marcados son los que aparecen al derivar un equipo y los que tienen
     cola propia ("Mis equipos"). No es un rol: los roles deciden el alcance
     (cajero ve lo suyo, admin la sucursal) y un tecnico puede ser cualquiera
     de los dos. Desmarcar a alguien no cambia las ordenes que ya tiene. -->
<template>
  <div class="pa-4">
    <AppPageHeader icon="mdi-account-wrench-outline" title="Tecnicos" subtitle="Servicio tecnico">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push({ name: 'serviceOrders' })">
        Volver
      </v-btn>
    </AppPageHeader>

    <v-card variant="flat" border rounded="lg" style="max-width: 720px">
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th class="text-right">Tecnico</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="3" class="text-center py-8 text-medium-emphasis">Cargando…</td>
          </tr>
          <tr v-for="u in usuarios" v-else :key="u.id">
            <td>{{ u.name }}</td>
            <td class="text-medium-emphasis">{{ u.email || "—" }}</td>
            <td class="text-right">
              <v-switch
                :model-value="u.es_tecnico"
                color="primary"
                density="compact"
                hide-details
                inset
                class="d-inline-flex"
                :loading="guardando === u.id"
                @update:model-value="(v) => cambiar(u, v)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="3500">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import { listTechnicianUsers, setTechnician } from "../services/service.service";

const router = useRouter();
const usuarios = ref([]);
const cargando = ref(false);
const guardando = ref(null);

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await listTechnicianUsers();
    usuarios.value = data?.data || [];
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo cargar la lista de usuarios.", "error");
  } finally {
    cargando.value = false;
  }
}

async function cambiar(u, valor) {
  guardando.value = u.id;
  try {
    const { data } = await setTechnician(u.id, !!valor);
    usuarios.value = data?.data || usuarios.value;
    notificar(valor ? `${u.name} es tecnico.` : `${u.name} ya no es tecnico.`);
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo guardar.", "error");
  } finally {
    guardando.value = null;
  }
}

onMounted(cargar);
</script>
