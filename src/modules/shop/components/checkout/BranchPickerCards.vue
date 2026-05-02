<!-- Selector de sucursal con Google Maps + cards.
     - Mapa interactivo (pan/zoom/satélite) con todas las sucursales como markers.
     - Click en marker abre infoWindow con CTA "Elegir esta sucursal".
     - Click en card también selecciona y centra el mapa con zoom in. -->

<template>
  <div class="bp" v-if="branches.length">
    <!-- AVISO: una sola sucursal disponible -->
    <div v-if="branches.length === 1 && !props.modelValue" class="bp-single-alert">
      <div class="bp-single-alert-ico">
        <v-icon size="18">mdi-information-outline</v-icon>
      </div>
      <div class="bp-single-alert-text">
        <div class="bp-single-alert-title">
          Solo hay una sucursal con stock para tu carrito
        </div>
        <div class="bp-single-alert-sub">
          Elegí <strong>{{ branchName(branches[0]) }}</strong> abajo para confirmar
          el punto de retiro.
        </div>
      </div>
    </div>

    <!-- MAPA -->
    <div class="bp-map-wrap">
      <div ref="mapEl" class="bp-map-canvas" aria-label="Mapa de sucursales"></div>

      <div v-if="!hasAnyCoords" class="bp-map-empty">
        <v-icon size="22">mdi-map-marker-off-outline</v-icon>
        <div>
          <div class="bp-map-empty-title">Sin ubicación cargada</div>
          <div class="bp-map-empty-sub">
            Las sucursales todavía no tienen coordenadas geográficas.
            Configurá lat/lng desde el backoffice para ver el mapa.
          </div>
        </div>
      </div>

      <div v-else-if="!apiReady" class="bp-map-loading">
        <v-progress-circular indeterminate size="22" />
        <span>Cargando mapa…</span>
      </div>

      <div v-else-if="apiError" class="bp-map-empty">
        <v-icon size="22">mdi-alert-circle-outline</v-icon>
        <div>
          <div class="bp-map-empty-title">No se pudo cargar el mapa</div>
          <div class="bp-map-empty-sub">{{ apiError }}</div>
        </div>
      </div>

      <div v-if="apiReady && hasAnyCoords" class="bp-map-hint">
        <v-icon size="13">mdi-gesture-tap</v-icon>
        Tocá un marcador para elegir tu sucursal
      </div>
    </div>

    <!-- LISTA DE CARDS -->
    <div class="bp-list">
      <article
        v-for="b in branches"
        :key="b.id"
        class="bp-card"
        :class="{ 'is-selected': isSelected(b) }"
      >
        <button
          type="button"
          class="bp-body"
          :aria-pressed="isSelected(b)"
          @click="select(b, true)"
        >
          <div class="bp-head">
            <div class="bp-name-wrap">
              <div class="bp-name">{{ branchName(b) }}</div>
              <div v-if="branchHours(b)" class="bp-hours">
                <v-icon size="12">mdi-clock-outline</v-icon>
                {{ branchHours(b) }}
              </div>
            </div>

            <div class="bp-radio" :class="{ 'is-on': isSelected(b) }">
              <v-icon size="13" v-if="isSelected(b)">mdi-check</v-icon>
            </div>
          </div>

          <div v-if="branchAddress(b)" class="bp-address">
            <v-icon size="13">mdi-map-marker-outline</v-icon>
            <span>{{ branchAddress(b) }}</span>
          </div>

          <div v-if="branchPhone(b)" class="bp-phone">
            <v-icon size="13">mdi-phone-outline</v-icon>
            <span>{{ branchPhone(b) }}</span>
          </div>

          <div class="bp-actions">
            <span v-if="isSelected(b)" class="bp-pill bp-pill--ok">
              <v-icon size="13">mdi-check</v-icon>
              Sucursal seleccionada
            </span>
            <span v-else class="bp-pill bp-pill--cta">
              Elegir esta sucursal
            </span>

            <a
              v-if="mapsLink(b)"
              :href="mapsLink(b)"
              target="_blank"
              rel="noopener"
              class="bp-extlink"
              @click.stop
            >
              Cómo llegar
              <v-icon size="13">mdi-arrow-top-right</v-icon>
            </a>
          </div>
        </button>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import { loadGoogleMaps } from "@/app/utils/googleMapsLoader";

