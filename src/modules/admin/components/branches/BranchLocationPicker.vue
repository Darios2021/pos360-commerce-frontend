<!-- Map picker para seleccionar lat/lng con Google Maps + Geocoding API.
     - Click en el mapa fija el marker.
     - Marker arrastrable: actualiza lat/lng en tiempo real.
     - Inputs manuales sincronizados con el mapa.
     - Botón "Buscar dirección" usa Google Geocoding (mucho mejor que Nominatim). -->

<template>
  <div class="bl">
    <div class="bl-toolbar">
      <v-text-field
        v-model="searchQuery"
        label="Buscar dirección o lugar"
        placeholder="Ej. Av. Ignacio de la Roza 1234, San Juan"
        variant="outlined"
        density="comfortable"
        rounded="lg"
        hide-details
        prepend-inner-icon="mdi-magnify"
        class="bl-search"
        @keydown.enter.prevent="geocodeSearch"
      />
      <v-btn
        color="primary"
        variant="tonal"
        rounded="lg"
        :loading="searching"
        :disabled="!searchQuery.trim()"
        @click="geocodeSearch"
        class="bl-search-btn"
      >
        Buscar
      </v-btn>
    </div>

    <div ref="mapEl" class="bl-map" aria-label="Mapa selector de ubicación"></div>

    <div v-if="apiError" class="bl-error">
      <v-icon size="14">mdi-alert-circle-outline</v-icon>
      <span>{{ apiError }}</span>
    </div>

    <div class="bl-coords">
      <v-text-field
        v-model.number="latLocal"
        label="Latitud"
        type="number"
        step="0.0000001"
        variant="outlined"
        density="comfortable"
        rounded="lg"
        hide-details
        class="bl-coord-input"
        prepend-inner-icon="mdi-latitude"
        @blur="commitFromInputs"
      />
      <v-text-field
        v-model.number="lngLocal"
        label="Longitud"
        type="number"
        step="0.0000001"
        variant="outlined"
        density="comfortable"
        rounded="lg"
        hide-details
        class="bl-coord-input"
        prepend-inner-icon="mdi-longitude"
        @blur="commitFromInputs"
      />
      <v-btn
        v-if="hasCoords"
        variant="text"
        size="small"
        rounded="lg"
        prepend-icon="mdi-close"
        @click="clearCoords"
      >
        Quitar ubicación
      </v-btn>
    </div>

    <div class="bl-hint">
      <v-icon size="13">mdi-information-outline</v-icon>
      <span>
        Hacé click sobre el mapa o arrastrá el marcador para fijar la ubicación.
        También podés escribir las coordenadas a mano.
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, onMounted, computed, nextTick } from "vue";
import { loadGoogleMaps } from "@/app/utils/googleMapsLoader";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ latitude: null, longitude: null }),
  },
  initialAddress: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "geocode"]);

const mapEl = ref(null);
let mapInstance = null;
let marker = null;
let geocoder = null;
let googleRef = null;

const searchQuery = ref(props.initialAddress || "");
const searching = ref(false);
const apiError = ref("");

const latLocal = ref(props.modelValue?.latitude ?? null);
const lngLocal = ref(props.modelValue?.longitude ?? null);

const hasCoords = computed(
  () => Number.isFinite(Number(latLocal.value)) && Number.isFinite(Number(lngLocal.value))
);

function emitChange() {
  const lat = Number.isFinite(Number(latLocal.value)) ? Number(latLocal.value) : null;
  const lng = Number.isFinite(Number(lngLocal.value)) ? Number(lngLocal.value) : null;
  emit("update:modelValue", { latitude: lat, longitude: lng });
}

function roundCoord(v) {
  return Math.round(Number(v) * 1e7) / 1e7;
}

function makePinHtml() {
  const div = document.createElement("div");
  div.style.cssText = `
    position: relative;
    width: 28px;
    height: 36px;
    cursor: grab;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  `;
  div.innerHTML = `
    <div style="position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;
                background:#0d47a1;border:3px solid #fff;"></div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
                border-top:10px solid #0d47a1;"></div>
  `;
  return div;
}

function setMarker(lat, lng, { center = false, zoom = null } = {}) {
  if (!mapInstance || !googleRef) return;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    if (marker) {
      marker.map = null;
      marker = null;
    }
    return;
  }

  const { AdvancedMarkerElement } = googleRef.maps.marker;

  if (!marker) {
    marker = new AdvancedMarkerElement({
      map: mapInstance,
      position: { lat, lng },
      content: makePinHtml(),
      gmpDraggable: true,
    });

    marker.addListener("dragend", () => {
      const pos = marker.position;
      const newLat = roundCoord(pos.lat);
      const newLng = roundCoord(pos.lng);
      latLocal.value = newLat;
      lngLocal.value = newLng;
      emitChange();
    });
  } else {
    marker.position = { lat, lng };
  }

  if (center) {
    mapInstance.panTo({ lat, lng });
    if (zoom != null) mapInstance.setZoom(zoom);
    else if (mapInstance.getZoom() < 15) mapInstance.setZoom(15);
  }
}

