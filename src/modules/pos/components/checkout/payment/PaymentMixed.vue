<template>
  <div class="ck-mixed">
    <div class="ck-mixed__head">
      <div>
        <div class="ck-mixed__title">Pago mixto</div>
        <div class="ck-mixed__subtitle">
          Distribuí el cobro entre varios medios
        </div>
      </div>

      <v-btn
        size="default"
        rounded="lg"
        variant="tonal"
        class="ck-mixed__add"
        @click="$emit('add-mixed-row')"
      >
        <v-icon start size="18">mdi-plus</v-icon>
        Agregar
      </v-btn>
    </div>

    <div class="ck-mixed__list">
      <div
        v-for="(row, idx) in state.mixedPayments"
        :key="row.uid"
        class="ck-mixed-row"
      >
        <div class="ck-mixed-row__top">
          <div class="ck-mixed-row__index">
            Pago {{ idx + 1 }}
          </div>

          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            rounded="lg"
            :disabled="state.mixedPayments.length === 1"
            @click="$emit('remove-mixed-row', row.uid)"
          />
        </div>

        <div class="ck-mixed-row__fields">
          <v-select
            v-model="row.payment_method_id"
            :items="mixedMethodItems"
            item-title="title"
            item-value="value"
            label="Medio"
            variant="outlined"
            density="comfortable"
            hide-details
          />

          <v-text-field
            :ref="idx === 0 ? setMixedAmountRef : null"
            v-model="row.amount"
            label="Importe"
            variant="outlined"
            density="comfortable"
            hide-details
            inputmode="numeric"
          />
        </div>
      </div>
    </div>

    <div class="ck-mixed__totals">
      <div class="ck-mixed-total">
        <span>Pagado</span>
        <strong>{{ money(mixedPaid) }}</strong>
      </div>

      <div
        class="ck-mixed-total"
        :class="{ warn: mixedMissing > 0 }"
      >
        <span>Falta</span>
        <strong>{{ money(mixedMissing) }}</strong>
      </div>

      <div
        class="ck-mixed-total"
        :class="{ ok: mixedChange > 0 }"
      >
        <span>Vuelto</span>
        <strong>{{ money(mixedChange) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  state: { type: Object, required: true },
  mixedMethodItems: { type: Array, default: () => [] },
  mixedPaid: { type: Number, default: 0 },
  mixedMissing: { type: Number, default: 0 },
  mixedChange: { type: Number, default: 0 },
  money: { type: Function, required: true },
  setMixedAmountRef: { type: Function, default: null },
});

defineEmits([
  "add-mixed-row",
  "remove-mixed-row",
]);
</script>

<style scoped>
.ck-mixed {
  display: grid;
  gap: 14px;
}

.ck-mixed__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.ck-mixed__title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.ck-mixed__subtitle {
  margin-top: 4px;
  font-size: 0.84rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.ck-mixed__add {
  min-height: 42px;
  font-weight: 900;
}

.ck-mixed__list {
  display: grid;
  gap: 12px;
  max-height: 420px;
  overflow: auto;
  padding-right: 4px;
}

.ck-mixed__list::-webkit-scrollbar {
  width: 8px;
}

.ck-mixed__list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 999px;
}

.ck-mixed-row {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.ck-mixed-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ck-mixed-row__index {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.ck-mixed-row__fields {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 10px;
}

.ck-mixed__totals {
  display: grid;
  gap: 10px;
}

.ck-mixed-total {
  min-height: 46px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.94rem;
}

.ck-mixed-total strong {
  font-weight: 900;
  white-space: nowrap;
}

.ck-mixed-total.warn {
  color: rgb(var(--v-theme-error));
}

.ck-mixed-total.ok {
  color: rgb(var(--v-theme-success));
}

@media (max-width: 760px) {
  .ck-mixed-row__fields {
    grid-template-columns: 1fr;
  }
}
</style>