<!-- src/modules/admin/pages/ShopPaymentsSettingsView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Medios de pago</div>
          <div class="text-caption text-medium-emphasis">
            Activá transferencia, efectivo, Mercado Pago y otros.
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
            Recargar
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="save" :loading="saving">
            Guardar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <v-row dense>
        <!-- Transfer -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Transferencia</div>

            <v-switch v-model="form.transfer_enabled" label="Habilitar transferencia" inset />
            <v-text-field v-model="form.transfer_bank" label="Banco" variant="outlined" density="comfortable" class="mt-2" />
            <v-text-field v-model="form.transfer_alias" label="Alias" variant="outlined" density="comfortable" class="mt-2" />
            <v-text-field v-model="form.transfer_cbu" label="CBU" variant="outlined" density="comfortable" class="mt-2" />
            <v-text-field v-model="form.transfer_holder" label="Titular" variant="outlined" density="comfortable" class="mt-2" />
            <v-textarea
              v-model="form.transfer_instructions"
              label="Instrucciones (checkout)"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mt-2"
            />
          </v-card>
        </v-col>

        <!-- Mercado Pago -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="font-weight-bold">Mercado Pago</div>
              <v-chip
                v-if="form.mp_enabled"
                size="small"
                label
                :color="form.mp_mode === 'test' ? 'warning' : 'success'"
                variant="tonal"
              >
                {{ form.mp_mode === "test" ? "MODO TEST" : "PRODUCCIÓN" }}
              </v-chip>
            </div>

            <v-switch v-model="form.mp_enabled" label="Habilitar Mercado Pago" inset />

            <!-- Modo -->
            <v-select
              v-model="form.mp_mode"
              :items="mpModes"
              item-title="title"
              item-value="value"
              label="Modo Mercado Pago"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              :disabled="!form.mp_enabled"
            />

            <!-- Public Keys opcionales por modo -->
            <v-text-field
              v-model="form.mp_public_key_test"
              label="Public Key TEST (opcional)"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              :disabled="!form.mp_enabled || form.mp_mode !== 'test'"
              hint="Si tu front la necesita (por ahora normalmente NO)."
              persistent-hint
            />

            <v-text-field
              v-model="form.mp_public_key_prod"
              label="Public Key PRODUCCIÓN (opcional)"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              :disabled="!form.mp_enabled || form.mp_mode !== 'prod'"
              hint="Si tu front la necesita (por ahora normalmente NO)."
              persistent-hint
            />

            <!-- Token server: NO se configura acá -->
            <v-text-field
              v-model="form.mp_access_token"
              label="Access Token (server) — se toma del backend/.env"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              type="password"
              disabled
            />

            <v-alert
              type="info"
              variant="tonal"
              class="mt-3"
              density="comfortable"
            >
              <div class="text-body-2">
                <b>Importante:</b> el <b>Access Token</b> real se configura en <b>CapRover (backend/.env)</b>.
                Este panel solo define el <b>modo</b> (TEST/PROD) para que el backend elija
                <code>MERCADOPAGO_ACCESS_TOKEN_TEST</code> o <code>MERCADOPAGO_ACCESS_TOKEN_PROD</code>.
              </div>
            </v-alert>
          </v-card>
        </v-col>

        <!-- Otros -->
        <v-col cols="12">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Otros</div>

            <v-switch v-model="form.cash_enabled" label="Efectivo (retiro/local)" inset />
            <v-textarea
              v-model="form.cash_note"
              label="Nota de efectivo (checkout)"
              variant="outlined"
              density="comfortable"
              rows="2"
              class="mt-2"
            />

            <v-switch v-model="form.card_on_delivery" label="Tarjeta en entrega (si aplica)" inset />

            <v-textarea
              v-model="form.payment_note"
              label="Texto informativo (checkout)"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mt-2"
            />
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="2800">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getShopSetting, putShopSetting } from "@/modules/shop/service/admin.shopSettings.api";

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "" });

const mpModes = [
  { title: "Test (Sandbox)", value: "test" },
  { title: "Producción", value: "prod" },
];

const form = ref({
  transfer_enabled: true,
  transfer_bank: "",
  transfer_alias: "",
  transfer_cbu: "",
  transfer_holder: "",
  transfer_instructions: "Realizá la transferencia y enviá el comprobante. El pedido se confirma al acreditarse.",

  mp_enabled: false,
  mp_mode: "test", // ✅ NUEVO
  mp_public_key_test: "", // ✅ NUEVO (opcional)
  mp_public_key_prod: "", // ✅ NUEVO (opcional)

  // ⚠️ NO se usa para operar (server token va en backend/.env)
  mp_access_token: "",

  cash_enabled: true,
  cash_note: "Disponible para retiro en sucursal o envío local San Juan.",

  card_on_delivery: false,
  payment_note: "Una vez realizado el pedido, te indicaremos cómo completar el pago.",
});

function mergeIncoming(item) {
  const it = item && typeof item === "object" ? item : {};

  // Backward compatibility: si venía mp_public_key viejo, lo mapeamos al modo actual
  const patch = { ...it };

  if (typeof patch.mp_public_key === "string" && patch.mp_public_key.trim()) {
    if (form.value.mp_mode === "prod") patch.mp_public_key_prod = patch.mp_public_key;
    else patch.mp_public_key_test = patch.mp_public_key;
    delete patch.mp_public_key;
  }

  // Si venía mp_access_token guardado en DB, lo mostramos pero NO lo usamos
  if (typeof patch.mp_access_token === "string") {
    patch.mp_access_token = patch.mp_access_token;
  }

  // Defaults si faltan
  if (!patch.mp_mode) patch.mp_mode = form.value.mp_mode || "test";

  form.value = { ...form.value, ...patch };
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const r = await getShopSetting("payments");
    const item = r?.item ?? r?.data?.item ?? r?.settings ?? r?.value ?? null;
    if (item) mergeIncoming(item);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    // Guardamos todo, pero recordá: mp_access_token queda solo “visual”
    await putShopSetting("payments", form.value);
    snack.value = { show: true, text: "Guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
