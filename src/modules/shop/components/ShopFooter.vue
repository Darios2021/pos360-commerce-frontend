<!-- src/modules/shop/components/ShopFooter.vue -->
<template>
  <v-sheet tag="footer" class="shop-footer">
    <div class="footer-inner">
      <div class="footer-shell">

        <div class="footer-grid">

          <!-- BRAND -->
          <section class="footer-brand">
            <router-link to="/shop" class="brand-link" aria-label="Inicio">
              <div class="brand-logo-box">
                <img
                  v-if="logoUrl"
                  :src="logoUrl"
                  :alt="branding.name"
                  class="brand-logo"
                />
                <div v-else class="brand-fallback">
                  <div class="brand-title">{{ branding.name }}</div>
                </div>
              </div>
            </router-link>

            <p class="brand-desc">
              Seguridad electrónica, hogar, sistemas y servicio técnico.
              Asesoramiento personalizado en San Juan.
            </p>

            <ul class="brand-contact">
              <li>
                <v-icon size="14">mdi-clock-outline</v-icon>
                <span>Lun a Vie · 9 a 13 / 17 a 21 hs</span>
              </li>
              <li>
                <v-icon size="14">mdi-phone-outline</v-icon>
                <a :href="phoneTel" class="brand-contact-link">+54 9 264 439 2150</a>
              </li>
              <li>
                <v-icon size="14">mdi-email-outline</v-icon>
                <a :href="emailMailto" class="brand-contact-link">contacto@sanjuantecnologia.com</a>
              </li>
            </ul>

            <div class="brand-actions">
              <a
                class="footer-pill"
                :href="instagramUrl"
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
              >
                <v-icon size="15">mdi-instagram</v-icon>
                <span>Instagram</span>
              </a>

              <a
                class="footer-pill footer-pill--wa"
                :href="whatsappUrl"
                target="_blank"
                rel="noopener"
                aria-label="WhatsApp"
              >
                <v-icon size="15">mdi-whatsapp</v-icon>
                <span>WhatsApp</span>
              </a>
            </div>
          </section>


          <!-- TIENDA -->
          <section class="footer-col">
            <div class="footer-kicker">Tienda</div>

            <ul class="footer-links">
              <li><router-link to="/shop" class="footer-link">Inicio</router-link></li>
              <li><router-link to="/shop/categories" class="footer-link">Categorías</router-link></li>
              <li><router-link to="/shop/cart" class="footer-link">Carrito</router-link></li>
              <li><router-link to="/shop/account/favorites" class="footer-link">Favoritos</router-link></li>
              <li><router-link to="/shop/account/orders" class="footer-link">Mis compras</router-link></li>
            </ul>
          </section>


          <!-- AYUDA -->
          <section class="footer-col">
            <div class="footer-kicker">Ayuda</div>

            <ul class="footer-links">
              <li><router-link to="/shop/login" class="footer-link">Ingresar</router-link></li>
              <li><router-link to="/shop/account/orders" class="footer-link">Seguir mi pedido</router-link></li>
              <li>
                <a :href="whatsappUrl" target="_blank" rel="noopener" class="footer-link">
                  Atención por WhatsApp
                </a>
              </li>
              <li><router-link to="/shop/servicio-tecnico" class="footer-link">Servicio técnico</router-link></li>
              <li><router-link to="/shop/seguridad" class="footer-link">Seguridad electrónica</router-link></li>
            </ul>
          </section>


          <!-- SUCURSALES -->
          <section class="footer-col footer-col-branches">
            <div class="footer-kicker">Sucursales</div>

            <div class="branches-list">
              <a class="branch-card" :href="rivadaviaMapsUrl" target="_blank" rel="noopener">
                <div class="branch-top">
                  <div class="branch-name">Rivadavia</div>
                  <v-icon size="16" class="branch-arrow">mdi-arrow-top-right</v-icon>
                </div>
                <div class="branch-location">
                  <v-icon size="14">mdi-map-marker-outline</v-icon>
                  <span>CESAP · Calle Los Jesuitas</span>
                </div>
              </a>

              <a class="branch-card" :href="chimbasMapsUrl" target="_blank" rel="noopener">
                <div class="branch-top">
                  <div class="branch-name">Chimbas</div>
                  <v-icon size="16" class="branch-arrow">mdi-arrow-top-right</v-icon>
                </div>
                <div class="branch-location">
                  <v-icon size="14">mdi-map-marker-outline</v-icon>
                  <span>Chango Más · Local 2 · Av. Benavidez</span>
                </div>
              </a>
            </div>
          </section>
        </div>


        <!-- Divider -->
        <div class="footer-divider"></div>


        <!-- Bottom -->
        <div class="footer-bottom">
          <div class="footer-copy">
            © {{ year }} {{ branding.name }} · Todos los derechos reservados
          </div>

          <div class="footer-bottom-links">
            <router-link to="/shop/legal/terminos" class="footer-mini-link">Términos</router-link>
            <span class="footer-bottom-sep" aria-hidden="true">·</span>
            <router-link to="/shop/legal/privacidad" class="footer-mini-link">Privacidad</router-link>
            <span class="footer-bottom-sep" aria-hidden="true">·</span>
            <router-link to="/shop/legal/como-comprar" class="footer-mini-link">Cómo comprar</router-link>
          </div>

          <button class="footer-top" type="button" @click="toTop" aria-label="Ir arriba">
            <v-icon size="14">mdi-arrow-up</v-icon>
            <span>Arriba</span>
          </button>
        </div>

      </div>
    </div>
  </v-sheet>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { getShopBranding } from "@/modules/shop/service/shop.public.api";

