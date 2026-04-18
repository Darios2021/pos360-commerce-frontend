<!-- src/modules/shop/pages/ShopLandingSeguridad.vue -->
<template>
  <div class="lseg" data-page="landing-seguridad">

    <!-- ══════════════ HERO ══════════════ -->
    <section class="lseg-hero">
      <div class="lseg-hero-overlay" />
      <div class="lseg-hero-content">
        <div class="lseg-hero-badge">
          <v-icon size="16">mdi-shield-check</v-icon>
          Seguridad Electrónica Profesional
        </div>
        <h1 class="lseg-hero-title">
          Protegé lo que<br />más importa
        </h1>
        <p class="lseg-hero-sub">
          Sistemas de videovigilancia, alarmas y control de acceso
          para hogares y empresas. Instalación y soporte incluidos.
        </p>
        <div class="lseg-hero-actions">
          <router-link :to="{ name: 'shopSearch', query: { q: 'camara seguridad' } }" class="lseg-btn-primary">
            Ver productos
            <v-icon size="18" end>mdi-arrow-right</v-icon>
          </router-link>
          <a href="https://wa.me/5492646000000" target="_blank" class="lseg-btn-ghost">
            <v-icon size="18" start>mdi-whatsapp</v-icon>
            Consultar
          </a>
        </div>
      </div>

      <!-- Métricas flotantes -->
      <div class="lseg-hero-stats">
        <div class="lseg-stat">
          <span class="lseg-stat-num">+500</span>
          <span class="lseg-stat-lab">Instalaciones</span>
        </div>
        <div class="lseg-stat-div" />
        <div class="lseg-stat">
          <span class="lseg-stat-num">24/7</span>
          <span class="lseg-stat-lab">Soporte</span>
        </div>
        <div class="lseg-stat-div" />
        <div class="lseg-stat">
          <span class="lseg-stat-num">10+</span>
          <span class="lseg-stat-lab">Años de experiencia</span>
        </div>
      </div>
    </section>

    <!-- ══════════════ SERVICIOS ══════════════ -->
    <section class="lseg-section">
      <div class="lseg-wrap">
        <div class="lseg-sec-head">
          <h2 class="lseg-sec-title">Soluciones de Seguridad</h2>
          <p class="lseg-sec-sub">Todo lo que necesitás para proteger tu espacio</p>
        </div>
        <div class="lseg-services-grid">
          <div v-for="s in services" :key="s.title" class="lseg-service-card">
            <div class="lseg-svc-icon-wrap">
              <v-icon size="32" color="white">{{ s.icon }}</v-icon>
            </div>
            <h3 class="lseg-svc-title">{{ s.title }}</h3>
            <p class="lseg-svc-desc">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ MARCAS ══════════════ -->
    <section class="lseg-brands-bar">
      <div class="lseg-wrap">
        <span class="lseg-brands-label">Marcas líderes:</span>
        <div class="lseg-brands-list">
          <span v-for="b in brands" :key="b" class="lseg-brand-chip">{{ b }}</span>
        </div>
      </div>
    </section>

    <!-- ══════════════ PRODUCTOS ══════════════ -->
    <section class="lseg-section lseg-section--products">
      <div class="lseg-wrap">
        <div class="lseg-sec-head">
          <h2 class="lseg-sec-title">Catálogo de Seguridad</h2>
          <p class="lseg-sec-sub">Productos disponibles en stock para entrega inmediata</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="lseg-products-grid">
          <v-skeleton-loader
            v-for="n in 8" :key="n"
            type="image,article"
            class="lseg-skeleton"
          />
        </div>

        <!-- Grid -->
        <div v-else-if="items.length" class="lseg-products-grid">
          <ProductCardSubcat
            v-for="p in items"
            :key="p.product_id"
            :p="p"
          />
        </div>

        <div v-else class="lseg-empty">
          <v-icon size="48" color="#ccc">mdi-camera-off</v-icon>
          <p>No hay productos disponibles en este momento.</p>
        </div>

        <div v-if="items.length" class="lseg-ver-mas">
          <router-link
            :to="{ name: 'shopSearch', query: { q: 'seguridad' } }"
            class="lseg-btn-outline"
          >
            Ver todo el catálogo de seguridad
            <v-icon size="18" end>mdi-arrow-right</v-icon>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ══════════════ CTA FINAL ══════════════ -->
    <section class="lseg-cta">
      <div class="lseg-wrap">
        <v-icon size="48" color="white" class="mb-3">mdi-shield-lock</v-icon>
        <h2 class="lseg-cta-title">¿Necesitás un sistema a medida?</h2>
        <p class="lseg-cta-sub">
          Nuestro equipo evalúa tu espacio y te diseña la solución más eficiente.
          Contactanos sin cargo.
        </p>
        <a href="https://wa.me/5492646000000" target="_blank" class="lseg-btn-white">
          <v-icon size="20" start>mdi-whatsapp</v-icon>
          Hablar con un especialista
        </a>
      </div>
    </section>

    <ShopFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import ProductCardSubcat from "@/modules/shop/components/shop/ProductCardSubcat.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const loading = ref(true);
const items   = ref([]);

