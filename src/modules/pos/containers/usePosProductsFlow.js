import { ref } from "vue";
import http from "../../../app/api/http";

const q = ref("");
const items = ref([]);
const loading = ref(false);
const detailsItem = ref(null);

function toArr(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

function normalizeRows(rows) {
  return rows.map((item) => ({
    ...item,
    category_name: item?.category_name || item?.category?.name || "",
    subcategory_name: item?.subcategory_name || item?.subcategory?.name || "",
    stock_qty: Number(item?.stock_qty ?? item?.qty ?? 0),
    price: Number(item?.price ?? 0),
    price_list: Number(item?.price_list ?? item?.price ?? 0),
    price_discount: Number(item?.price_discount ?? item?.price ?? 0),
  }));
}

export function usePosProductsFlow() {
  async function searchProducts(query, { exact = false, live = false } = {}) {
    const raw = String(query || "").trim();
    q.value = raw;

    if (!raw) {
      items.value = [];
      return [];
    }

    if (!exact && live && raw.length < 2) {
      items.value = [];
      return [];
    }

    try {
      loading.value = true;

      const { data } = await http.get("/pos/products", {
        params: {
          q: raw,
          page: 1,
          limit: 30,
          in_stock: "true",
          sellable: "true",
        },
      });

      let rows = normalizeRows(toArr(data));

      if (exact) {
        const normalized = raw.toLowerCase();
        const exactRows = rows.filter((p) => {
          const barcode = String(p?.barcode || "").trim().toLowerCase();
          const sku = String(p?.sku || "").trim().toLowerCase();
          const codeField = String(p?.code || "").trim().toLowerCase();

          return (
            barcode === normalized ||
            sku === normalized ||
            codeField === normalized
          );
        });

        rows = exactRows.length ? exactRows : rows;
      }

      items.value = rows;
      return rows;
    } catch (err) {
      console.error("[POS][products] search error", err);
      items.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  function clearSearch() {
    q.value = "";
    items.value = [];
  }

  function add(product) {
    console.log("[POS][products] add", product);
  }

  function openDetails(product) {
    detailsItem.value = product || null;
    console.log("[POS][products] details", product);
  }

  return {
    q,
    items,
    loading,
    detailsItem,
    searchProducts,
    clearSearch,
    add,
    openDetails,
  };
}