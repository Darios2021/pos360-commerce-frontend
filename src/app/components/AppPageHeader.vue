<!--
  AppPageHeader — Header estándar para vistas del sistema.

  Estructura:
    [breadcrumbs auto desde route]
    [back?] [icon-pill] [title / subtitle]   ........   [slot: actions]

  Uso básico (auto breadcrumbs + back):
    <AppPageHeader icon="mdi-package-variant-closed" title="Productos">
      <v-btn ...>Acción</v-btn>
    </AppPageHeader>

  Override manual (cuando se quiere forzar breadcrumbs/back distintos):
    <AppPageHeader
      icon="mdi-..." title="..."
      :crumbs="[{ label: 'Sección' }, { label: 'Padre', to: { name: 'parent' } }]"
      :back-to="{ name: 'parent' }"
    />

  Props:
    - icon       (String) ícono mdi del header
    - title      (String) título principal
    - subtitle   (String) subtítulo opcional (slot #subtitle también disponible)
    - dense      (Bool)   variante compacta para POS u otras pantallas chicas
    - crumbs     (Array)  breadcrumbs custom; si se omite, se calculan desde route
    - backTo     (Object) ruta para volver atrás; si se omite, se infiere del parent
    - showBack   (Bool)   fuerza MOSTRAR el botón volver aunque no haya parent en el árbol
    - hideBack   (Bool)   fuerza ocultar el botón volver aunque haya parent
    - hideCrumbs (Bool)   fuerza ocultar el breadcrumb aunque haya items

  Eventos:
    - @back  emitido cuando se hace click en volver. Si el padre lo maneja,
             puede prevenir la navegación automática. Útil para vistas
             embebidas (ej: detalle dentro de un tab) que no son rutas reales.
-->
<template>
  <header class="app-page-header" :class="{ 'app-page-header--dense': dense }">
    <!-- ── Breadcrumbs (encima del título) ── -->
    <nav v-if="!hideCrumbs && resolvedCrumbs.length > 1" class="app-page-header__crumbs" aria-label="breadcrumb">
      <template v-for="(c, i) in resolvedCrumbs" :key="i">
        <component
          :is="c.to ? 'router-link' : 'span'"
          :to="c.to"
          class="app-page-header__crumb"
          :class="{ 'is-current': i === resolvedCrumbs.length - 1 }"
        >
          {{ c.label }}
        </component>
        <v-icon
          v-if="i < resolvedCrumbs.length - 1"
          size="14"
          class="app-page-header__crumb-sep"
        >mdi-chevron-right</v-icon>
      </template>
    </nav>

    <!-- ── Línea principal: back + icon + título + acciones ── -->
    <div class="app-page-header__row">
      <!-- Botón volver -->
      <button
        v-if="(resolvedBackTo || showBack) && !hideBack"
        type="button"
        class="app-page-header__back"
        :title="backTitle"
        @click="onBack"
      >
        <v-icon size="20">mdi-arrow-left</v-icon>
      </button>

      <div class="app-page-header__left">
        <div v-if="icon" class="app-page-header__icon">
          <v-icon size="22">{{ icon }}</v-icon>
        </div>
        <div class="app-page-header__text">
          <h1 class="app-page-header__title">{{ title }}</h1>
          <div v-if="$slots.subtitle || subtitle" class="app-page-header__subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </div>
      </div>
      <div v-if="$slots.default" class="app-page-header__actions">
        <slot />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getBreadcrumbs, getParent } from "@/app/utils/routeTree";

const props = defineProps({
  icon:       { type: String, default: "" },
  title:      { type: String, required: true },
  subtitle:   { type: String, default: "" },
  dense:      { type: Boolean, default: false },
  crumbs:     { type: Array,  default: null },
  backTo:     { type: Object, default: null },
  showBack:   { type: Boolean, default: false },
  hideBack:   { type: Boolean, default: false },
  hideCrumbs: { type: Boolean, default: false },
});
const emit = defineEmits(["back"]);

const route = useRoute();
const router = useRouter();

const TAB_LABELS = { sales: "Ventas", stock: "Stock", inventory: "Inventario", cash: "Caja" };

