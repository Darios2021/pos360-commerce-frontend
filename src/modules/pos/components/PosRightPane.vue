<template>
  <div class="pos-right">
    <div class="pos-surface pos-side-shell pos-customer-shell">
      <PosCustomerPanel
        v-model="customerProxy"
        :disabled="customerDisabled"
        :has-data="customerHasData"
        @clear="$emit('clear-customer')"
      />
    </div>

    <div class="pos-cart-wrap">
      <PosCartPanel
        class="pos-surface pos-side-shell pos-cart-shell"
        :cart="cart"
        :total-items="totalItems"
        :total="total"
        :can-edit="canEdit"
        :pos-store="posStore"
        @checkout="$emit('checkout')"
      />
    </div>

    <div
      v-if="cartBranchLabel"
      class="pos-cart-branch-note text-caption text-medium-emphasis"
    >
      Carrito: <b>{{ cartBranchLabel }}</b>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import PosCustomerPanel from "./PosCustomerPanel.vue";
import PosCartPanel from "./PosCartPanel.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      name: "",
      doc: "",
      phone: "",
      email: "",
      address: "",
      note: "",
    }),
  },
  customerDisabled: { type: Boolean, default: false },
  customerHasData: { type: Boolean, default: false },

  cart: { type: Array, default: () => [] },
  totalItems: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  canEdit: { type: Boolean, default: false },
  posStore: { type: Object, required: true },

  cartBranchLabel: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "clear-customer", "checkout"]);

const customerProxy = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<style scoped>
.pos-right {
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: minmax(190px, auto) minmax(0, 1fr) auto;
  gap: var(--pos-gap, 10px);
  overflow: hidden;
}

.pos-customer-shell {
  min-height: 190px;
  min-width: 0;
  overflow: hidden;
}

.pos-cart-wrap {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
}

.pos-cart-shell {
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pos-cart-branch-note {
  padding-inline: 2px;
  opacity: 0.88;
  line-height: 1.15;
  font-size: 12px;
}

@media (max-height: 900px) {
  .pos-right {
    grid-template-rows: minmax(176px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 176px;
  }
}

@media (max-height: 820px) {
  .pos-right {
    grid-template-rows: minmax(162px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 162px;
  }

  .pos-cart-branch-note {
    font-size: 11px;
  }
}

@media (max-height: 760px) {
  .pos-right {
    grid-template-rows: minmax(148px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 148px;
  }

  .pos-cart-branch-note {
    font-size: 11px;
    line-height: 1.05;
  }
}

@media (max-width: 1280px) {
  .pos-right {
    grid-template-rows: minmax(154px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 154px;
  }
}

@media (max-width: 1100px) {
  .pos-right {
    grid-template-rows: minmax(146px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 146px;
  }
}

@media (max-width: 960px) {
  .pos-right {
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .pos-customer-shell,
  .pos-cart-shell {
    min-height: auto;
  }
}
</style>