function commitFromInputs() {
  const lat = Number(latLocal.value);
  const lng = Number(lngLocal.value);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    setMarker(lat, lng, { center: true });
    emitChange();
  } else if (!latLocal.value && !lngLocal.value) {
    if (marker) {
      marker.map = null;
      marker = null;
    }
    emitChange();
  }
}

function clearCoords() {
  latLocal.value = null;
  lngLocal.value = null;
  if (marker) {
    marker.map = null;
    marker = null;
  }
  emitChange();
}

async function geocodeSearch() {
  const q = String(searchQuery.value || "").trim();
  if (!q || !geocoder) return;
  searching.value = true;
  apiError.value = "";

  try {
    // Sesgar a Argentina para mejor relevancia
    const result = await geocoder.geocode({
      address: q,
      region: "AR",
      componentRestrictions: { country: "AR" },
    });

    const hits = result?.results || [];
    if (!hits.length) {
      apiError.value = "No se encontraron resultados para esa búsqueda.";
      return;
    }

    const hit = hits[0];
    const loc = hit.geometry?.location;
    if (!loc) return;
    const lat = roundCoord(loc.lat());
    const lng = roundCoord(loc.lng());
    latLocal.value = lat;
    lngLocal.value = lng;
    setMarker(lat, lng, { center: true, zoom: 16 });
    emitChange();
    emit("geocode", { lat, lng, display_name: hit.formatted_address || q });
  } catch (e) {
    console.warn("[BranchLocationPicker] geocode failed", e);
    apiError.value =
      "No se pudo geocodificar la dirección. Probá ingresando lat/lng a mano.";
  } finally {
    searching.value = false;
  }
}

async function initMap() {
  if (!mapEl.value || mapInstance) return;
  apiError.value = "";

  try {
    const google = await loadGoogleMaps(["maps", "marker", "geocoding"]);
    googleRef = google;

    geocoder = new google.maps.Geocoder();

    mapInstance = new google.maps.Map(mapEl.value, {
      center: hasCoords.value
        ? { lat: Number(latLocal.value), lng: Number(lngLocal.value) }
        : { lat: -31.5375, lng: -68.5364 },
      zoom: hasCoords.value ? 16 : 13,
      mapId: "DEMO_MAP_ID", // requerido para AdvancedMarker
      gestureHandling: "greedy",
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      clickableIcons: false,
    });

    // Click en mapa fija marker
    mapInstance.addListener("click", (e) => {
      const lat = roundCoord(e.latLng.lat());
      const lng = roundCoord(e.latLng.lng());
      latLocal.value = lat;
      lngLocal.value = lng;
      setMarker(lat, lng);
      emitChange();
    });

    await nextTick();

    if (hasCoords.value) {
      setMarker(Number(latLocal.value), Number(lngLocal.value), { center: true, zoom: 16 });
    }
  } catch (e) {
    console.warn("[BranchLocationPicker] no se pudo cargar Google Maps", e);
    apiError.value =
      "No se pudo cargar el mapa. Verificá la API key (VITE_GOOGLE_MAPS_API_KEY) y las restricciones de dominio.";
  }
}

onMounted(initMap);

onBeforeUnmount(() => {
  if (marker) {
    marker.map = null;
    marker = null;
  }
  mapInstance = null;
  geocoder = null;
});

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    const lat = v.latitude ?? null;
    const lng = v.longitude ?? null;
    if (Number(lat) !== Number(latLocal.value) || Number(lng) !== Number(lngLocal.value)) {
      latLocal.value = lat;
      lngLocal.value = lng;
      if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
        setMarker(Number(lat), Number(lng), { center: true });
      }
    }
  },
  { deep: true }
);

watch(
  () => props.initialAddress,
  (v) => {
    if (v && !searchQuery.value) searchQuery.value = v;
  }
);
</script>

<style scoped>
.bl {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bl-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.bl-search {
  flex: 1 1 auto;
}
.bl-search-btn {
  text-transform: none !important;
}

.bl-map {
  width: 100%;
  height: 360px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.bl-error {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-error), 0.10);
  color: rgb(var(--v-theme-error));
  font-size: 12.5px;
  font-weight: 460;
}

.bl-coords {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.bl-hint {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.4;
}
.bl-hint .v-icon {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

@media (max-width: 600px) {
  .bl-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .bl-search-btn {
    width: 100%;
  }
  .bl-map {
    height: 300px;
  }
  .bl-coords {
    grid-template-columns: 1fr 1fr;
  }
  .bl-coords > .v-btn {
    grid-column: 1 / -1;
  }
}
</style>