const props = defineProps({
  modelValue: { type: [Number, String, null], default: null },
  branches: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue"]);

const mapEl = ref(null);
const apiReady = ref(false);
const apiError = ref("");

let mapInstance = null;
let infoWindow = null;
const markersById = new Map();

/* ===== helpers ===== */
function toStr(v) {
  return String(v ?? "").trim();
}
function isSelected(b) {
  return Number(props.modelValue) === Number(b?.id);
}
function select(b, fromCard = false) {
  const id = Number(b?.id) || null;
  emit("update:modelValue", id);
  if (fromCard && id != null) flyToBranch(b);
}

function branchName(b) {
  return toStr(b?.name) || `Sucursal ${b?.id || ""}`.trim();
}
function branchAddress(b) {
  return toStr(b?.address1) || toStr(b?.address) || toStr(b?.street) || toStr(b?.location) || "";
}
function branchPhone(b) {
  return toStr(b?.phone) || toStr(b?.contact_phone) || "";
}
function branchHours(b) {
  return toStr(b?.hours) || toStr(b?.open_hours) || "";
}
function branchCity(b) {
  return [toStr(b?.city), toStr(b?.province)].filter(Boolean).join(", ");
}
function branchLatLng(b) {
  const rawLat = b?.latitude ?? b?.lat;
  const rawLng = b?.longitude ?? b?.lng;
  // Null/undefined/string vacío → sin coords (no las graficamos)
  if (rawLat === null || rawLat === undefined || rawLat === "") return null;
  if (rawLng === null || rawLng === undefined || rawLng === "") return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // (0, 0) es el océano — lo tratamos como sin coords
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}
function mapsLink(b) {
  const ll = branchLatLng(b);
  if (ll) return `https://www.google.com/maps?q=${ll.lat},${ll.lng}`;
  const addr = branchAddress(b);
  if (addr) {
    const full = [addr, branchCity(b), "Argentina"].filter(Boolean).join(", ");
    return `https://www.google.com/maps?q=${encodeURIComponent(full)}`;
  }
  return toStr(b?.maps_url) || "";
}

const hasAnyCoords = computed(() => props.branches.some((b) => branchLatLng(b)));

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ===== Google Maps setup ===== */
function makePinHtml(google, selected = false) {
  const color = selected ? "#1565C0" : "#0d47a1";
  const ringColor = selected ? "rgba(21, 101, 192, 0.35)" : "rgba(0, 0, 0, 0)";

  const div = document.createElement("div");
  div.className = "bp-pin";
  div.style.cssText = `
    position: relative;
    width: 28px;
    height: 36px;
    cursor: pointer;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.32));
  `;
  div.innerHTML = `
    <div style="
      position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 0 6px ${ringColor};
      transition:box-shadow .18s ease, transform .18s ease;
    "></div>
    <div style="
      position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
      border-top:10px solid ${color};
    "></div>
  `;
  return div;
}

function clearMarkers() {
  for (const m of markersById.values()) {
    if (m && m.map) m.map = null;
  }
  markersById.clear();
}

function flyToBranch(b) {
  if (!mapInstance) return;
  const ll = branchLatLng(b);
  if (!ll) return;
  mapInstance.panTo(ll);
  if (mapInstance.getZoom() < 15) mapInstance.setZoom(15);
  const marker = markersById.get(Number(b.id));
  if (marker && infoWindow) {
    openInfoWindow(b, marker);
  }
}

function fitToAllMarkers(google) {
  if (!mapInstance) return;
  const coords = props.branches.map(branchLatLng).filter(Boolean);
  if (!coords.length) return;
  if (coords.length === 1) {
    mapInstance.setCenter(coords[0]);
    mapInstance.setZoom(15);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  for (const c of coords) bounds.extend(c);
  mapInstance.fitBounds(bounds, 60);
  // Limitar zoom máximo
  const listener = google.maps.event.addListenerOnce(mapInstance, "idle", () => {
    if (mapInstance.getZoom() > 14) mapInstance.setZoom(14);
  });
}

function openInfoWindow(b, marker) {
  if (!infoWindow) return;
  const html = `
    <div class="bp-popup">
      <div class="bp-popup-name">${escapeHtml(branchName(b))}</div>
      ${branchAddress(b) ? `<div class="bp-popup-addr">${escapeHtml(branchAddress(b))}</div>` : ""}
      <button class="bp-popup-cta" data-branch-id="${b.id}">${
        isSelected(b) ? "Sucursal seleccionada" : "Elegir esta sucursal"
      }</button>
    </div>
  `;
  infoWindow.setContent(html);
  infoWindow.open({ map: mapInstance, anchor: marker });

  setTimeout(() => {
    const cta = document.querySelector(`.bp-popup-cta[data-branch-id="${b.id}"]`);
    if (cta) {
      cta.addEventListener("click", () => {
        select(b, false);
        infoWindow.close();
      }, { once: true });
    }
  }, 0);
}

function renderMarkers(google) {
  if (!mapInstance) return;
  clearMarkers();

  const { AdvancedMarkerElement } = google.maps.marker;

  for (const b of props.branches) {
    const ll = branchLatLng(b);
    if (!ll) continue;

    const pinHtml = makePinHtml(google, isSelected(b));

    const marker = new AdvancedMarkerElement({
      map: mapInstance,
      position: ll,
      title: branchName(b),
      content: pinHtml,
    });

    marker.addListener("click", () => {
      select(b, false);
      openInfoWindow(b, marker);
    });

    markersById.set(Number(b.id), marker);
  }
}

function refreshSelectedIcons(google) {
  if (!mapInstance) return;
  for (const b of props.branches) {
    const m = markersById.get(Number(b.id));
    if (!m) continue;
    m.content = makePinHtml(google, isSelected(b));
  }
}

async function initMap() {
  if (!mapEl.value) return;
  if (mapInstance) return;

  apiError.value = "";
  try {
    const google = await loadGoogleMaps(["maps", "marker"]);

    const SAN_JUAN_CENTER = { lat: -31.5375, lng: -68.5364 }; // San Juan capital, Argentina

    mapInstance = new google.maps.Map(mapEl.value, {
      center: SAN_JUAN_CENTER,
      zoom: 12,
      mapId: "DEMO_MAP_ID", // requerido para AdvancedMarker
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      clickableIcons: false,
    });

    // Re-centrar después de que el container alcance su tamaño final
    // (sino el mapa puede mostrar zona random)
    setTimeout(() => {
      if (!mapInstance) return;
      mapInstance.setCenter(SAN_JUAN_CENTER);
    }, 80);

    infoWindow = new google.maps.InfoWindow({
      maxWidth: 260,
      pixelOffset: new google.maps.Size(0, -8),
    });

    apiReady.value = true;

    await nextTick();
    renderMarkers(google);
    fitToAllMarkers(google);

    // ❌ NO auto-seleccionamos. Aunque haya una sola sucursal disponible,
    // el cliente tiene que elegirla explícitamente para confirmar que está
    // de acuerdo con el punto de retiro (ver banner "Hay una sola sucursal..."
    // en el template).

    // Watcher: cuando cambia la selección, re-pintar pins
    watch(
      () => props.modelValue,
      () => refreshSelectedIcons(google)
    );

    // Watcher: cuando cambia la lista de sucursales, re-render
    watch(
      () => props.branches,
      () => {
        renderMarkers(google);
        fitToAllMarkers(google);
      },
      { deep: true }
    );
  } catch (e) {
    console.warn("[BranchPickerCards] no se pudo cargar Google Maps", e);
    apiError.value = "Configurá la API key (VITE_GOOGLE_MAPS_API_KEY) o revisá las restricciones de dominio.";
  }
}

onMounted(initMap);

onBeforeUnmount(() => {
  clearMarkers();
  if (infoWindow) infoWindow.close();
  mapInstance = null;
  infoWindow = null;
});
</script>

<style scoped>
.bp,
.bp :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.bp {
  width: 100%;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== Aviso de sucursal única ===== */
.bp-single-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.06) 0%, rgba(21, 101, 192, 0.10) 100%);
  border: 1px solid rgba(21, 101, 192, 0.18);
  border-radius: 12px;
}
.bp-single-alert-ico {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(21, 101, 192, 0.14);
  color: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.bp-single-alert-text {
  min-width: 0;
}
.bp-single-alert-title {
  font-weight: 540;
  font-size: 13.5px;
  letter-spacing: -0.005em;
  color: rgba(17, 24, 39, 0.92);
}
.bp-single-alert-sub {
  margin-top: 3px;
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.65);
  line-height: 1.4;
}

/* ===== Mapa ===== */
.bp-map-wrap {
  position: relative;
  width: 100%;
  height: 360px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(17, 24, 39, 0.10);
  background: #f3f4f6;
  box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.02);
}

