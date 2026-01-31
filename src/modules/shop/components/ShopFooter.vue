<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopFooter.vue -->
<template>
  <v-sheet tag="footer" class="shop-footer">
    <v-container fluid class="footer-inner">
      <v-row class="py-10" justify="space-between">
        <!-- BRAND -->
        <v-col cols="12" md="4">
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar :size="isMobile ? 64 : 84" class="brand-badge">
              <template v-if="branding.logo_url">
                <img :src="logoUrl" :alt="branding.name" class="brand-logo" />
              </template>
              <span v-else class="font-weight-black">360</span>
            </v-avatar>

            <div class="d-flex flex-column">
              <div class="brand-title">{{ branding.name || "POS360" }}</div>
              <div class="brand-subtitle">Ecommerce · Inventario · POS</div>
            </div>
          </div>

          <div class="brand-desc mb-5">
            Comprá tecnología con una experiencia rápida y segura. Catálogo actualizado,
            promos destacadas y retiro/entrega al finalizar.
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip size="small" class="pill" prepend-icon="mdi-truck-fast-outline">
              Envíos / Retiro
            </v-chip>
            <v-chip size="small" class="pill" prepend-icon="mdi-credit-card-outline">
              Múltiples pagos
            </v-chip>
            <v-chip size="small" class="pill" prepend-icon="mdi-shield-check-outline">
              Compra segura
            </v-chip>
          </div>
        </v-col>

        <!-- LINKS -->
        <v-col cols="12" sm="6" md="2">
          <div class="section-title">Tienda</div>
          <ul class="footer-list">
            <li><a @click.prevent="go('/shop')">Inicio</a></li>
            <li><a @click.prevent="go('/shop')">Productos</a></li>
            <li><a @click.prevent="go('/shop')">Categorías</a></li>
            <li><a @click.prevent="go('/shop')">Ofertas</a></li>
          </ul>
        </v-col>

        <v-col cols="12" sm="6" md="2">
          <div class="section-title">Cuenta</div>
          <ul class="footer-list">
            <li><a @click.prevent="go('/auth/login')">Ingresar</a></li>
            <li><a @click.prevent="go('/auth/register')">Registrarse</a></li>
            <li><a @click.prevent="go('/orders')">Mis pedidos</a></li>
            <li><a @click.prevent="go('/shop/cart')">Carrito</a></li>
          </ul>
        </v-col>

        <!-- CONTACT -->
        <v-col cols="12" md="4">
          <div class="section-title">Contacto</div>

          <div class="contact">
            <v-icon size="18">mdi-map-marker</v-icon>
            <span>San Juan, Argentina</span>
          </div>
          <div class="contact">
            <v-icon size="18">mdi-email</v-icon>
            <span>contacto@pos360.local</span>
          </div>
          <div class="contact">
            <v-icon size="18">mdi-phone</v-icon>
            <span>+54 264 000-0000</span>
          </div>

          <div class="mt-6">
            <div class="section-title">Pagos</div>
            <div class="d-flex flex-wrap ga-2">
              <span class="pay-chip">VISA</span>
              <span class="pay-chip">Mastercard</span>
              <span class="pay-chip">Mercado Pago</span>
              <span class="pay-chip">Transferencia</span>
            </div>
          </div>
        </v-col>
      </v-row>

      <div class="divider" />

      <div class="bottom py-4 d-flex flex-column flex-md-row align-center justify-space-between">
        <div class="copy">© {{ year }} {{ branding.name || "POS360" }} · Todos los derechos reservados</div>

        <div class="d-flex align-center ga-2">
          <v-btn icon variant="text" class="social" aria-label="Facebook">
            <v-icon>mdi-facebook</v-icon>
          </v-btn>
          <v-btn icon variant="text" class="social" aria-label="Instagram">
            <v-icon>mdi-instagram</v-icon>
          </v-btn>
          <v-btn icon variant="text" class="social" aria-label="LinkedIn">
            <v-icon>mdi-linkedin</v-icon>
          </v-btn>

          <v-btn size="small" variant="tonal" class="to-top" prepend-icon="mdi-arrow-up" @click="toTop">
            Arriba
          </v-btn>
        </div>
      </div>
    </v-container>
  </v-sheet>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { getShopBranding } from "@/modules/shop/service/shop.public.api";

const router = useRouter();
const year = new Date().getFullYear();

const { smAndDown } = useDisplay();
const isMobile = computed(() => !!smAndDown.value);

const branding = ref({
  name: "POS360",
  logo_url: "",
  favicon_url: "",
  updated_at: null,
});

function go(path) {
  router.push(path);
}

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function withVersion(url, v) {
  const u = String(url || "").trim();
  if (!u) return "";
  const ver = String(v || "").trim();
  if (!ver) return u;

  try {
    const parsed = new URL(u, window.location.origin);
    if (!parsed.searchParams.has("v")) parsed.searchParams.set("v", ver);
    return parsed.toString();
  } catch {
    return u.includes("?") ? `${u}&v=${encodeURIComponent(ver)}` : `${u}?v=${encodeURIComponent(ver)}`;
  }
}

const logoUrl = computed(() => withVersion(branding.value?.logo_url, branding.value?.updated_at));

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b && typeof b === "object") branding.value = { ...branding.value, ...b };
  } catch {}
});
</script>

<style scoped>
.shop-footer {
  width: 100%;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary)) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.footer-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
}

/* logo sin avatar */
.brand-badge {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
.brand-badge :deep(.v-avatar__underlay) {
  display: none !important;
}
.brand-logo {
  width: 100%;
  height: 100%;
  display: block;
  padding: 0 !important;
  object-fit: contain;
  object-position: center;
}

.brand-title {
  font-family: "Orbitron", sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.12rem;
}
.brand-subtitle {
  opacity: 0.9;
  font-size: 0.85rem;
}
.brand-desc {
  opacity: 0.92;
  font-size: 0.92rem;
  line-height: 1.45;
}

.section-title {
  font-weight: 900;
  margin-bottom: 12px;
}

.footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-list li {
  margin-bottom: 10px;
}
.footer-list a {
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
}
.footer-list a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.contact {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.92;
  margin-bottom: 10px;
}

.pay-chip {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 800;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.14);
}

.copy {
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.82);
}

.social {
  color: rgba(255, 255, 255, 0.92) !important;
}

.to-top {
  color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
