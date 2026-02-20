<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/label/ProductQR.vue -->
<template>
  <div class="qr" :style="{ width: sizePx + 'px', height: sizePx + 'px' }" aria-label="QR">
    <img v-if="dataUrl" :src="dataUrl" :alt="alt" class="qr-img" />
    <div v-else class="qr-ph" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import QRCode from "qrcode"; // npm i qrcode

const props = defineProps({
  value: { type: String, required: true },
  sizePx: { type: Number, default: 92 },
  alt: { type: String, default: "QR" },
  margin: { type: Number, default: 0 },
});

const dataUrl = ref("");

const make = async () => {
  try {
    dataUrl.value = await QRCode.toDataURL(props.value || "", {
      width: props.sizePx,
      margin: props.margin,
      errorCorrectionLevel: "M",
    });
  } catch (e) {
    dataUrl.value = "";
  }
};

onMounted(make);
watch(() => [props.value, props.sizePx, props.margin], make, { deep: true });

const alt = computed(() => props.alt);
</script>

<style scoped>
.qr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.qr-img {
  width: 100%;
  height: 100%;
  display: block;
}
.qr-ph {
  width: 100%;
  height: 100%;
  border: 1px dashed rgba(0,0,0,.25);
}
</style>