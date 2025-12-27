<template>
  <v-app>
    <v-layout>
      <!-- ================= HEADER ================= -->
      <v-app-bar elevation="0" color="surface" height="72" class="pos-appbar">
        <template #prepend>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="toggleRail"
            :title="rail ? 'Expandir menú' : 'Contraer menú'"
          />
        </template>

        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal" size="40">
            <span class="font-weight-bold">360</span>
          </v-avatar>

          <div class="d-flex flex-column">
            <div class="font-weight-bold">POS360</div>
            <div class="text-caption text-medium-emphasis">
              Inventario · Ecommerce · POS
            </div>
          </div>
        </div>

        <v-spacer />

        <!-- ===== Cuenta (Google-like) ===== -->
        <v-menu
          v-model="accountMenu"
          :close-on-content-click="false"
          location="bottom end"
          offset="12"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              class="mr-1"
              title="Cuenta"
            >
              <v-avatar size="34" class="pos-avatar-btn">
                <v-img v-if="userAvatar" :src="userAvatar" cover />
                <span v-else class="text-caption font-weight-bold">
                  {{ userInitials }}
                </span>
              </v-avatar>
            </v-btn>
          </template>

          <v-card rounded="xl" class="pos-account-card" min-width="340">
            <!-- Header -->
            <div class="d-flex align-center justify-space-between px-4 pt-4">
              <div class="text-caption text-medium-emphasis">Cuenta</div>
              <v-btn
                icon="mdi-close"
                variant="text"
                density="comfortable"
                @click="accountMenu = false"
              />
            </div>

            <!-- Identity -->
            <div class="px-4 pt-3 pb-2 text-center">
              <v-avatar size="84" class="mx-auto mb-3 pos-account-avatar">
                <v-img v-if="userAvatar" :src="userAvatar" cover />
                <span v-else class="text-h6 font-weight-bold">
                  {{ userInitials }}
                </span>
              </v-avatar>

              <div class="text-h6 font-weight-bold">
                {{ userFullName || "Usuario" }}
              </div>

              <div class="text-caption text-medium-emphasis">
                {{ userRoleLabel }}
              </div>

              <div class="text-caption text-medium-emphasis mt-1">
                {{ userEmailOrUsername }}
              </div>
            </div>

            <div class="px-4 pb-2">
              <v-btn
                block
                variant="tonal"
                color="primary"
                prepend-icon="mdi-account-edit-outline"
                :to="{ name: 'profile' }"
                @click="accountMenu = false"
              >
                Mi perfil
              </v-btn>
            </div>

            <v-divider class="my-3" />

            <div class="px-4 pb-4">
              <v-btn
                block
                color="red"
                variant="tonal"
                prepend-icon="mdi-logout-variant"
                @click="onLogout"
              >
                Cerrar sesión
              </v-btn>
            </div>
          </v-card>
        </v-menu>
      </v-app-bar>

      <!-- ================= DRAWER ================= -->
      <v-navigation-drawer
        v-model="drawer"
        permanent
        :rail="rail"
        width="280"
        rail-width="72"
        class="pos-drawer"
      >
        <div class="pt-2"></div>

        <div v-if="!rail" class="px-4 py-2 text-caption text-medium-emphasis">
          Navegación
        </div>

        <v-list nav density="comfortable">
          <v-list-item
            :to="{ name: 'home' }"
            prepend-icon="mdi-view-dashboard-outline"
            title="Dashboard"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">
              Dashboard
            </v-tooltip>
          </v-list-item>

          <v-list-item
            :to="{ name: 'pos' }"
            prepend-icon="mdi-point-of-sale"
            title="Punto de Venta"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">
              Punto de Venta
            </v-tooltip>
          </v-list-item>

          <v-list-item
            :to="{ name: 'posSales' }"
            prepend-icon="mdi-receipt-text-outline"
            title="Ventas"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">
              Ventas
            </v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption text-medium-emphasis">
            Gestión
          </div>

          <v-list-item
            :to="{ name: 'products' }"
            prepend-icon="mdi-package-variant-closed"
            title="Productos"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">
              Productos
            </v-tooltip>
          </v-list-item>

          <v-list-item
            :to="{ name: 'productsImport' }"
            prepend-icon="mdi-database-import-outline"
            title="Importar CSV"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">
              Importar CSV
            </v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption text-medium-emphasis">
            Sistema
          </div>

          <v-list-group v-if="showConfig" value="config" prepend-icon="mdi-cog-outline">
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="Configuración">
                <v-tooltip v-if="rail" activator="parent" location="right">
                  Configuración
                </v-tooltip>
              </v-list-item>
            </template>

            <v-list-item
              v-if="hasRoute('stock')"
              :to="{ name: 'stock' }"
              prepend-icon="mdi-warehouse"
              title="Stock"
              exact
            />

            <v-list-item
              v-if="isAdmin && hasRoute('inventory')"
              :to="{ name: 'inventory' }"
              prepend-icon="mdi-clipboard-list-outline"
              title="Gestión de inventario"
              exact
            />

            <v-list-item
              v-if="hasRoute('categories')"
              :to="{ name: 'categories' }"
              prepend-icon="mdi-shape-outline"
              title="Categorías"
              exact
            />
          </v-list-group>
        </v-list>

        <v-spacer />

        <div class="pa-4 text-caption text-medium-emphasis" v-if="!rail">
          v1 · 2025
        </div>
        <div class="px-2 pb-4 text-caption text-medium-emphasis text-center" v-else>
          v1
        </div>
      </v-navigation-drawer>

      <!-- ================= MAIN ================= -->
      <v-main class="pos-main">
        <v-container fluid class="pos-container">
          <slot />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth.store";

const drawer = ref(true);
const rail = ref(false);
const accountMenu = ref(false);

const auth = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

const userAvatar = computed(() => {
  const u = auth.user || {};
  return u.avatar_url || "";
});

const userEmailOrUsername = computed(() => {
  const u = auth.user || {};
  return u.email || u.username || "";
});

const userFullName = computed(() => {
  const u = auth.user || {};
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
});

const userInitials = computed(() => {
  const u = auth.user || {};
  const a = (u.first_name || "").trim();
  const b = (u.last_name || "").trim();
  return ((a[0] || "") + (b[0] || "")).toUpperCase() || "U";
});

const userRoleLabel = computed(() => {
  const r = auth.roles || [];
  if (r.includes("super_admin")) return "Super Admin";
  if (r.includes("admin")) return "Administrador";
  if (r.includes("manager")) return "Supervisor";
  if (r.includes("seller")) return "Vendedor";
  return r[0] || "Usuario";
});

function hasRoute(name) {
  try {
    return router.hasRoute(name);
  } catch {
    return false;
  }
}

const showConfig = computed(() =>
  hasRoute("stock") || hasRoute("inventory") || hasRoute("categories")
);

function toggleRail() {
  rail.value = !rail.value;
}

function onLogout() {
  accountMenu.value = false;
  auth.logout?.();
  router.push({ name: "login" });
}
</script>

<style scoped>
.pos-appbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.pos-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.pos-main {
  background: rgb(var(--v-theme-background));
}
.pos-container {
  padding-top: 16px;
  padding-bottom: 24px;
  max-width: 1400px;
}
.pos-avatar-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.pos-account-card {
  overflow: hidden;
}
.pos-account-avatar {
  border: 3px solid rgba(255, 255, 255, 0.2);
}
</style>
