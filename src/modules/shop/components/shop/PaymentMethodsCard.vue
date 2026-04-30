<template>
  <v-card class="pm-card" rounded="xl" elevation="0" variant="outlined">
    <v-card-text class="pm-pad">
      <div class="pm-title">Medios de pago</div>

      <!-- Cuotas sin tarjeta -->
      <section class="pm-section">
        <div class="pm-sub">Cuotas sin Tarjeta</div>
        <div class="pm-row">
          <img class="pm-logo" :src="icons.mercadopago" alt="Mercado Pago" />
          <img class="pm-logo pm-logo--sjt" :src="icons.creditoSjt" alt="Crédito San Juan" />
        </div>
      </section>

      <!-- Tarjetas de crédito -->
      <section class="pm-section">
        <div class="pm-sub">Tarjetas de crédito</div>
        <div class="pm-hint">¡Mismo precio en cuotas con bancos seleccionados!</div>
        <div class="pm-row">
          <img class="pm-logo" :src="icons.visa" alt="Visa Crédito" />
          <img class="pm-logo" :src="icons.naranja" alt="Naranja" />
        </div>
      </section>

      <!-- Tarjetas de débito -->
      <section class="pm-section">
        <div class="pm-sub">Tarjetas de débito</div>
        <div class="pm-row">
          <div class="pm-item">
            <img class="pm-logo" :src="icons.visa" alt="Visa Débito" />
            <span class="pm-tag">DÉBITO</span>
          </div>
        </div>
      </section>

      <!-- Efectivo -->
      <section class="pm-section">
        <div class="pm-sub">Efectivo</div>
        <div class="pm-row">
          <div class="pm-cash">
            <v-icon size="18" class="pm-cash__icon">mdi-storefront-outline</v-icon>
            <span>Pago en tienda</span>
          </div>
        </div>
      </section>

      <a class="pm-more" href="javascript:void(0)" @click.prevent="emit('more')">
        Conocé otros medios de pago
      </a>
    </v-card-text>
  </v-card>
</template>

<script setup>
const emit = defineEmits(["more"]);

const icons = {
  mercadopago:
    "https://storage-files.cingulado.org/pos360/media/1769785611712-ef532460bf2a0059.webp",
  visa:
    "https://storage-files.cingulado.org/pos360/media/1769785603289-8ef15a33274405c8.webp",
  naranja:
    "https://storage-files.cingulado.org/pos360/media/1769785599197-627b0a0bac168cee.webp",
  creditoSjt:
    "https://storage-files.cingulado.org/pos360/media/1769958150069-55eff4121596f9f8.webp",
};
</script>

<style scoped>
.pm-card {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.08);
  /* Limitamos el ancho como sidebar estilo ML — el padre controla la posición. */
  max-width: 360px;
  width: 100%;
  margin-left: auto;
  margin-right: 0;
}
.pm-pad {
  padding: 22px 24px 24px;
}

.pm-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #1a1a1a;
  margin-bottom: 18px;
}

/* Apilado vertical estilo ML sidebar */
.pm-section + .pm-section { margin-top: 22px; }
.pm-sub {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
  letter-spacing: -0.005em;
}
.pm-hint {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.55);
  margin: -6px 0 12px;
  line-height: 1.3;
}

/* Logos sueltos */
.pm-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 22px;
}
.pm-logo {
  height: 34px;
  max-width: 92px;
  width: auto;
  object-fit: contain;
  display: block;
}
/* Crédito San Juan: el archivo tiene mucho padding interno, agrandamos un poco */
.pm-logo--sjt {
  height: 46px;
  max-width: 86px;
}

/* Logo + tag DÉBITO */
.pm-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pm-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.55);
  text-transform: uppercase;
}

/* Efectivo */
.pm-cash {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}
.pm-cash__icon { color: rgb(var(--v-theme-primary)); }

/* Link "Conocé otros..." */
.pm-more {
  display: inline-block;
  margin-top: 22px;
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
.pm-more:hover { text-decoration: underline; }

/* mobile */
@media (max-width: 600px) {
  .pm-card {
    max-width: none;
    margin-left: 0;
    margin-right: 0;
  }
  .pm-pad { padding: 16px 16px 18px; }
  .pm-title { font-size: 16px; margin-bottom: 14px; }
  .pm-section + .pm-section { margin-top: 18px; }
  .pm-row { gap: 14px 18px; }
}
</style>
