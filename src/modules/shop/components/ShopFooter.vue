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
.shop-footer {
  --brand-primary: #1488d1;
  --brand-dark: #071c30;
  --brand-white: #ffffff;
  --brand-white-80: rgba(255, 255, 255, 0.8);
  --brand-white-65: rgba(255, 255, 255, 0.65);
  --brand-border: rgba(255, 255, 255, 0.12);

  position: relative;
  z-index: 1;
  width: 100%;
  color: var(--brand-white);
  background:
    radial-gradient(1200px 420px at 12% -10%, rgba(20, 136, 209, 0.38), transparent 60%),
    radial-gradient(900px 380px at 88% 0%, rgba(20, 136, 209, 0.16), transparent 55%),
    linear-gradient(180deg, var(--brand-dark) 0%, #06172a 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.10);
  overflow: hidden;
}

.footer-top-glow {
  position: absolute;
  inset: -2px 0 auto 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(20, 136, 209, 0.95), transparent);
  opacity: 0.85;
}

.footer-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  padding-left: 0;
  padding-right: 0;
}

.brand-badge {
  background: rgba(20, 136, 209, 0.18) !important;
  border: 1px solid rgba(20, 136, 209, 0.45) !important;
  color: var(--brand-white) !important;
}

.brand-title {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 1.12rem;
}

.brand-subtitle {
  opacity: 0.82;
  font-size: 0.85rem;
}

.brand-desc {
  opacity: 0.88;
  font-size: 0.92rem;
  line-height: 1.45;
  max-width: 460px;
}

.pill {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid var(--brand-border) !important;
  color: var(--brand-white) !important;
}

.section-title {
  font-weight: 850;
  font-size: 0.92rem;
  letter-spacing: 0.2px;
  margin-bottom: 12px;
  color: var(--brand-white);
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
  cursor: pointer;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.92rem;
  transition: color 0.15s ease, transform 0.15s ease;
}
.footer-list a:hover {
  color: var(--brand-white);
  transform: translateX(2px);
}

.contact {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.9;
  font-size: 0.92rem;
  margin-bottom: 10px;
}

.pay-chip {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.2px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--brand-border);
  color: rgba(255, 255, 255, 0.92);
}

.divider {
  height: 1px;
  width: 100%;
  background: rgba(255, 255, 255, 0.10);
}

.bottom {
  opacity: 0.92;
}
.copy {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.86rem;
}

.social {
  color: rgba(255, 255, 255, 0.78) !important;
}
.social:hover {
  color: var(--brand-white) !important;
}

.to-top {
  background: rgba(20, 136, 209, 0.18) !important;
  border: 1px solid rgba(20, 136, 209, 0.35) !important;
  color: var(--brand-white) !important;
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
