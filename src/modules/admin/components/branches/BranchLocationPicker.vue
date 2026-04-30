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
        label="Buscar negocio, dirección o lugar"
        placeholder="Ej. San Juan Tecnología, Av. Libertador 1234, etc."
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

const hasCoords = computed(() => {
  const lat = latLocal.value;
  const lng = lngLocal.value;
  // Null/undefined/string vacío → sin coords
  if (lat === null || lat === undefined || lat === "") return false;
  if (lng === null || lng === undefined || lng === "") return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return false;
  // (0, 0) es el océano Atlántico — lo tratamos como "sin coords"
  if (nLat === 0 && nLng === 0) return false;
  return true;
});

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
  if (!q || !googleRef) return;
  searching.value = true;
  apiError.value = "";

  // Bounds de la provincia de San Juan, Argentina — sesga la búsqueda
  // para que "San Juan" no devuelva Puerto Rico o Filipinas.
  const sanJuanBounds = new googleRef.maps.LatLngBounds(
    { lat: -32.55, lng: -69.85 },
    { lat: -28.40, lng: -66.95 }
  );

  try {
    // 1) PRIMERO intentamos con Places API (busca negocios + direcciones).
    //    Cubre queries tipo "San Juan Tecnología" o "Farmacia Lugones".
    let hit = await tryPlacesSearch(q, sanJuanBounds);

    // 2) Si Places no encuentra, fallback a Geocoding (solo direcciones).
    if (!hit && geocoder) {
      hit = await tryGeocodeSearch(q, sanJuanBounds);
    }

    if (!hit) {
      apiError.value = "No se encontraron resultados para esa búsqueda.";
      return;
    }

    const lat = roundCoord(hit.lat);
    const lng = roundCoord(hit.lng);
    latLocal.value = lat;
    lngLocal.value = lng;
    setMarker(lat, lng, { center: true, zoom: 16 });
    emitChange();
    // Pasamos al padre todo lo que devolvió Places (si vino), así puede
    // autocompletar campos vacíos del form sin pisar lo escrito.
    emit("geocode", {
      lat,
      lng,
      display_name: hit.display_name || q,
      name: hit.name || "",
      address: hit.address || "",
      phone: hit.phone || "",
      hours: hit.hours || "",
      maps_url: hit.maps_url || "",
      website: hit.website || "",
    });
  } catch (e) {
    console.warn("[BranchLocationPicker] search failed", e);
    apiError.value =
      "No se pudo encontrar el lugar. Probá ingresando la dirección o lat/lng a mano.";
  } finally {
    searching.value = false;
  }
}

/** Búsqueda con Places API (cubre negocios + direcciones).
 *  Devuelve TODOS los datos públicos del lugar (teléfono, horarios, etc.)
 *  para que el form padre pueda autocompletar campos vacíos. */
async function tryPlacesSearch(q, bounds) {
  try {
    const placesLib = await loadGoogleMaps(["places"]);
    const Place = placesLib?.maps?.places?.Place;
    if (!Place || typeof Place.searchByText !== "function") return null;

    const { places } = await Place.searchByText({
      textQuery: q,
      fields: [
        "displayName",
        "location",
        "formattedAddress",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "regularOpeningHours",
        "googleMapsURI",
        "websiteURI",
      ],
      locationBias: bounds,
      region: "AR",
      language: "es",
      maxResultCount: 5,
    });

    if (!places || !places.length) return null;
    const p = places[0];
    const loc = p.location;
    if (!loc) return null;

    return {
      lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
      lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
      display_name:
        (p.formattedAddress ? `${p.displayName} · ${p.formattedAddress}` : p.displayName) ||
        q,
      // Datos extra para autocompletar el form (sólo se usan si el campo
      // del form está vacío, no pisa lo que el user ya escribió):
      name: p.displayName || "",
      address: p.formattedAddress || "",
      phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
      hours: summarizeHours(p.regularOpeningHours),
      maps_url: p.googleMapsURI || p.googleMapsUri || "",
      website: p.websiteURI || p.websiteUri || "",
    };
  } catch (e) {
    console.warn("[BranchLocationPicker] Places search failed", e?.message || e);
    return null;
  }
}

/** Convierte el array regularOpeningHours.weekdayDescriptions de Google
 *  a un string corto para mostrar en el form. */