.bp-map-canvas {
  width: 100%;
  height: 100%;
}

.bp-map-empty,
.bp-map-loading {
  position: absolute;
  inset: 0;
  z-index: 401;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  text-align: left;
  color: rgba(17, 24, 39, 0.7);
}
.bp-map-loading {
  flex-direction: row;
  font-size: 13px;
  font-weight: 460;
}
.bp-map-empty-title {
  font-weight: 540;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
}
.bp-map-empty-sub {
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.6);
  margin-top: 3px;
  max-width: 320px;
  line-height: 1.4;
}

.bp-map-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 401;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(17, 24, 39, 0.86);
  color: #fff;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 460;
  letter-spacing: 0.01em;
  pointer-events: none;
  white-space: nowrap;
}

/* InfoWindow custom */
:deep(.bp-popup) {
  font-family: "Inter", system-ui, sans-serif;
  padding: 4px 4px 0;
}
:deep(.bp-popup-name) {
  font-weight: 540;
  font-size: 13.5px;
  color: rgba(17, 24, 39, 0.94);
  letter-spacing: -0.005em;
}
:deep(.bp-popup-addr) {
  font-size: 12px;
  color: rgba(17, 24, 39, 0.6);
  font-weight: 400;
  margin-top: 2px;
  max-width: 220px;
}
:deep(.bp-popup-cta) {
  margin-top: 8px;
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 7px 12px;
  border-radius: 8px;
  background: rgb(21, 101, 192);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.005em;
  width: 100%;
  font-family: inherit;
  transition: background 0.16s ease;
}
:deep(.bp-popup-cta:hover) {
  background: rgb(13, 71, 161);
}

