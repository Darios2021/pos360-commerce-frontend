<template>
  <v-card class="pm-card" rounded="xl" elevation="0" variant="outlined">
    <v-card-text class="pm-pad">
      <div class="pm-title">Medios de pago</div>

      <!-- Cuotas sin tarjeta -->
      <section class="pm-section">
        <div class="pm-sub">Cuotas sin tarjeta</div>
        <div class="pm-row">
          <img
            class="pm-logo pm-logo-lg"
            :src="icons.mercadopago"
            alt="Mercado Pago"
          />

          <!-- 🔥 Crédito San Juan alineado y más grande -->
          <img
            class="pm-logo pm-logo-sjt"
            :src="icons.creditoSjt"
            alt="Crédito San Juan"
          />
        </div>
      </section>

      <!-- Tarjetas de crédito -->
      <section class="pm-section">
        <div class="pm-sub">Tarjetas de crédito</div>
        <div class="pm-row">
          <img class="pm-logo" :src="icons.visa" alt="Visa Crédito" />
          <img class="pm-logo" :src="icons.naranja" alt="Naranja" />
        </div>
      </section>

      <!-- Tarjetas de débito -->
      <section class="pm-section">
        <div class="pm-sub">Tarjetas de débito</div>
        <div class="pm-row">
          <img class="pm-logo" :src="icons.visa" alt="Visa Débito" />
        </div>
      </section>

      <!-- Efectivo -->
      <section class="pm-section">
        <div class="pm-sub">Efectivo</div>
        <div class="pm-row">
          <div class="pm-cash">
            Pago en tienda San Juan Tecnología
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

  // ✅ Crédito San Juan (icono definitivo)
  creditoSjt:
    "https://storage-files.cingulado.org/pos360/media/1769958150069-55eff4121596f9f8.webp",
};
</script>

<style scoped>
.pm-card {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.08);
}

.pm-pad {
  padding: 18px;
}

.pm-title {
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 14px;
}

.pm-section + .pm-section {
  margin-top: 18px;
}

.pm-sub {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}

/* fila */
.pm-row {
  display: flex;
  align-items: center; /* base */
  flex-wrap: wrap;
  gap: 28px;
}

/* logos base */
.pm-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

/* Mercado Pago */
.pm-logo-lg {
  height: 48px;
}

/* 🔥 Crédito San Juan – MÁS GRANDE + ALINEADO */
.pm-logo-sjt {
  height: 82px;                /* ↑ más tamaño */
  transform: translateY(-6px); /* ↑ sube ópticamente */
}

/* efectivo */
.pm-cash {
  font-size: 15px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.85);
}

/* link */
.pm-more {
  display: inline-block;
  margin-top: 18px;
  font-size: 14px;
  font-weight: 700;
  color: #1a73e8;
  text-decoration: none;
}
.pm-more:hover {
  text-decoration: underline;
}

/* responsive */
@media (max-width: 600px) {
  .pm-logo {
    height: 42px;
  }
  .pm-logo-lg {
    height: 50px;
  }
  .pm-logo-sjt {
    height: 88px;
    transform: translateY(-6px);
  }
}
</style>