function summarizeHours(opening) {
  if (!opening) return "";
  const arr = opening.weekdayDescriptions;
  if (!Array.isArray(arr) || !arr.length) return "";
  // Si todos los días tienen el mismo horario, devolver un resumen.
  // Sino, devolver una concatenación corta.
  const unique = new Set(
    arr.map((s) => String(s || "").replace(/^[^:]+:\s*/, "").trim())
  );
  if (unique.size === 1) {
    return `Todos los días · ${[...unique][0]}`;
  }
  // Devolver primer día abierto como referencia (string corto).
  const firstOpen = arr.find((s) => !/cerrado|closed/i.test(s));
  return firstOpen || arr[0] || "";
}

/** Fallback: Geocoding (solo direcciones). */
async function tryGeocodeSearch(q, bounds) {
  try {
    const result = await geocoder.geocode({
      address: q,
      region: "AR",
      bounds,
      componentRestrictions: { country: "AR" },
    });
    const hits = result?.results || [];
    if (!hits.length) return null;
    const hit = hits[0];
    const loc = hit.geometry?.location;
    if (!loc) return null;
    return {
      lat: loc.lat(),
      lng: loc.lng(),
      display_name: hit.formatted_address || q,
    };
  } catch (e) {
    console.warn("[BranchLocationPicker] Geocoding failed", e?.message || e);
    return null;
  }
}

// Centro default: San Juan capital, Argentina
const SAN_JUAN_CENTER = { lat: -31.5375, lng: -68.5364 };

let resizeObserver = null;

function recenterMap() {
  if (!mapInstance || !googleRef) return;

  // Forzar resize del mapa por si el contenedor cambió de tamaño
  // (esto evita que Google Maps quede mostrando una zona random
  // cuando el v-dialog termina su transición de apertura).
  googleRef.maps.event.trigger(mapInstance, "resize");

  const center = hasCoords.value
    ? { lat: Number(latLocal.value), lng: Number(lngLocal.value) }
    : SAN_JUAN_CENTER;

  mapInstance.setCenter(center);
  mapInstance.setZoom(hasCoords.value ? 16 : 13);

  if (hasCoords.value) {
    setMarker(center.lat, center.lng, { center: false });
  }
}

async function initMap() {
  if (!mapEl.value || mapInstance) return;
  apiError.value = "";

  try {
    const google = await loadGoogleMaps(["maps", "marker", "geocoding"]);
    googleRef = google;

    geocoder = new google.maps.Geocoder();

    const initialCenter = hasCoords.value
      ? { lat: Number(latLocal.value), lng: Number(lngLocal.value) }
      : SAN_JUAN_CENTER;
    const initialZoom = hasCoords.value ? 16 : 13;

    mapInstance = new google.maps.Map(mapEl.value, {
      center: initialCenter,
      zoom: initialZoom,
      mapId: "DEMO_MAP_ID",
      gestureHandling: "greedy",
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      clickableIcons: false,
    });

    mapInstance.addListener("click", (e) => {
      const lat = roundCoord(e.latLng.lat());
      const lng = roundCoord(e.latLng.lng());
      latLocal.value = lat;
      lngLocal.value = lng;
      setMarker(lat, lng);
      emitChange();
    });

    // ResizeObserver: cuando el v-dialog termine la transición y
    // el contenedor cambie de tamaño, re-centramos el mapa.
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        recenterMap();
      });
      resizeObserver.observe(mapEl.value);
    }

    // Backup: recentros forzados a varios tiempos para cubrir la transición
    // del v-dialog (~300ms) y posibles delays de layout.
    setTimeout(recenterMap, 60);
    setTimeout(recenterMap, 200);
    setTimeout(recenterMap, 400);
    setTimeout(recenterMap, 700);
    setTimeout(recenterMap, 1200);
    setTimeout(recenterMap, 1800);
  } catch (e) {
    console.warn("[BranchLocationPicker] no se pudo cargar Google Maps", e);
    apiError.value =
      "No se pudo cargar el mapa. Verificá la API key (VITE_GOOGLE_MAPS_API_KEY) y las restricciones de dominio.";
  }
}

onMounted(initMap);

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
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

// Exponemos recenterMap para que el componente padre (dialog) pueda
// forzar el recentro cuando la transición de apertura termine.
defineExpose({ recenterMap });

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