const services = [
  { icon: "mdi-cctv",           title: "Videovigilancia IP",    desc: "Cámaras de alta definición con visión nocturna, acceso remoto y grabación en la nube o local." },
  { icon: "mdi-alarm-light",    title: "Alarmas",               desc: "Sistemas de detección de movimiento e intrusión con alertas en tiempo real a tu celular." },
  { icon: "mdi-door-closed-lock", title: "Control de Acceso",   desc: "Lectores biométricos, tarjetas y PIN para controlar el ingreso a tu propiedad o empresa." },
  { icon: "mdi-wifi",           title: "Monitoreo Remoto",      desc: "Accedé a tus cámaras desde cualquier lugar del mundo con nuestra app móvil." },
  { icon: "mdi-car-key",        title: "Seguridad Vehicular",   desc: "Rastreo GPS, inmovilizadores y alertas de movimiento para tu flota o vehículo personal." },
  { icon: "mdi-tools",          title: "Instalación Profesional", desc: "Servicio técnico certificado con garantía de instalación y soporte post-venta." },
];

const brands = ["Hikvision", "Dahua", "Imou", "TP-Link", "Reolink", "Axis"];

onMounted(async () => {
  try {
    const r = await getCatalog({ search: "seguridad camara", limit: 8, page: 1 });
    items.value = Array.isArray(r?.items) ? r.items : [];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ── Base ── */
.lseg {
  background: #ebebeb;
  min-height: 100vh;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.lseg-wrap {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
}

/* ── HERO ── */
.lseg-hero {
  position: relative;
  min-height: 520px;
  background:
    linear-gradient(135deg, rgba(2,73,139,0.92) 0%, rgba(0,20,50,0.96) 100%),
    url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80") center/cover no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 0 100px;
  overflow: hidden;
}
.lseg-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 50%, rgba(52,131,250,0.15) 0%, transparent 65%);
}
.lseg-hero-overlay { display: none; }
.lseg-hero-content {
  position: relative;
  z-index: 1;
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
}
.lseg-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(52,131,250,0.25);
  border: 1px solid rgba(52,131,250,0.5);
  color: #7ec8ff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 20px;
}
.lseg-hero-title {
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  margin: 0 0 18px;
  letter-spacing: -1px;
}
.lseg-hero-sub {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.78);
  max-width: 520px;
  line-height: 1.65;
  margin: 0 0 32px;
}
.lseg-hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.lseg-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #3483fa;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: background .2s, transform .15s;
}
.lseg-btn-primary:hover { background: #2770e8; transform: translateY(-1px); }
.lseg-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid rgba(255,255,255,0.4);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  backdrop-filter: blur(8px);
  transition: border-color .2s, background .2s;
}
.lseg-btn-ghost:hover { border-color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); }

/* Stats */
.lseg-hero-stats {
  position: relative;
  z-index: 1;
  width: min(1240px, calc(100% - 32px));
  margin: 52px auto 0;
  display: flex;
  align-items: center;
  gap: 32px;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 20px 32px;
  width: fit-content;
}
.lseg-stat { text-align: center; }
.lseg-stat-num { display: block; font-size: 1.8rem; font-weight: 800; color: #fff; line-height: 1; }
.lseg-stat-lab { display: block; font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.lseg-stat-div { width: 1px; height: 36px; background: rgba(255,255,255,0.2); }

/* ── SECTIONS ── */
.lseg-section { padding: 64px 0; }
.lseg-section--products { background: #fff; }
.lseg-sec-head { text-align: center; margin-bottom: 40px; }
.lseg-sec-title { font-size: 1.75rem; font-weight: 800; color: #111; margin: 0 0 10px; }
.lseg-sec-sub { font-size: 1rem; color: #666; margin: 0; }

/* ── SERVICES ── */
.lseg-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.lseg-service-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  transition: transform .2s, box-shadow .2s;
}
.lseg-service-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.11); }
.lseg-svc-icon-wrap {
  width: 52px;
  height: 52px;
  background: #02498b;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.lseg-svc-title { font-size: 1rem; font-weight: 700; color: #111; margin: 0 0 8px; }
.lseg-svc-desc { font-size: 0.875rem; color: #555; line-height: 1.6; margin: 0; }

/* ── BRANDS BAR ── */
.lseg-brands-bar {
  background: #02498b;
  padding: 16px 0;
}
.lseg-brands-bar .lseg-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.lseg-brands-label { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; white-space: nowrap; }
.lseg-brands-list { display: flex; gap: 10px; flex-wrap: wrap; }
.lseg-brand-chip {
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.2);
}

/* ── PRODUCTS ── */
.lseg-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}
.lseg-skeleton { border-radius: 12px; overflow: hidden; }
.lseg-empty { text-align: center; padding: 60px 20px; color: #999; }
.lseg-ver-mas { text-align: center; margin-top: 36px; }
.lseg-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid #02498b;
  color: #02498b;
  font-weight: 700;
  font-size: 15px;
  padding: 12px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: background .2s, color .2s;
}
.lseg-btn-outline:hover { background: #02498b; color: #fff; }

/* ── CTA ── */
.lseg-cta {
  background: linear-gradient(135deg, #02498b 0%, #013066 100%);
  padding: 72px 0;
  text-align: center;
}
.lseg-cta-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0 0 12px; }
.lseg-cta-sub { color: rgba(255,255,255,0.75); font-size: 1rem; max-width: 520px; margin: 0 auto 28px; line-height: 1.6; }
.lseg-btn-white {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #02498b;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: transform .15s, box-shadow .2s;
}
.lseg-btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

/* ── RESPONSIVE ── */
@media (max-width: 600px) {
  .lseg-hero { padding: 60px 0 80px; min-height: auto; }
  .lseg-hero-stats { flex-wrap: wrap; gap: 20px; padding: 16px 20px; }
  .lseg-hero-actions { flex-direction: column; }
  .lseg-btn-primary, .lseg-btn-ghost { justify-content: center; }
}
</style>
