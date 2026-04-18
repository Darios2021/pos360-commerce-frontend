<!-- src/modules/shop/pages/ShopLandingSeguridad.vue -->
<template>
  <v-container fluid class="shop-page pa-0">

    <!-- ── HERO (misma estructura que PromoBannerSeguridadElectronica) ── -->
    <section class="content pt-4 pb-0">
      <v-card class="hero-card" variant="flat" rounded="xl">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="hero-kicker">San Juan Seguridad</div>
            <h1 class="hero-title">Protegé lo que<br>más importa</h1>
            <p class="hero-sub">
              Sistemas de videovigilancia, alarmas y control de acceso
              para hogares y empresas. Instalación y soporte incluidos.
            </p>
            <div class="d-flex ga-3 flex-wrap mt-2">
              <v-btn
                color="white"
                variant="flat"
                rounded="lg"
                size="large"
                :to="{ name: 'shopSearch', query: { q: 'camara seguridad' } }"
              >
                Ver productos
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
              <v-btn
                variant="outlined"
                rounded="lg"
                size="large"
                href="https://wa.me/5492646000000"
                target="_blank"
                style="color:white;border-color:rgba(255,255,255,0.5)"
              >
                <v-icon start>mdi-whatsapp</v-icon>
                Consultar
              </v-btn>
            </div>
          </div>
          <div class="hero-right">
            <img
              src="https://storage-files.cingulado.org/pos360/media/1773003110927-1897e885ea435e0d.webp"
              alt="Seguridad electrónica"
              class="hero-img"
            />
          </div>
        </div>
      </v-card>
    </section>

    <section class="content pt-6">

      <!-- ── SERVICIOS ── -->
      <div class="text-h6 font-weight-black mb-4">Soluciones de Seguridad</div>
      <div class="services-grid mb-8">
        <v-card
          v-for="s in services"
          :key="s.title"
          variant="flat"
          rounded="xl"
          class="pa-5"
        >
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar color="primary" size="44" rounded="lg">
              <v-icon color="white">{{ s.icon }}</v-icon>
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold">{{ s.title }}</div>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ s.desc }}</div>
        </v-card>
      </div>

      <!-- ── MARCAS ── -->
      <div class="d-flex align-center ga-2 flex-wrap mb-8">
        <span class="text-caption text-medium-emphasis font-weight-medium">Marcas:</span>
        <v-chip v-for="b in brands" :key="b" size="small" variant="tonal" color="primary">{{ b }}</v-chip>
      </div>

      <!-- ── PRODUCTOS ── -->
      <div class="text-h6 font-weight-black mb-4">Catálogo de Seguridad</div>

      <div v-if="loading" class="product-grid mb-6">
        <v-skeleton-loader v-for="n in 8" :key="n" type="image,article" />
      </div>
      <div v-else-if="items.length" class="product-grid mb-4">
        <ProductCard v-for="p in items" :key="p.product_id" :p="p" />
      </div>

      <div class="d-flex justify-center mb-8">
        <v-btn
          variant="tonal"
          color="primary"
          size="large"
          rounded="lg"
          :to="{ name: 'shopSearch', query: { q: 'seguridad' } }"
        >
          Ver todo el catálogo de seguridad
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </div>

      <!-- ── CTA ── -->
      <v-card class="cta-card" variant="flat" rounded="xl">
        <div class="pa-8 text-center">
          <v-icon size="48" color="white" class="mb-3">mdi-shield-lock</v-icon>
          <div class="text-h5 font-weight-black text-white mb-2">¿Necesitás un sistema a medida?</div>
          <div class="text-body-1 mb-5" style="color:rgba(255,255,255,0.8)">
            Nuestro equipo evalúa tu espacio y te diseña la solución más eficiente. Primera consulta sin cargo.
          </div>
          <v-btn
            color="white"
            variant="flat"
            rounded="lg"
            size="large"
            href="https://wa.me/5492646000000"
            target="_blank"
          >
            <v-icon start>mdi-whatsapp</v-icon>
            Hablar con un especialista
          </v-btn>
        </div>
      </v-card>

    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const loading = ref(true);
const items   = ref([]);

const services = [
  { icon: "mdi-cctv",              title: "Videovigilancia IP",       desc: "Cámaras HD con visión nocturna, acceso remoto y grabación local o en la nube." },
  { icon: "mdi-alarm-light",       title: "Sistemas de Alarma",       desc: "Detección de movimiento e intrusión con alertas en tiempo real a tu celular." },
  { icon: "mdi-door-closed-lock",  title: "Control de Acceso",        desc: "Lectores biométricos, tarjetas y PIN para controlar el ingreso a tu propiedad." },
  { icon: "mdi-wifi",              title: "Monitoreo Remoto",          desc: "Accedé a tus cámaras desde cualquier lugar del mundo desde la app móvil." },
  { icon: "mdi-car-key",           title: "Seguridad Vehicular",       desc: "Rastreo GPS, inmovilizadores y alertas para tu flota o vehículo personal." },
  { icon: "mdi-tools",             title: "Instalación Profesional",   desc: "Técnicos certificados con garantía de instalación y soporte post-venta." },
];

const brands = ["Hikvision", "Dahua", "Imou", "TP-Link", "Reolink"];

onMounted(async () => {
  try {
    const r = await getCatalog({ search: "camara seguridad", limit: 8, page: 1 });
    items.value = Array.isArray(r?.items) ? r.items : [];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ── Mismo patrón que ShopHome ── */
.shop-page { --shop-max: 1200px; padding: 0 !important; background: #ebebeb !important; }

.content {
  width: min(var(--shop-max, 1200px), calc(100% - 32px));
  margin: 0 auto;
  padding-bottom: 24px;
}

/* Hero */
.hero-card { background: #02498b !important; overflow: hidden; }
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  align-items: center;
  padding: 36px 36px;
  gap: 24px;
  min-height: 200px;
}
.hero-kicker { font-size: 11px; letter-spacing: 2px; font-weight: 700; opacity: .7; color: white; text-transform: uppercase; margin-bottom: 10px; }
.hero-title { margin: 0 0 12px; color: white; font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.1; font-weight: 800; }
.hero-sub { margin: 0 0 16px; color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.6; max-width: 480px; }
.hero-right { display: flex; justify-content: flex-end; align-items: center; }
.hero-img { width: 400px; height: 190px; object-fit: contain; }

/* Services */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

/* CTA */
.cta-card { background: linear-gradient(135deg, #02498b 0%, #013066 100%) !important; margin-bottom: 32px; }

/* Responsive */
@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-right { justify-content: center; }
  .hero-img { width: 100%; height: 180px; }
}
@media (max-width: 600px) {
  .hero-grid { padding: 24px 20px; }
  .hero-title { font-size: 1.8rem; }
}
</style>
