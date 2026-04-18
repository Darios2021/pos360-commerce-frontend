<!-- src/modules/shop/pages/ShopLandingSistemas.vue -->
<template>
  <div class="lsis" data-page="landing-sistemas">

    <!-- ══════════════ HERO ══════════════ -->
    <section class="lsis-hero">
      <div class="lsis-hero-content">
        <div class="lsis-hero-badge">
          <v-icon size="14">mdi-code-braces</v-icon>
          Soluciones Digitales para Empresas
        </div>
        <h1 class="lsis-hero-title">
          Software que hace<br />
          <span class="lsis-hero-title--accent">crecer tu negocio</span>
        </h1>
        <p class="lsis-hero-sub">
          Desarrollamos e implementamos soluciones tecnológicas a medida:
          ecommerce, control de stock, CRM y más. Soporte local en San Juan.
        </p>
        <div class="lsis-hero-actions">
          <a href="https://wa.me/5492646000000" target="_blank" class="lsis-btn-primary">
            <v-icon size="18" start>mdi-whatsapp</v-icon>
            Hablar con un asesor
          </a>
          <a href="#portfolio" class="lsis-btn-ghost">
            Ver soluciones
            <v-icon size="18" end>mdi-arrow-down</v-icon>
          </a>
        </div>
      </div>

      <!-- Ilustración tech (grid de íconos flotantes) -->
      <div class="lsis-hero-deco" aria-hidden="true">
        <div v-for="d in decoItems" :key="d.icon" class="lsis-deco-card" :style="d.style">
          <v-icon size="28" color="#3483fa">{{ d.icon }}</v-icon>
          <span>{{ d.label }}</span>
        </div>
      </div>
    </section>

    <!-- ══════════════ NÚMEROS ══════════════ -->
    <div class="lsis-metrics-bar">
      <div class="lsis-wrap">
        <div class="lsis-metrics-grid">
          <div v-for="m in metrics" :key="m.num" class="lsis-metric">
            <span class="lsis-metric-num">{{ m.num }}</span>
            <span class="lsis-metric-lab">{{ m.lab }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ PORTFOLIO ══════════════ -->
    <section id="portfolio" class="lsis-section">
      <div class="lsis-wrap">
        <div class="lsis-sec-head">
          <h2 class="lsis-sec-title">Nuestros Productos</h2>
          <p class="lsis-sec-sub">Soluciones listas para implementar, adaptadas a tu rubro</p>
        </div>
        <div class="lsis-portfolio-grid">
          <div
            v-for="prod in portfolio"
            :key="prod.title"
            class="lsis-prod-card"
            :class="{ 'lsis-prod-card--featured': prod.featured }"
          >
            <div v-if="prod.featured" class="lsis-prod-badge">Destacado</div>
            <div class="lsis-prod-icon-wrap" :style="{ background: prod.color }">
              <v-icon size="36" color="white">{{ prod.icon }}</v-icon>
            </div>
            <h3 class="lsis-prod-title">{{ prod.title }}</h3>
            <p class="lsis-prod-desc">{{ prod.desc }}</p>
            <ul class="lsis-prod-features">
              <li v-for="f in prod.features" :key="f">
                <v-icon size="14" color="#3483fa">mdi-check-circle</v-icon>
                {{ f }}
              </li>
            </ul>
            <a href="https://wa.me/5492646000000" target="_blank" class="lsis-prod-cta">
              Consultar precio
              <v-icon size="16" end>mdi-arrow-right</v-icon>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ PROCESO ══════════════ -->
    <section class="lsis-section lsis-section--gray">
      <div class="lsis-wrap">
        <div class="lsis-sec-head">
          <h2 class="lsis-sec-title">¿Cómo trabajamos?</h2>
          <p class="lsis-sec-sub">Un proceso ágil y transparente desde la idea hasta el lanzamiento</p>
        </div>
        <div class="lsis-steps">
          <div v-for="(step, i) in steps" :key="step.title" class="lsis-step">
            <div class="lsis-step-num">{{ i + 1 }}</div>
            <div class="lsis-step-icon-wrap">
              <v-icon size="26" color="#02498b">{{ step.icon }}</v-icon>
            </div>
            <h4 class="lsis-step-title">{{ step.title }}</h4>
            <p class="lsis-step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ TECNOLOGÍAS ══════════════ -->
    <section class="lsis-section">
      <div class="lsis-wrap">
        <div class="lsis-sec-head">
          <h2 class="lsis-sec-title">Tecnologías que usamos</h2>
        </div>
        <div class="lsis-techs">
          <span v-for="t in techs" :key="t" class="lsis-tech-chip">{{ t }}</span>
        </div>
      </div>
    </section>

    <!-- ══════════════ CTA ══════════════ -->
    <section class="lsis-cta">
      <div class="lsis-wrap">
        <h2 class="lsis-cta-title">¿Tenés un proyecto en mente?</h2>
        <p class="lsis-cta-sub">
          Contanos tu idea y te ayudamos a hacerla realidad.
          Primera consulta sin cargo.
        </p>
        <div class="lsis-cta-actions">
          <a href="https://wa.me/5492646000000" target="_blank" class="lsis-btn-white">
            <v-icon size="20" start>mdi-whatsapp</v-icon>
            Iniciar proyecto
          </a>
          <a href="mailto:info@sanjuantecnologia.com" class="lsis-btn-outline-white">
            <v-icon size="18" start>mdi-email-outline</v-icon>
            Enviar email
          </a>
        </div>
      </div>
    </section>

    <ShopFooter />
  </div>
</template>

<script setup>
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const decoItems = [
  { icon: "mdi-cart-outline",   label: "Ecommerce",    style: "top:10%;left:8%" },
  { icon: "mdi-chart-line",     label: "Analytics",    style: "top:35%;left:3%" },
  { icon: "mdi-database",       label: "Stock",        style: "top:65%;left:8%" },
  { icon: "mdi-account-group",  label: "CRM",          style: "top:15%;right:6%" },
  { icon: "mdi-cloud-upload",   label: "Cloud",        style: "top:50%;right:3%" },
  { icon: "mdi-cellphone",      label: "Mobile",       style: "top:75%;right:8%" },
];

const metrics = [
  { num: "50+",  lab: "Proyectos entregados" },
  { num: "100%", lab: "Satisfacción" },
  { num: "5 días", lab: "Tiempo de respuesta" },
  { num: "24/7",  lab: "Soporte incluido" },
];

const portfolio = [
  {
    icon: "mdi-shopping",
    color: "#3483fa",
    title: "Ecommerce",
    featured: true,
    desc: "Tienda online completa con carrito, pagos, gestión de stock y panel de administración.",
    features: ["Diseño responsive", "MercadoPago integrado", "Panel de pedidos", "SEO optimizado", "App mobile"],
  },
  {
    icon: "mdi-package-variant-closed",
    color: "#02498b",
    title: "Control de Stock",
    featured: false,
    desc: "Sistema de inventario y seguimiento en tiempo real para pymes y comercios.",
    features: ["Múltiples sucursales", "Alertas de stock bajo", "Reportes y estadísticas", "Lectora de códigos", "Exportación Excel"],
  },
  {
    icon: "mdi-receipt-text",
    color: "#1a9c3e",
    title: "POS · Punto de Venta",
    featured: false,
    desc: "Software de caja rápido e intuitivo con soporte para tickets, descuentos y cierre Z.",
    features: ["Impresión de tickets", "Descuentos y promociones", "Cierre diario Z", "Múltiples cajeros", "Integrado con stock"],
  },
  {
    icon: "mdi-account-tie",
    color: "#e65100",
    title: "CRM de Clientes",
    featured: false,
    desc: "Gestioná tus clientes, seguimiento de ventas y pipeline comercial desde un solo lugar.",
    features: ["Ficha de cliente", "Historial de compras", "Seguimiento comercial", "Recordatorios", "Integración WhatsApp"],
  },
  {
    icon: "mdi-chart-bar",
    color: "#6a0dad",
    title: "Panel de Gestión",
    featured: false,
    desc: "Dashboard central con métricas clave de tu negocio, reportes y alertas automáticas.",
    features: ["KPIs en tiempo real", "Gráficos interactivos", "Exportación PDF", "Alertas por email", "Multi-usuario"],
  },
  {
    icon: "mdi-web",
    color: "#00796b",
    title: "Sitio Web Corporativo",
    featured: false,
    desc: "Presencia digital profesional con diseño moderno, velocidad y posicionamiento SEO.",
    features: ["Diseño a medida", "Dominio + hosting", "Certificado SSL", "Google Analytics", "Formulario de contacto"],
  },
];

const steps = [
  { icon: "mdi-lightbulb-on",    title: "Relevamiento",    desc: "Entendemos tu negocio, necesidades y objetivos antes de proponer cualquier solución." },
  { icon: "mdi-file-document",   title: "Propuesta",       desc: "Presentamos un plan técnico, cronograma y presupuesto detallado sin compromiso." },
  { icon: "mdi-code-tags",       title: "Desarrollo",      desc: "Implementamos con metodología ágil, con revisiones periódicas para ajustar el rumbo." },
  { icon: "mdi-rocket-launch",   title: "Lanzamiento",     desc: "Deploy, capacitación y soporte post-lanzamiento incluido en todos los proyectos." },
];

const techs = [
  "Vue.js", "Node.js", "React", "MySQL", "PostgreSQL", "Docker",
  "AWS", "MercadoPago", "WhatsApp API", "REST API", "TypeScript", "Python",
];
</script>

<style scoped>
.lsis {
  background: #fff;
  min-height: 100vh;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.lsis-wrap { width: min(1240px, calc(100% - 32px)); margin: 0 auto; }

/* ── HERO ── */
.lsis-hero {
  position: relative;
  background: linear-gradient(135deg, #02498b 0%, #011f4b 100%);
  min-height: 540px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 80px min(calc((100% - 1240px) / 2 + 16px), 16px);
  overflow: hidden;
}
.lsis-hero::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0; right: 0;
  height: 60px;
  background: #fff;
  clip-path: ellipse(55% 100% at 50% 100%);
}
.lsis-hero-content { position: relative; z-index: 1; padding: 0 16px; }
.lsis-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(52,131,250,0.2);
  border: 1px solid rgba(52,131,250,0.4);
  color: #7ec8ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 20px;
}
.lsis-hero-title {
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  margin: 0 0 16px;
  letter-spacing: -1px;
}
.lsis-hero-title--accent { color: #3483fa; }
.lsis-hero-sub {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.75);
  max-width: 480px;
  line-height: 1.65;
  margin: 0 0 32px;
}
.lsis-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.lsis-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #25d366;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 26px;
  border-radius: 10px;
  text-decoration: none;
  transition: background .2s, transform .15s;
}
.lsis-btn-primary:hover { background: #1da851; transform: translateY(-1px); }
.lsis-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  font-size: 15px;
  padding: 12px 22px;
  border-radius: 10px;
  text-decoration: none;
  transition: border-color .2s;
}
.lsis-btn-ghost:hover { border-color: rgba(255,255,255,0.7); }

