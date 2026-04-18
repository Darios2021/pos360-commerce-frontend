<!-- src/modules/shop/pages/ShopLandingServicioTecnico.vue -->
<template>
  <div class="lst" data-page="landing-servicio-tecnico">

    <!-- ══════════════ HERO ══════════════ -->
    <section class="lst-hero">
      <div class="lst-wrap">
        <div class="lst-hero-inner">
          <div class="lst-hero-text">
            <div class="lst-hero-badge">
              <v-icon size="14">mdi-wrench</v-icon>
              Servicio Técnico Certificado
            </div>
            <h1 class="lst-hero-title">
              Reparamos<br />
              <span class="lst-hero-title--accent">tus dispositivos</span>
            </h1>
            <p class="lst-hero-sub">
              Diagnóstico gratis · Presupuesto sin cargo · Garantía en reparaciones.
              Celulares, computadoras, tablets y más.
            </p>
            <div class="lst-hero-actions">
              <a href="https://wa.me/5492646000000" target="_blank" class="lst-btn-primary">
                <v-icon size="18" start>mdi-whatsapp</v-icon>
                Pedir turno
              </a>
              <a href="#servicios" class="lst-btn-secondary">
                Ver servicios
              </a>
            </div>
            <!-- Garantías rápidas -->
            <div class="lst-guarantees">
              <div v-for="g in guarantees" :key="g.text" class="lst-guarantee-item">
                <v-icon size="16" color="#1a9c3e">{{ g.icon }}</v-icon>
                {{ g.text }}
              </div>
            </div>
          </div>

          <!-- Tarjeta visual estado de reparación -->
          <div class="lst-hero-card" aria-hidden="true">
            <div class="lst-status-card">
              <div class="lst-sc-header">
                <v-icon color="#3483fa">mdi-cellphone-check</v-icon>
                <span>Estado de tu reparación</span>
              </div>
              <div class="lst-sc-body">
                <div v-for="step in statusSteps" :key="step.label" class="lst-sc-step" :class="{ 'lst-sc-step--done': step.done, 'lst-sc-step--active': step.active }">
                  <div class="lst-sc-dot">
                    <v-icon v-if="step.done" size="14" color="white">mdi-check</v-icon>
                  </div>
                  <div>
                    <div class="lst-sc-label">{{ step.label }}</div>
                    <div v-if="step.time" class="lst-sc-time">{{ step.time }}</div>
                  </div>
                </div>
              </div>
              <div class="lst-sc-footer">
                <v-icon size="14" color="#3483fa">mdi-message-text</v-icon>
                Te notificamos por WhatsApp
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ SERVICIOS ══════════════ -->
    <section id="servicios" class="lst-section">
      <div class="lst-wrap">
        <div class="lst-sec-head">
          <h2 class="lst-sec-title">¿Qué reparamos?</h2>
          <p class="lst-sec-sub">Servicio técnico para toda clase de dispositivos electrónicos</p>
        </div>
        <div class="lst-services-grid">
          <div v-for="svc in services" :key="svc.title" class="lst-svc-card">
            <div class="lst-svc-icon-wrap" :style="{ background: svc.color + '18', borderColor: svc.color + '33' }">
              <v-icon size="36" :color="svc.color">{{ svc.icon }}</v-icon>
            </div>
            <h3 class="lst-svc-title">{{ svc.title }}</h3>
            <ul class="lst-svc-list">
              <li v-for="item in svc.items" :key="item">{{ item }}</li>
            </ul>
            <a href="https://wa.me/5492646000000" target="_blank" class="lst-svc-cta">
              Consultar
              <v-icon size="14" end>mdi-arrow-right</v-icon>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ PROCESO ══════════════ -->
    <section class="lst-section lst-section--blue">
      <div class="lst-wrap">
        <div class="lst-sec-head">
          <h2 class="lst-sec-title" style="color:#fff">Proceso simple y transparente</h2>
          <p class="lst-sec-sub" style="color:rgba(255,255,255,0.7)">Del diagnóstico a la entrega en pocos pasos</p>
        </div>
        <div class="lst-process">
          <div v-for="(step, i) in process" :key="step.title" class="lst-process-step">
            <div class="lst-process-num">{{ i + 1 }}</div>
            <div class="lst-process-icon">
              <v-icon size="28" color="white">{{ step.icon }}</v-icon>
            </div>
            <h4 class="lst-process-title">{{ step.title }}</h4>
            <p class="lst-process-desc">{{ step.desc }}</p>
            <div v-if="i < process.length - 1" class="lst-process-arrow">›</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ PREGUNTAS FRECUENTES ══════════════ -->
    <section class="lst-section">
      <div class="lst-wrap">
        <div class="lst-sec-head">
          <h2 class="lst-sec-title">Preguntas frecuentes</h2>
        </div>
        <div class="lst-faqs">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="lst-faq"
            :class="{ 'lst-faq--open': openFaq === i }"
            @click="openFaq = openFaq === i ? null : i"
          >
            <div class="lst-faq-q">
              {{ faq.q }}
              <v-icon size="18" :style="{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }">
                mdi-chevron-down
              </v-icon>
            </div>
            <div v-if="openFaq === i" class="lst-faq-a">{{ faq.a }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ CTA ══════════════ -->
    <section class="lst-cta">
      <div class="lst-wrap">
        <div class="lst-cta-inner">
          <div>
            <h2 class="lst-cta-title">¿Tu dispositivo tiene algún problema?</h2>
            <p class="lst-cta-sub">Traelo a nuestro local o contactanos por WhatsApp para un diagnóstico gratuito.</p>
          </div>
          <div class="lst-cta-actions">
            <a href="https://wa.me/5492646000000" target="_blank" class="lst-btn-whatsapp">
              <v-icon size="20" start>mdi-whatsapp</v-icon>
              Hablar ahora
            </a>
          </div>
        </div>
      </div>
    </section>

    <ShopFooter />
  </div>
</template>

<script setup>
import { ref } from "vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const openFaq = ref(null);

const guarantees = [
  { icon: "mdi-check-circle", text: "Diagnóstico gratis" },
  { icon: "mdi-check-circle", text: "Garantía 90 días" },
  { icon: "mdi-check-circle", text: "Repuestos originales" },
];

const statusSteps = [
  { label: "Recepción del equipo",   time: "Hoy 10:30",         done: true,  active: false },
  { label: "Diagnóstico técnico",    time: "Hoy 11:15",         done: true,  active: false },
  { label: "Aprobación presupuesto", time: "Esperando cliente", done: false, active: true  },
  { label: "Reparación",             time: "",                   done: false, active: false },
  { label: "Listo para retirar",     time: "",                   done: false, active: false },
];

const services = [
  {
    icon: "mdi-cellphone",
    color: "#3483fa",
    title: "Celulares",
    items: ["Pantalla rota", "Batería", "Conector de carga", "Software / Virus", "Cámara", "Botones y micrófono"],
  },
  {
    icon: "mdi-laptop",
    color: "#02498b",
    title: "Computadoras y Laptops",
    items: ["Pantalla", "Formateo y reinstalación", "Disco rígido / SSD", "Memoria RAM", "Teclado", "Fuente de alimentación"],
  },
  {
    icon: "mdi-tablet",
    color: "#6a0dad",
    title: "Tablets",
    items: ["Pantalla táctil", "Batería", "Carga USB", "Software", "Botones laterales", "Wi-Fi y conectividad"],
  },
  {
    icon: "mdi-router-wireless",
    color: "#00796b",
    title: "Redes y Conectividad",
    items: ["Configuración de router", "Redes empresariales", "Cableado estructurado", "VPN", "Wi-Fi corporativo", "Firewall"],
  },
  {
    icon: "mdi-printer",
    color: "#e65100",
    title: "Periféricos",
    items: ["Impresoras", "Escáneres", "Monitores", "Teclados y mouse", "Cámaras web", "Auriculares USB"],
  },
  {
    icon: "mdi-harddisk",
    color: "#c62828",
    title: "Recupero de Datos",
    items: ["Disco rígido dañado", "Pendrive corrupto", "Tarjeta SD", "SSD con fallas", "RAID", "Archivos borrados"],
  },
];

const process = [
  { icon: "mdi-package-variant",    title: "Recepción",   desc: "Traés tu equipo y lo registramos en el sistema con foto y descripción del problema." },
  { icon: "mdi-magnify",            title: "Diagnóstico", desc: "En el día evaluamos el problema y preparamos el presupuesto sin cargo." },
  { icon: "mdi-clipboard-check",    title: "Aprobación",  desc: "Te enviamos el presupuesto por WhatsApp. Vos decidís si querés continuar." },
  { icon: "mdi-tools",              title: "Reparación",  desc: "Trabajamos con repuestos de calidad. Te avisamos cuando esté listo." },
  { icon: "mdi-handshake",          title: "Entrega",     desc: "Retirás el equipo con garantía escrita de 90 días en la reparación." },
];

const faqs = [
  { q: "¿Cuánto tarda el diagnóstico?", a: "El diagnóstico es el mismo día en la mayoría de los casos. Equipos con daño por agua o fallas complejas pueden demorar hasta 24 horas." },
  { q: "¿Los repuestos son originales?", a: "Usamos repuestos originales o de primera calidad compatible. Siempre te aclaramos el tipo de repuesto antes de reparar." },
  { q: "¿Qué pasa si no tienen repuesto?", a: "Lo importamos o conseguimos en tiempo acordado. Te notificamos el plazo estimado antes de continuar." },
  { q: "¿Qué garantía tiene la reparación?", a: "90 días de garantía sobre la reparación realizada. Si el mismo problema vuelve a ocurrir, lo resolvemos sin costo." },
  { q: "¿Hacen servicio a domicilio?", a: "Sí, para empresas y casos especiales coordinamos visita técnica. Consultá disponibilidad por WhatsApp." },
  { q: "¿Atienden por turno o sin turno?", a: "Atendemos sin turno de lunes a sábados. Para diagnóstico rápido podés pedir turno y te atendemos sin espera." },
];
</script>

<style scoped>
.lst {
  background: #fff;
  min-height: 100vh;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.lst-wrap { width: min(1240px, calc(100% - 32px)); margin: 0 auto; }

/* ── HERO ── */
.lst-hero {
  background: linear-gradient(135deg, #f8faff 0%, #edf2ff 100%);
  border-bottom: 1px solid #e0e8f8;
  padding: 72px 0 80px;
}
.lst-hero-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 60px;
  align-items: center;
}
.lst-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #c8d8f5;
  color: #02498b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(2,73,139,0.08);
}
.lst-hero-title {
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 800;
  color: #111;
  line-height: 1.12;
  margin: 0 0 16px;
  letter-spacing: -1px;
}
.lst-hero-title--accent { color: #3483fa; }
.lst-hero-sub {
  font-size: 1rem;
  color: #555;
  max-width: 500px;
  line-height: 1.65;
  margin: 0 0 28px;
}
.lst-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.lst-btn-primary {
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
.lst-btn-primary:hover { background: #1da851; transform: translateY(-1px); }
.lst-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #c8d8f5;
  color: #02498b;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 22px;
  border-radius: 10px;
  text-decoration: none;
  transition: border-color .2s, background .2s;
}
.lst-btn-secondary:hover { border-color: #3483fa; background: #f0f6ff; }

.lst-guarantees {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.lst-guarantee-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #444;
  font-weight: 500;
}

/* Status card */
.lst-hero-card { flex-shrink: 0; }
.lst-status-card {
  background: #fff;
  border: 1.5px solid #e0e8f8;
  border-radius: 18px;
  width: 280px;
  box-shadow: 0 8px 32px rgba(2,73,139,0.10);
  overflow: hidden;
}
.lst-sc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: #f0f6ff;
  border-bottom: 1px solid #e0e8f8;
  font-size: 13px;
  font-weight: 600;
  color: #02498b;
}
.lst-sc-body { padding: 14px 18px; display: flex; flex-direction: column; gap: 14px; }
.lst-sc-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  opacity: 0.4;
}
.lst-sc-step--done { opacity: 1; }
.lst-sc-step--active { opacity: 1; }
.lst-sc-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #dce8ff;
  background: #f0f6ff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}
.lst-sc-step--done .lst-sc-dot { background: #1a9c3e; border-color: #1a9c3e; }
.lst-sc-step--active .lst-sc-dot { border-color: #3483fa; background: #fff; animation: lst-pulse 1.5s ease-in-out infinite; }
@keyframes lst-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52,131,250,0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(52,131,250,0); }
}
.lst-sc-label { font-size: 13px; font-weight: 500; color: #222; }
.lst-sc-time { font-size: 11px; color: #888; margin-top: 2px; }
.lst-sc-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: #f0f6ff;
  border-top: 1px solid #e0e8f8;
  font-size: 12px;
  color: #3483fa;
  font-weight: 500;
}

/* ── SECTIONS ── */
.lst-section { padding: 72px 0; }
.lst-section--blue {
  background: linear-gradient(135deg, #02498b 0%, #013066 100%);
}
.lst-sec-head { text-align: center; margin-bottom: 44px; }
.lst-sec-title { font-size: 1.75rem; font-weight: 800; color: #111; margin: 0 0 10px; }
.lst-sec-sub { font-size: 1rem; color: #666; margin: 0; }

/* ── SERVICES ── */
.lst-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}
.lst-svc-card {
  background: #fff;
  border: 1.5px solid #eef0f5;
  border-radius: 16px;
  padding: 28px 22px;
  transition: transform .2s, box-shadow .2s;
}
.lst-svc-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.09); }
.lst-svc-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.lst-svc-title { font-size: 1.05rem; font-weight: 700; color: #111; margin: 0 0 10px; }
.lst-svc-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.lst-svc-list li {
  font-size: 13px;
  color: #555;
  padding-left: 14px;
  position: relative;
}
.lst-svc-list li::before {
  content: "·";
  position: absolute;
  left: 4px;
  color: #aaa;
  font-weight: 700;
}
.lst-svc-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3483fa;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: gap .15s;
}
.lst-svc-cta:hover { gap: 8px; }

/* ── PROCESS ── */
.lst-process {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0;
}
.lst-process-step {
  position: relative;
  text-align: center;
  padding: 28px 20px;
}
.lst-process-num {
  font-size: 3rem;
  font-weight: 900;
  color: rgba(255,255,255,0.1);
  line-height: 1;
  margin-bottom: 8px;
}
.lst-process-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 1.5px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.lst-process-title { font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 8px; }
.lst-process-desc { font-size: 0.83rem; color: rgba(255,255,255,0.65); line-height: 1.55; margin: 0; }
.lst-process-arrow {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  color: rgba(255,255,255,0.25);
  z-index: 1;
}

/* ── FAQs ── */
.lst-faqs { display: flex; flex-direction: column; gap: 0; max-width: 760px; margin: 0 auto; }
.lst-faq {
  border-bottom: 1px solid #eef0f5;
  cursor: pointer;
  padding: 18px 0;
  transition: background .15s;
}
.lst-faq:first-child { border-top: 1px solid #eef0f5; }
.lst-faq-q {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #111;
  gap: 12px;
}
.lst-faq--open .lst-faq-q { color: #02498b; }
.lst-faq-a {
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  margin-top: 10px;
  padding-right: 32px;
}

/* ── CTA ── */
.lst-cta {
  background: #f0f6ff;
  border-top: 1px solid #dce8ff;
  padding: 56px 0;
}
.lst-cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}
.lst-cta-title { font-size: 1.4rem; font-weight: 800; color: #111; margin: 0 0 8px; }
.lst-cta-sub { font-size: 0.95rem; color: #555; margin: 0; max-width: 480px; line-height: 1.5; }
.lst-btn-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #25d366;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 28px;
  border-radius: 10px;
  text-decoration: none;
  white-space: nowrap;
  transition: background .2s, transform .15s;
}
.lst-btn-whatsapp:hover { background: #1da851; transform: translateY(-1px); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .lst-hero-inner { grid-template-columns: 1fr; gap: 32px; }
  .lst-hero-card { display: none; }
  .lst-process { grid-template-columns: 1fr; }
  .lst-process-arrow { display: none; }
  .lst-cta-inner { flex-direction: column; text-align: center; }
  .lst-hero-actions { flex-direction: column; }
}
</style>
