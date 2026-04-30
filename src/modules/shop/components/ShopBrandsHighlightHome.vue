<!-- Wrapper de marcas destacadas para el home (Xiaomi + XAEA por defecto) -->
<template>
  <ShopBrandsHighlightBlock v-if="resolvedSlides.length" :slides="resolvedSlides" />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { buildProductLocation } from "@/modules/shop/utils/productSlug";
import ShopBrandsHighlightBlock from "@/modules/shop/components/ShopBrandsHighlightBlock.vue";

const props = defineProps({
  /**
   * Cada brand define cómo mostrar la marca:
   * - brand:        nombre comercial mostrado / usado para deeplink
   * - search:       string de búsqueda para encontrar el producto destacado
   * - brandLogoUrl: URL del logo (cuadrada, fondo claro)
   * - kicker:       línea pequeña sobre el título (opcional)
   * - headline:     título destacado (string o array de líneas)
   * - cta:          texto del botón
   * - theme:        'dark' | 'light'
   * - mediaBg:      override del fondo del lado izquierdo
   * - bg:           override del fondo del lado derecho
   * - href:         destino (route obj o url). Si no se setea, va a /shop/search?brand=…
   */
  brands: {
    type: Array,
    default: () => [
      {
        brand: "Xiaomi",
        search: "Xiaomi parlante",
        brandLogoUrl:
          "https://w7.pngwing.com/pngs/368/356/png-transparent-xiaomi-logo-icon-thumbnail.png",
        productImage:
          "https://storage-files.cingulado.org/pos360/media/1777556355995-daa0966cad126e74.webp",
        productMaxHeight: "240px",
        productMaxWidth: "92%",
        kicker: "Tecnología Xiaomi",
        headline: ["Parlantes y", "tecnología Xiaomi"],
        description:
          "Sonido potente, batería extendida y diseño cuidado para tu día a día.",
        cta: "Ver ofertas",
        mediaBg: "linear-gradient(135deg, #1565C0 0%, #0d47a1 60%, #08306b 100%)",
        href: {
          name: "shopProduct",
          params: { id: "281" },
          query: { branch_id: "3" },
        },
      },
      {
        brand: "XAEA",
        search: "Bloomline XAEA Wireless",
        brandLogoUrl:
          "https://xaea.com.ar/wp-content/uploads/2025/06/LOGO-XAEA-ARGENTINA-1200x1200-1-e1749695511674.png",
        productImage:
          "https://storage-files.cingulado.org/pos360/media/1777556345695-6babc0843643597f.webp",
        kicker: "Audio premium",
        headline: ["Bloomline XAEA", "Wireless 10X"],
        description:
          "Conectividad inalámbrica de alto rendimiento con sonido envolvente.",
        cta: "Ver ofertas",
        mediaBg: "linear-gradient(135deg, #1565C0 0%, #0d47a1 60%, #08306b 100%)",
      },
    ],
  },
});

const resolvedProducts = ref([]);

function pickProduct(items, search) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;
  // priorizar el que tenga imagen
  const withImg = arr.find((x) => String(x?.image_url || "").trim());
  return withImg || arr[0];
}

async function fetchOne(b) {
  try {
    const r = await getCatalog({
      search: b.search || b.brand || "",
      page: 1,
      limit: 6,
    });
    return pickProduct(r?.items || [], b.search);
  } catch (e) {
    console.warn("[ShopBrandsHighlightHome] fallo fetch", b.brand, e?.message || e);
    return null;
  }
}

const resolvedSlides = computed(() => {
  return props.brands
    .map((b, i) => {
      const p = resolvedProducts.value[i] || null;
      // si la marca trae productImage explícita, mandar esa; sino, la del fetch
      const finalImage = b.productImage || p?.image_url || "";
      return {
        ...b,
        productImage: finalImage,
        productName: b.productName || p?.name || b.brand,
        // deeplink al producto si lo tenemos, sino a la búsqueda por marca
        href:
          b.href ||
          buildProductLocation(p) ||
          { name: "shopSearch", query: { brand: String(b.brand || "").trim() } },
      };
    })
    .filter((s) => s.productImage || s.brandLogoUrl);
});

onMounted(async () => {
  resolvedProducts.value = await Promise.all(props.brands.map(fetchOne));
});
</script>
