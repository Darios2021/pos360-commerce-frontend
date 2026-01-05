<!-- src/modules/shop/components/ShopFooter.vue -->
<template>
  <v-sheet tag="footer" class="shop-footer">
    <div class="footer-top-glow" />

    <v-container fluid class="footer-inner">
      <v-row class="py-10" justify="space-between">
        <!-- ================= BRAND ================= -->
        <v-col cols="12" md="4">
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar size="44" class="brand-badge">
              <span class="font-weight-black">360</span>
            </v-avatar>

            <div class="d-flex flex-column">
              <div class="brand-title">POS360</div>
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

        <!-- ================= LINKS ================= -->
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

        <!-- ================= CONTACT + PAYMENTS ================= -->
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
        <div class="copy">
          © {{ year }} POS360 · Todos los derechos reservados
        </div>

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

          <v-btn
            size="small"
            variant="tonal"
            class="to-top"
            prepend-icon="mdi-arrow-up"
            @click="toTop"
          >
            Arriba
          </v-btn>
        </div>
      </div>
    </v-container>
  </v-sheet>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
const year = new Date().getFullYear();

function go(path) {
  router.push(path);
}

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<style scoped>
/* ✅ FIX REAL: el 1px blanco viene del fondo global (html/body/vuetify app) */
:global(html),
:global(body) {
  margin: 0 !important;
  padding: 0 !important;
  background: #1488d1 !important; /* mismo color del header/footer */
}

:global(#app),
:global(.v-application),
:global(.v-application__wrap) {
  background: #1488d1 !important;
}

/* ✅ footer alineado con el header */
.shop-footer {
  --ml-blue: #1488d1;
  --ml-white: #ffffff;
  --ml-border: rgba(255, 255, 255, 0.14);

  position: relative;
  z-index: 1;
  width: 100%;
  color: var(--ml-white);
  background: var(--ml-blue) !important;
  border-top: 1px solid var(--ml-border);
  overflow: hidden;
}

/* glow superior */
.footer-top-glow {
  position: absolute;
  inset: -2px 0 auto 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
  opacity: 0.6;
}

.footer-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  padding-left: 0;
  padding-right: 0;
}

/* brand */
.brand-badge {
  background: rgba(255, 255, 255, 0.16) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  color: #fff !important;
}

.brand-title {
  font-weight: 1000;
  letter-spacing: 0.2px;
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
  max-width: 460px;
}

/* pills */
.pill {
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #fff !important;
}

/* sections */
.section-title {
  font-weight: 950;
  font-size: 0.92rem;
  letter-spacing: 0.2px;
  margin-bottom: 12px;
  color: #fff;
}

/* links */
.footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-list li {
  margin-bottom: 10px;
}
.footer-list a {
  cursor: pointer;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.92rem;
  transition: color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  opacity: 0.92;
}
.footer-list a:hover {
  color: #fff;
  opacity: 1;
  transform: translateX(2px);
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* contact */
.contact {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.92;
  font-size: 0.92rem;
  margin-bottom: 10px;
}

/* payments */
.pay-chip {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.78rem;
  letter-spacing: 0.2px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.95);
}

/* divider */
.divider {
  height: 1px;
  width: 100%;
  background: rgba(255, 255, 255, 0.14);
}

/* bottom */
.bottom {
  opacity: 0.94;
}
.copy {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.86rem;
}

/* socials */
.social {
  color: rgba(255, 255, 255, 0.85) !important;
}
.social:hover {
  color: #fff !important;
}

/* to top */
.to-top {
  background: rgba(255, 255, 255, 0.16) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #fff !important;
}

@media (max-width: 600px) {
  .footer-inner {
    width: calc(100% - 24px);
  }
  .brand-desc {
    max-width: 100%;
  }
}
</style>