/* Botón de cierre del InfoWindow más limpio */
:deep(.gm-ui-hover-effect) {
  top: 4px !important;
  right: 4px !important;
}

/* ===== Cards ===== */
.bp-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.bp-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1.5px solid rgba(17, 24, 39, 0.10);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.bp-card:hover {
  border-color: rgba(21, 101, 192, 0.22);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}
.bp-card.is-selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.14);
}

.bp-body {
  appearance: none;
  background: #fff;
  border: 0;
  cursor: pointer;
  text-align: left;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  transition: background 0.18s ease;
  font: inherit;
  color: inherit;
}
.bp-body:hover {
  background: rgba(21, 101, 192, 0.03);
}
.bp-body:focus-visible {
  outline: none;
  background: rgba(21, 101, 192, 0.05);
  box-shadow: inset 0 0 0 2px rgba(21, 101, 192, 0.32);
}
.bp-card.is-selected .bp-body {
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.04) 0%, rgba(21, 101, 192, 0.10) 100%);
}

.bp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.bp-name-wrap { min-width: 0; }
.bp-name {
  font-weight: 540;
  font-size: 15px;
  letter-spacing: -0.005em;
  color: rgba(17, 24, 39, 0.94);
  line-height: 1.2;
}
.bp-hours {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.55);
  margin-top: 3px;
}

.bp-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(17, 24, 39, 0.18);
  background: #fff;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #fff;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.bp-radio.is-on {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.bp-address,
.bp-phone {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.65);
  line-height: 1.35;
}
.bp-address .v-icon,
.bp-phone .v-icon {
  color: rgba(17, 24, 39, 0.4);
  flex: 0 0 auto;
}

.bp-actions {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.bp-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 460;
  letter-spacing: 0.005em;
}
.bp-pill--cta {
  background: rgba(21, 101, 192, 0.08);
  color: rgb(var(--v-theme-primary));
  border: 1px dashed rgba(21, 101, 192, 0.32);
}
.bp-body:hover .bp-pill--cta {
  background: rgba(21, 101, 192, 0.14);
  border-style: solid;
}
.bp-pill--ok {
  background: rgb(var(--v-theme-primary));
  color: #fff;
}

.bp-extlink {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 460;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: gap 0.16s ease;
}
.bp-extlink:hover {
  gap: 5px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 700px) {
  .bp,
  .bp-list {
    gap: 10px;
  }
  .bp-map-wrap {
    height: 240px;
    border-radius: 12px;
  }
  .bp-list {
    grid-template-columns: 1fr;
  }
  .bp-map-hint {
    font-size: 11px;
    padding: 5px 10px;
    bottom: 10px;
  }
  .bp-single-alert {
    padding: 10px 12px;
    gap: 10px;
  }
  .bp-card {
    border-radius: 12px;
    border-width: 1px;
  }
  .bp-body {
    padding: 12px 12px 10px;
  }
}

@media (max-width: 420px) {
  .bp-map-wrap {
    height: 200px;
  }
  .bp-body {
    padding: 10px 10px 8px;
  }
}
</style>