const year = new Date().getFullYear();

const instagramUrl = "https://www.instagram.com/sanjuan.tecnologia/";
const rivadaviaMapsUrl = "https://maps.app.goo.gl/jxjPeb3JdsM9sprR6";
const chimbasMapsUrl = "https://maps.app.goo.gl/r95QAotu3v6ZKqhMA";

const phoneTel = "tel:+5492644392150";
const emailMailto = "mailto:contacto@sanjuantecnologia.com";
const whatsappUrl = "https://wa.me/5492644392150";

const branding = ref({
  name: "San Juan Tecnología",
  logo_url: "",
  updated_at: null,
});

function withVersion(url, v) {
  if (!url) return "";
  if (!v) return url;
  return url + "?v=" + v;
}

const logoUrl = computed(() => withVersion(branding.value.logo_url, branding.value.updated_at));

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b) branding.value = { ...branding.value, ...b };
  } catch {}
});
</script>


<style scoped>
/* =========================
   FOOTER
========================= */

.shop-footer {
  width: 100%;
  background: rgb(var(--v-theme-primary));
  color: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
}

.shop-footer,
.shop-footer :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.footer-inner {
  width: 100%;
  padding: 0 16px;
}

.footer-shell {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 36px 0 20px;
}

/* =========================
   GRID
========================= */

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.9fr 1fr;
  gap: 36px;
  align-items: flex-start;
}

/* =========================
   BRAND
========================= */

.brand-link {
  display: inline-block;
  text-decoration: none;
}

.brand-logo-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 12px;
  padding: 8px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.brand-logo {
  max-height: 48px;
  max-width: 220px;
  object-fit: contain;
  display: block;
}

.brand-fallback {
  font-weight: 540;
  font-size: 16px;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.01em;
}

.brand-desc {
  margin: 16px 0 14px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.78);
  max-width: 360px;
}

.brand-contact {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.brand-contact li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 400;
}

.brand-contact-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.16s ease;
}

.brand-contact-link:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.brand-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 460;
  letter-spacing: 0.005em;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.footer-pill:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.26);
  transform: translateY(-1px);
}

.footer-pill--wa:hover {
  background: rgba(37, 211, 102, 0.18);
  border-color: rgba(37, 211, 102, 0.38);
}

/* =========================
   COLUMNAS LINKS
========================= */

.footer-col {
  min-width: 0;
}

.footer-kicker {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 16px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-link {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  transition: color 0.16s ease, transform 0.16s ease;
  padding: 1px 0;
}

.footer-link:hover {
  color: #fff;
  transform: translateX(2px);
}

/* =========================
   SUCURSALES
========================= */

.branches-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-card {
  display: block;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  text-decoration: none;
  color: rgba(255, 255, 255, 0.92);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.branch-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.branch-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.branch-name {
  font-weight: 500;
  font-size: 13.5px;
  letter-spacing: 0.005em;
}

.branch-arrow {
  color: rgba(255, 255, 255, 0.55);
  transition: transform 0.18s ease, color 0.18s ease;
}

.branch-card:hover .branch-arrow {
  color: #fff;
  transform: translate(2px, -2px);
}

.branch-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

/* =========================
   DIVIDER + BOTTOM
========================= */

.footer-divider {
  margin: 28px 0 16px;
  height: 1px;
  background: rgba(255, 255, 255, 0.10);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-copy {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.005em;
}

.footer-bottom-links {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.footer-mini-link {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.62);
  text-decoration: none;
  transition: color 0.16s ease;
}

.footer-mini-link:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-bottom-sep {
  color: rgba(255, 255, 255, 0.28);
  font-size: 12px;
}

.footer-top {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 999px;
  padding: 6px 12px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 460;
  letter-spacing: 0.005em;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.footer-top:hover {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.28);
  color: #fff;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1100px) {
  .footer-grid {
    grid-template-columns: 1.2fr 0.9fr 0.9fr 1.2fr;
    gap: 28px;
  }
}

@media (max-width: 900px) {
  .footer-shell {
    padding: 28px 0 18px;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 28px 24px;
  }

  .footer-col-branches {
    grid-column: 1 / -1;
  }

  .brand-desc {
    max-width: 100%;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
}

@media (max-width: 560px) {
  .footer-shell {
    padding: 24px 0 16px;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 26px;
  }

  .footer-col-branches {
    grid-column: auto;
  }

  .footer-divider {
    margin: 22px 0 14px;
  }
}
</style>