// Breadcrumbs: usa los provistos o los calcula desde la ruta actual
const resolvedCrumbs = computed(() => {
  if (Array.isArray(props.crumbs)) return props.crumbs;
  return getBreadcrumbs(route.name, route.query, TAB_LABELS);
});

// Botón volver: usa el provisto o lo deriva del parent del routeTree
const resolvedBackTo = computed(() => {
  if (props.backTo) return props.backTo;
  const parent = getParent(route.name);
  return parent?.to || null;
});

const backTitle = computed(() => {
  const parent = props.backTo ? null : getParent(route.name);
  return parent?.label ? `Volver a ${parent.label}` : "Volver";
});

function onBack() {
  // Permite que el padre intercepte y prevenga la navegación llamando
  // event.preventDefault() en el listener del @back.
  let prevented = false;
  emit("back", {
    preventDefault: () => { prevented = true; },
  });
  if (prevented) return;

  if (resolvedBackTo.value) {
    router.push(resolvedBackTo.value);
  } else if (window.history.length > 1) {
    router.back();
  }
}
</script>

<style scoped>
.app-page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0 18px;
}

/* ─── Breadcrumbs ─── */
.app-page-header__crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11.5px;
  letter-spacing: 0.01em;
  line-height: 1.3;
  margin-left: 2px;
}
.app-page-header__crumb {
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
a.app-page-header__crumb:hover {
  color: #1488d1;
  background: rgba(20, 136, 209, 0.08);
}
.app-page-header__crumb.is-current {
  color: rgba(var(--v-theme-on-surface), 0.85);
  font-weight: 500;
}
.app-page-header__crumb-sep {
  color: rgba(var(--v-theme-on-surface), 0.30);
  flex-shrink: 0;
}

/* ─── Fila principal ─── */
.app-page-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.app-page-header__back {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.75);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, transform 0.15s;
}
.app-page-header__back:hover {
  background: rgba(20, 136, 209, 0.10);
  color: #1488d1;
  transform: translateX(-1px);
}
.v-theme--adminDark .app-page-header__back,
.v-theme--shopDark .app-page-header__back,
.v-theme--dark .app-page-header__back {
  background: rgba(255, 255, 255, 0.05);
}
.v-theme--adminDark .app-page-header__back:hover,
.v-theme--shopDark .app-page-header__back:hover,
.v-theme--dark .app-page-header__back:hover {
  background: rgba(20, 136, 209, 0.18);
}

.app-page-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
}
.app-page-header__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(20, 136, 209, 0.12);
  color: #1488d1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.v-theme--adminDark .app-page-header__icon,
.v-theme--shopDark .app-page-header__icon,
.v-theme--dark .app-page-header__icon {
  background: rgba(20, 136, 209, 0.18);
}
.app-page-header__text {
  min-width: 0;
}
.app-page-header__title {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.3px;
  line-height: 1.15;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}
.app-page-header__subtitle {
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 2px;
  line-height: 1.3;
}
.app-page-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* ─── Variante dense (POS, vistas full-screen) ─── */
.app-page-header--dense {
  padding: 2px 4px 8px;
  gap: 4px;
}
.app-page-header--dense .app-page-header__crumbs { font-size: 10.5px; }
.app-page-header--dense .app-page-header__icon {
  width: 32px; height: 32px; border-radius: 9px;
}
.app-page-header--dense .app-page-header__back {
  width: 32px; height: 32px; border-radius: 9px;
}
.app-page-header--dense .app-page-header__title { font-size: 17px; }
.app-page-header--dense .app-page-header__subtitle { font-size: 11.5px; }

@media (max-width: 600px) {
  /* En mobile compactamos al máximo: no breadcrumb, no icon-cuadrado.
     Solo back + título grande, estilo app móvil. */
  .app-page-header { padding-bottom: 10px; gap: 4px; }
  .app-page-header__crumbs { display: none; }
  .app-page-header__icon { display: none; }
  .app-page-header__title { font-size: 20px; letter-spacing: -0.015em; font-weight: 700; }
  .app-page-header__back { width: 36px; height: 36px; border-radius: 10px; }
  .app-page-header__row { gap: 10px; }
  .app-page-header__left { gap: 0; }
}
</style>
