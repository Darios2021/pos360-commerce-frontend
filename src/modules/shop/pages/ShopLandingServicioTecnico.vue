<!-- src/modules/shop/pages/ShopLandingServicioTecnico.vue -->
<template>
  <v-container fluid class="shop-page pa-0">

    <!-- ── HERO FULL-BLEED ── -->
    <section class="hero-fullbleed">
      <div class="hero-inner">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="hero-kicker">San Juan Servicio Técnico</div>
            <h1 class="hero-title">Reparamos<br>tus dispositivos</h1>
            <p class="hero-sub">
              Diagnóstico gratis · Presupuesto sin cargo · Garantía en reparaciones.
              Celulares, computadoras, tablets y más.
            </p>
            <div class="d-flex ga-2 flex-wrap mt-2 mb-4">
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Diagnóstico gratis
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Garantía 90 días
              </v-chip>
              <v-chip color="white" variant="flat" size="small" label>
                <v-icon start size="14" color="success">mdi-check-circle</v-icon>
                Repuestos originales
              </v-chip>
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
              Pedir turno
            </v-btn>
          </div>
          <div class="hero-right">
            <!-- Tarjeta animada de estado de reparación -->
            <v-card class="status-card" variant="flat" rounded="xl">
              <v-card-item class="status-header">
                <template #prepend>
                  <v-icon color="primary">mdi-cellphone-check</v-icon>
                </template>
                <v-card-title class="text-body-2 font-weight-bold">Estado de tu reparación</v-card-title>
              </v-card-item>
              <v-divider />
              <v-list density="compact" class="py-2">
                <v-list-item
                  v-for="step in statusSteps"
                  :key="step.label"
                  :opacity="step.done || step.active ? 1 : 0.35"
                >
                  <template #prepend>
                    <v-avatar size="22" :color="step.done ? 'success' : step.active ? 'primary' : 'surface-variant'" :class="{ 'pulse': step.active }">
                      <v-icon v-if="step.done" size="12" color="white">mdi-check</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-caption font-weight-medium">{{ step.label }}</v-list-item-title>
                  <v-list-item-subtitle v-if="step.time" class="text-caption">{{ step.time }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <v-divider />
              <div class="px-4 py-2 text-caption text-primary d-flex align-center ga-1">
                <v-icon size="13">mdi-message-text</v-icon>
                Te notificamos por WhatsApp
              </div>
            </v-card>
          </div>
        </div>
      </div>
    </section>

    <section class="content pt-6">

      <!-- ── SERVICIOS ── -->
      <div class="text-h6 font-weight-black mb-4">¿Qué reparamos?</div>
      <div class="services-grid mb-8">
        <v-card
          v-for="svc in services"
          :key="svc.title"
          variant="flat"
          rounded="xl"
          class="pa-5"
        >
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar :color="svc.color" size="48" rounded="lg">
              <v-icon color="white">{{ svc.icon }}</v-icon>
            </v-avatar>
            <div class="text-subtitle-2 font-weight-bold">{{ svc.title }}</div>
          </div>
          <ul class="svc-list text-body-2 text-medium-emphasis mb-3">
            <li v-for="item in svc.items" :key="item">{{ item }}</li>
          </ul>
          <v-btn
            variant="tonal"
            color="primary"
            rounded="lg"
            size="x-small"
            href="https://wa.me/5492646000000"
            target="_blank"
          >
            Consultar
          </v-btn>
        </v-card>
      </div>

      <!-- ── PROCESO ── -->
      <v-card variant="flat" rounded="xl" class="mb-8" style="background:#02498b!important">
        <div class="pa-6">
          <div class="text-h6 font-weight-black text-white mb-5">Proceso simple y transparente</div>
          <div class="process-grid">
            <div v-for="(step, i) in process" :key="step.title" class="process-step text-center">
              <div class="text-h4 font-weight-black mb-1" style="color:rgba(255,255,255,0.15)">{{ i + 1 }}</div>
              <v-avatar color="rgba(255,255,255,0.15)" size="52" rounded="lg" class="mb-2">
                <v-icon color="white">{{ step.icon }}</v-icon>
              </v-avatar>
              <div class="text-subtitle-2 font-weight-bold text-white mb-1">{{ step.title }}</div>
              <div class="text-caption" style="color:rgba(255,255,255,0.7)">{{ step.desc }}</div>
            </div>
          </div>
        </div>
      </v-card>

      <!-- ── FAQs ── -->
      <div class="text-h6 font-weight-black mb-4">Preguntas frecuentes</div>
      <v-expansion-panels variant="accordion" rounded="xl" class="mb-8">
        <v-expansion-panel
          v-for="(faq, i) in faqs"
          :key="i"
          :title="faq.q"
          :text="faq.a"
          rounded="xl"
        />
      </v-expansion-panels>

      <!-- ── CTA ── -->
      <v-card class="cta-card" variant="flat" rounded="xl">
        <div class="pa-6 d-flex align-center justify-space-between flex-wrap ga-4">
          <div>
            <div class="text-h6 font-weight-black text-white mb-1">¿Tu dispositivo tiene algún problema?</div>
            <div class="text-body-2" style="color:rgba(255,255,255,0.8)">
              Traelo a nuestro local o contactanos para un diagnóstico gratuito.
            </div>
          </div>
          <v-btn color="white" variant="flat" rounded="lg" size="large" href="https://wa.me/5492646000000" target="_blank">
            <v-icon start>mdi-whatsapp</v-icon>
            Hablar ahora
          </v-btn>
        </div>
      </v-card>

    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const statusSteps = [
  { label: "Recepción del equipo",   time: "Hoy 10:30",         done: true,  active: false },
  { label: "Diagnóstico técnico",    time: "Hoy 11:15",         done: true,  active: false },
  { label: "Aprobación presupuesto", time: "Esperando cliente", done: false, active: true  },
  { label: "Reparación",             time: "",                   done: false, active: false },
  { label: "Listo para retirar",     time: "",                   done: false, active: false },
];

const services = [
  { icon: "mdi-cellphone",    color: "primary",  title: "Celulares",
    items: ["Pantalla rota", "Batería", "Conector de carga", "Software/Virus", "Cámara"] },
  { icon: "mdi-laptop",       color: "#02498b",  title: "Computadoras",
    items: ["Formateo y reinstalación", "Disco rígido/SSD", "Pantalla", "RAM", "Teclado"] },
  { icon: "mdi-tablet",       color: "#6a0dad",  title: "Tablets",
    items: ["Pantalla táctil", "Batería", "Carga USB", "Software", "Wi-Fi"] },
  { icon: "mdi-router-wireless", color: "#00796b", title: "Redes",
    items: ["Configuración router", "Redes empresariales", "Cableado", "VPN", "Wi-Fi"] },
  { icon: "mdi-printer",      color: "#e65100",  title: "Periféricos",
    items: ["Impresoras", "Monitores", "Teclados y mouse", "Escáneres", "Cámaras web"] },
  { icon: "mdi-harddisk",     color: "#c62828",  title: "Recupero de Datos",
    items: ["Disco dañado", "Pendrive corrupto", "Tarjeta SD", "SSD con fallas", "Archivos borrados"] },
];

const process = [
  { icon: "mdi-package-variant",  title: "Recepción",   desc: "Registramos el equipo con foto y descripción del problema." },
  { icon: "mdi-magnify",          title: "Diagnóstico", desc: "Evaluamos el problema y preparamos el presupuesto en el día." },
  { icon: "mdi-clipboard-check",  title: "Aprobación",  desc: "Enviamos el presupuesto por WhatsApp. Vos decidís." },
  { icon: "mdi-tools",            title: "Reparación",  desc: "Trabajamos con repuestos de calidad. Te avisamos cuando listo." },
  { icon: "mdi-handshake",        title: "Entrega",     desc: "Retirás el equipo con garantía escrita de 90 días." },
];

const faqs = [
  { q: "¿Cuánto tarda el diagnóstico?",   a: "El diagnóstico es el mismo día en la mayoría de los casos. Equipos con daño por agua pueden demorar hasta 24 horas." },
  { q: "¿Los repuestos son originales?",  a: "Usamos repuestos originales o de primera calidad compatible. Siempre te aclaramos el tipo antes de reparar." },
  { q: "¿Qué garantía tiene la reparación?", a: "90 días de garantía sobre la reparación. Si el mismo problema vuelve, lo resolvemos sin costo." },
  { q: "¿Hacen servicio a domicilio?",    a: "Sí, para empresas y casos especiales. Consultá disponibilidad por WhatsApp." },
  { q: "¿Atienden sin turno?",           a: "Atendemos sin turno de lunes a sábados. Para atención rápida podés agendar turno por WhatsApp." },
];
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
  grid-template-columns: 1fr 300px;
  align-items: center;
  gap: 24px;
}
.hero-kicker { font-size: 11px; letter-spacing: 2px; font-weight: 400; opacity: .7; color: white; text-transform: uppercase; margin-bottom: 10px; }
.hero-title { margin: 0 0 12px; color: white; font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.1; font-weight: 500; }
.hero-sub { margin: 0 0 10px; color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; }

/* Status card */
.status-card { background: #fff !important; box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important; }
.status-header { background: #f0f6ff; }
.pulse { animation: pulse-anim 1.5s ease-in-out infinite; }
@keyframes pulse-anim {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(var(--v-theme-primary), 0); }
}

/* Services */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.svc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.svc-list li::before { content: "· "; color: #aaa; }

/* Process */
.process-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

/* CTA */
.cta-card { background: linear-gradient(135deg, #02498b 0%, #013066 100%) !important; margin-bottom: 32px; }

@media (max-width: 768px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-right { display: none; }
}
@media (max-width: 600px) {
  .hero-inner { padding: 28px 0; }
}
</style>