/* Deco flotantes */
.lsis-hero-deco {
  position: relative;
  height: 320px;
}
.lsis-deco-card {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 16px 20px;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
  animation: lsis-float 4s ease-in-out infinite alternate;
}
.lsis-deco-card:nth-child(even) { animation-delay: -2s; }
@keyframes lsis-float {
  from { transform: translateY(0); }
  to   { transform: translateY(-10px); }
}

/* ── METRICS ── */
.lsis-metrics-bar {
  background: #f0f4ff;
  border-top: 1px solid #dce8ff;
  border-bottom: 1px solid #dce8ff;
  padding: 24px 0;
}
.lsis-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
}
.lsis-metric-num { display: block; font-size: 1.8rem; font-weight: 800; color: #02498b; }
.lsis-metric-lab { display: block; font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

/* ── SECTIONS ── */
.lsis-section { padding: 72px 0; }
.lsis-section--gray { background: #f6f8fb; }
.lsis-sec-head { text-align: center; margin-bottom: 48px; }
.lsis-sec-title { font-size: 1.75rem; font-weight: 800; color: #111; margin: 0 0 10px; }
.lsis-sec-sub { font-size: 1rem; color: #666; margin: 0; }

/* ── PORTFOLIO ── */
.lsis-portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.lsis-prod-card {
  position: relative;
  background: #fff;
  border: 1.5px solid #e8ecf0;
  border-radius: 16px;
  padding: 28px 24px;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.lsis-prod-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(2,73,139,0.12);
  border-color: #3483fa;
}
.lsis-prod-card--featured { border-color: #3483fa; box-shadow: 0 4px 16px rgba(52,131,250,0.15); }
.lsis-prod-badge {
  position: absolute;
  top: -10px;
  left: 20px;
  background: #3483fa;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 100px;
  letter-spacing: 0.3px;
}
.lsis-prod-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.lsis-prod-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0 0 8px; }
.lsis-prod-desc { font-size: 0.875rem; color: #555; line-height: 1.6; margin: 0 0 16px; }
.lsis-prod-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.lsis-prod-features li {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #444;
}
.lsis-prod-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3483fa;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: gap .2s;
}
.lsis-prod-cta:hover { gap: 10px; }

/* ── STEPS ── */
.lsis-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}
.lsis-step { text-align: center; padding: 32px 24px; background: #fff; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
.lsis-step-num { font-size: 2.5rem; font-weight: 900; color: #e8eef6; line-height: 1; margin-bottom: 12px; }
.lsis-step-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid #e0ebff;
  background: #f0f6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.lsis-step-title { font-size: 1rem; font-weight: 700; color: #111; margin: 0 0 8px; }
.lsis-step-desc { font-size: 0.85rem; color: #666; line-height: 1.6; margin: 0; }

/* ── TECHS ── */
.lsis-techs { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.lsis-tech-chip {
  background: #f0f4ff;
  color: #02498b;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 18px;
  border-radius: 100px;
  border: 1px solid #c8d8f5;
}

/* ── CTA ── */
.lsis-cta {
  background: linear-gradient(135deg, #02498b 0%, #011f4b 100%);
  padding: 80px 0;
  text-align: center;
}
.lsis-cta-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0 0 12px; }
.lsis-cta-sub { color: rgba(255,255,255,0.72); font-size: 1rem; max-width: 480px; margin: 0 auto 32px; line-height: 1.6; }
.lsis-cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.lsis-btn-white {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #02498b;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 26px;
  border-radius: 10px;
  text-decoration: none;
  transition: transform .15s;
}
.lsis-btn-white:hover { transform: translateY(-2px); }
.lsis-btn-outline-white {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid rgba(255,255,255,0.4);
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  font-size: 15px;
  padding: 12px 22px;
  border-radius: 10px;
  text-decoration: none;
  transition: border-color .2s;
}
.lsis-btn-outline-white:hover { border-color: rgba(255,255,255,0.75); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .lsis-hero { grid-template-columns: 1fr; padding: 60px 16px 80px; }
  .lsis-hero-deco { display: none; }
  .lsis-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .lsis-hero-actions { flex-direction: column; }
}
</style>
