<!-- src/modules/shop/pages/ShopLandingSistemas.vue -->
<template>
  <v-container fluid class="shop-page pa-0">

    <!-- ── HERO FULL-BLEED ── -->
    <section class="hero-fullbleed">
      <div class="hero-inner">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="hero-kicker">San Juan Sistemas</div>
            <h1 class="hero-title">Software que hace<br>crecer tu negocio</h1>
            <p class="hero-sub">
              Desarrollamos e implementamos soluciones tecnológicas a medida:
              ecommerce, control de stock, CRM y más. Soporte local en San Juan.
            </p>
            <div class="d-flex ga-2 flex-wrap mt-2 mb-4">
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Primera consulta gratis
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Soporte 24/7
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                50+ proyectos
              </v-chip>
            </div>
            <div class="d-flex ga-3 flex-wrap">
              <v-btn
                color="white"
                variant="flat"
                rounded="lg"
                size="large"
                href="https://wa.me/5492646000000"
                target="_blank"
              >
                <v-icon start>mdi-whatsapp</v-icon>
                Hablar con un asesor
              </v-btn>
              <v-btn
                variant="outlined"
                rounded="lg"
                size="large"
                href="#portfolio"
                style="color:white;border-color:rgba(255,255,255,0.5)"
              >
                Ver soluciones
              </v-btn>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-deco-grid">
              <v-card
                v-for="d in decoItems"
                :key="d.label"
                variant="flat"
                rounded="lg"
                class="deco-card pa-3 text-center"
              >
                <v-icon size="28" class="mb-1">{{ d.icon }}</v-icon>
                <div class="text-caption font-weight-medium">{{ d.label }}</div>
              </v-card>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="portfolio" class="content pt-6">

      <!-- ── MÉTRICAS ── -->
      <v-card variant="flat" rounded="xl" class="mb-8 pa-5">
        <div class="metrics-grid">
          <div v-for="m in metrics" :key="m.num" class="text-center">
            <div class="text-h5 font-weight-black text-primary">{{ m.num }}</div>
            <div class="text-caption text-medium-emphasis text-uppercase">{{ m.lab }}</div>
          </div>
        </div>
      </v-card>

      <!-- ── PORTFOLIO ── -->
      <div class="text-h6 font-weight-black mb-4">Nuestros Productos</div>
      <div class="portfolio-grid mb-8">
        <v-card
          v-for="prod in portfolio"
          :key="prod.title"
          variant="flat"
          rounded="xl"
          class="pa-5"
          :class="{ 'prod-featured': prod.featured }"
        >
          <v-chip v-if="prod.featured" color="primary" size="x-small" class="mb-3" label>Destacado</v-chip>
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar :color="prod.color" size="52" rounded="lg">
              <v-icon color="white" size="28">{{ prod.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ prod.title }}</div>
            </div>
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">{{ prod.desc }}</div>
          <v-list density="compact" class="pa-0 bg-transparent">
            <v-list-item
              v-for="f in prod.features"
              :key="f"
              :title="f"
              density="compact"
              class="px-0"
            >
              <template #prepend>
                <v-icon size="14" color="primary" class="mr-2">mdi-check-circle</v-icon>
              </template>
            </v-list-item>
          </v-list>
          <v-btn
            variant="tonal"
            color="primary"
            rounded="lg"
            size="small"
            class="mt-3"
            href="https://wa.me/5492646000000"
            target="_blank"
          >
            Consultar precio
          </v-btn>
        </v-card>
      </div>

      <!-- ── PROCESO ── -->
      <div class="text-h6 font-weight-black mb-4">¿Cómo trabajamos?</div>
      <div class="steps-grid mb-8">
        <v-card
          v-for="(step, i) in steps"
          :key="step.title"
          variant="flat"
          rounded="xl"
          class="pa-5 text-center"
        >
          <div class="text-h4 font-weight-black text-disabled mb-2">{{ i + 1 }}</div>
          <v-avatar color="primary" size="48" rounded="lg" class="mb-3">
            <v-icon color="white">{{ step.icon }}</v-icon>
          </v-avatar>
          <div class="text-subtitle-2 font-weight-bold mb-1">{{ step.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
        </v-card>
      </div>

      <!-- ── TECNOLOGÍAS ── -->
      <div class="text-h6 font-weight-black mb-3">Tecnologías que usamos</div>
      <div class="d-flex flex-wrap ga-2 mb-8">
        <v-chip v-for="t in techs" :key="t" size="small" variant="tonal" color="primary">{{ t }}</v-chip>
      </div>

      <!-- ── CTA ── -->
      <v-card class="cta-card" variant="flat" rounded="xl">
        <div class="pa-8 text-center">
          <v-icon size="48" color="white" class="mb-3">mdi-rocket-launch</v-icon>
          <div class="text-h5 font-weight-black text-white mb-2">¿Tenés un proyecto en mente?</div>
          <div class="text-body-1 mb-5" style="color:rgba(255,255,255,0.8)">
            Contanos tu idea y te ayudamos a hacerla realidad. Primera consulta sin cargo.
          </div>
          <div class="d-flex ga-3 justify-center flex-wrap">
            <v-btn color="white" variant="flat" rounded="lg" size="large" href="https://wa.me/5492646000000" target="_blank">
              <v-icon start>mdi-whatsapp</v-icon>
              Iniciar proyecto
            </v-btn>
            <v-btn variant="outlined" rounded="lg" size="large" href="mailto:info@sanjuantecnologia.com" style="color:white;border-color:rgba(255,255,255,0.5)">
              <v-icon start>mdi-email-outline</v-icon>
              Enviar email
            </v-btn>
          </div>
        </div>
      </v-card>

    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const decoItems = [
  { icon: "mdi-cart-outline",  label: "Ecommerce" },
  { icon: "mdi-chart-line",    label: "Analytics" },
  { icon: "mdi-database",      label: "Stock" },
  { icon: "mdi-account-group", label: "CRM" },
  { icon: "mdi-cloud-upload",  label: "Cloud" },
  { icon: "mdi-cellphone",     label: "Mobile" },
];

const metrics = [
  { num: "50+",   lab: "Proyectos entregados" },
  { num: "100%",  lab: "Satisfacción" },
  { num: "5 días", lab: "Tiempo de respuesta" },
  { num: "24/7",  lab: "Soporte incluido" },
];

const portfolio = [
  {
    icon: "mdi-shopping",           color: "primary",  featured: true,
    title: "Ecommerce",
    desc: "Tienda online completa con carrito, pagos, stock y panel de administración.",
    features: ["Diseño responsive", "MercadoPago integrado", "Panel de pedidos", "SEO optimizado"],
  },
  {
    icon: "mdi-package-variant-closed", color: "#02498b", featured: false,
    title: "Control de Stock",
    desc: "Sistema de inventario y seguimiento en tiempo real para pymes y comercios.",
    features: ["Múltiples sucursales", "Alertas de stock bajo", "Reportes", "Códigos de barra"],
  },
  {
    icon: "mdi-receipt-text",        color: "#1a9c3e", featured: false,
    title: "POS · Punto de Venta",
    desc: "Software de caja rápido e intuitivo con tickets, descuentos y cierre Z.",
    features: ["Impresión de tickets", "Descuentos", "Cierre Z", "Multi-cajero"],
  },
  {
    icon: "mdi-account-tie",         color: "#e65100", featured: false,
    title: "CRM de Clientes",
    desc: "Gestioná clientes, seguimiento de ventas y pipeline comercial.",
    features: ["Ficha de cliente", "Historial compras", "Seguimiento", "WhatsApp"],
  },
  {
    icon: "mdi-chart-bar",           color: "#6a0dad", featured: false,
    title: "Panel de Gestión",
    desc: "Dashboard con métricas clave, reportes y alertas automáticas.",
    features: ["KPIs en tiempo real", "Gráficos", "Exportación PDF", "Multi-usuario"],
  },
  {
    icon: "mdi-web",                 color: "#00796b", featured: false,
    title: "Sitio Web Corporativo",
    desc: "Presencia digital profesional con diseño moderno y SEO.",
    features: ["Diseño a medida", "Dominio + hosting", "SSL", "Google Analytics"],
  },
];

const steps = [
  { icon: "mdi-lightbulb-on",  title: "Relevamiento",  desc: "Entendemos tu negocio y objetivos antes de proponer solución." },
  { icon: "mdi-file-document", title: "Propuesta",     desc: "Plan técnico, cronograma y presupuesto sin compromiso." },
  { icon: "mdi-code-tags",     title: "Desarrollo",    desc: "Implementación ágil con revisiones periódicas." },
  { icon: "mdi-rocket-launch", title: "Lanzamiento",   desc: "Deploy, capacitación y soporte incluido." },
];

const techs = ["Vue.js", "Node.js", "React", "MySQL", "Docker", "AWS", "MercadoPago", "WhatsApp API", "TypeScript", "Python"];
</script>

<style scoped>
.shop-page { --shop-max: 1200px; padding: 0 !important; background: #ebebeb !important; }

.content {
  width: min(var(--shop-max, 1200px), calc(100% - 32px));
  margin: 0 auto;
  padding-bottom: 24px;
}

/* Hero full-bleed */
.hero-fullbleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  background: #02498b;
  border-radius: 0 0 22px 22px;
  overflow: hidden;
}
.hero-inner {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  align-items: center;
  gap: 24px;
}
.hero-kicker { font-size: 11px; letter-spacing: 2px; font-weight: 700; opacity: .7; color: white; text-transform: uppercase; margin-bottom: 10px; }
.hero-title { margin: 0 0 12px; color: white; font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.1; font-weight: 800; }
.hero-sub { margin: 0 0 10px; color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; }

/* Hero deco */
.hero-deco-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.deco-card { background: rgba(255,255,255,0.12) !important; border: 1px solid rgba(255,255,255,0.15) !important; }
.deco-card :deep(.v-icon) { color: white !important; }
.deco-card .text-caption { color: rgba(255,255,255,0.85) !important; }

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Portfolio */
.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.prod-featured { border: 2px solid rgb(var(--v-theme-primary)) !important; }

/* Steps */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

/* CTA */
.cta-card { background: linear-gradient(135deg, #02498b 0%, #013066 100%) !important; margin-bottom: 32px; }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-right { display: none; }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .hero-inner { padding: 28px 0; }
}
</style>
