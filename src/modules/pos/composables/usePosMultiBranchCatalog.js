// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosMultiBranchCatalog.js
//
// FIXES:
// - ✅ Import correcto: usa http de "@/app/api/http"
// - ✅ Merge multi-sucursal REAL: guarda stockByBranch[branchId] por producto
// - ✅ Totales por sucursal activa (NO usando total_qty global)
// - ✅ helpers qtyForBranch / qtyForActive para que PosPage filtre bien
// - ✅ branchesWithStock(p) usa stockByBranch
//
// Uso recomendado desde PosPage:
// const { globalItems, qtyForActive, sellableWithStockActive, fetchGlobalPool, branchesWithStock } = usePosMultiBranchCatalog({ branchScope, isSellable, activeBranchId })

import { ref, computed, watch } from "vue";
import http from "@/app/api/http";

function toInt(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}

function uniqById(arr) {
  const m = new Map();
  for (const x of arr || []) {
    const id = toInt(x?.id, 0);
    if (!id) continue;
    if (!m.has(id)) m.set(id, x);
  }
  return Array.from(m.values());
}

export function usePosMultiBranchCatalog({ branchScope, isSellable, activeBranchId }) {
  const loadingGlobal = ref(false);
  const errorGlobal = ref("");

  // catálogo global (productos únicos) + stockByBranch por producto
  const globalItems = ref([]);

  const debug = ref(false);
  if (typeof window !== "undefined") {
    debug.value = localStorage.getItem("debug_pos_pool") === "1";
  }

  function dlog(...args) {
    if (debug.value) console.log("[POS_POOL]", ...args);
  }

  // -------------------------
  // Helpers de stock por branch
  // -------------------------
  function qtyForBranch(p, branchId) {
    const bid = toInt(branchId, 0);
    if (!bid) return 0;
    const m = p?.stockByBranch || {};
    const q = m[String(bid)];
    return toInt(q, 0);
  }

  function qtyForActive(p) {
    const bid = toInt(activeBranchId?.value ?? activeBranchId, 0);
    if (!bid) return 0;
    return qtyForBranch(p, bid);
  }

  // -------------------------
  // Fetch pool multi-sucursal
  // -------------------------
  async function fetchBranchProducts(branchId, params = {}) {
    const bid = toInt(branchId, 0);
    if (!bid) return { items: [], meta: { total: 0 } };

    // OJO: endpoint que ya estás pegándole
    // GET /pos/products?branch_id=...
    const { data } = await http.get("/pos/products", {
      params: {
        branch_id: bid,
        page: 1,
        limit: 5000,
        in_stock: 0,
        ...params,
      },
    });

    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
    const meta = data?.meta || { total: toInt(data?.total, items.length) };
    return { items, meta };
  }

  function mergeIntoGlobal(branchId, branchItems) {
    const bid = toInt(branchId, 0);
    if (!bid) return;

    const map = new Map(globalItems.value.map((p) => [toInt(p.id, 0), p]));

    for (const raw of branchItems || []) {
      const id = toInt(raw?.id, 0);
      if (!id) continue;

      // qty que devolvió el backend para ESE branch (normalmente viene en total_qty o qty)
      const branchQty =
        toInt(raw?.total_qty, NaN) ||
        toInt(raw?.qty, NaN) ||
        toInt(raw?.stock, NaN) ||
        0;

      const prev = map.get(id);

      if (!prev) {
        // base “neutra” + matriz por sucursal
        const stockByBranch = { [String(bid)]: branchQty };

        // total global = suma de todos los branches cargados
        const totalGlobal = branchQty;

        map.set(id, {
          ...raw,
          stockByBranch,
          total_qty: totalGlobal,
        });
      } else {
        const stockByBranch = { ...(prev.stockByBranch || {}) };
        stockByBranch[String(bid)] = branchQty;

        // recomputa total global con lo ya cargado
        const totalGlobal = Object.values(stockByBranch).reduce((acc, v) => acc + toInt(v, 0), 0);

        map.set(id, {
          ...prev,
          ...raw, // conserva fields nuevos si vienen
          stockByBranch,
          total_qty: totalGlobal,
        });
      }
    }

    globalItems.value = Array.from(map.values());
  }

  async function fetchGlobalPool(params = {}) {
    loadingGlobal.value = true;
    errorGlobal.value = "";

    try {
      const branches = uniqById(branchScope?.branches?.value || branchScope?.branches || []);
      dlog("branches(scope) =", branches);

      // Si querés refrescar SOLO sucursal activa (más rápido), pasá params.only_branch_id
      const onlyBranchId = toInt(params?.only_branch_id, 0);
      const list = onlyBranchId ? branches.filter((b) => toInt(b.id, 0) === onlyBranchId) : branches;

      if (!list.length) {
        globalItems.value = [];
        return;
      }

      // si refrescamos parcial, NO limpiamos todo; si refresco total, limpio
      if (!onlyBranchId) globalItems.value = [];

      const results = await Promise.all(
        list.map(async (b) => {
          const bid = toInt(b.id, 0);
          dlog("GET /pos/products", { branch_id: bid, page: 1, limit: 5000, in_stock: params?.in_stock ?? 0 });
          const r = await fetchBranchProducts(bid, params);
          dlog(`branch ${bid} -> items=${(r.items || []).length} meta.total=${toInt(r.meta?.total, 0)}`);
          return { branchId: bid, items: r.items };
        })
      );

      for (const r of results) mergeIntoGlobal(r.branchId, r.items);

      dlog("merged =", globalItems.value.length);

      // Debug ejemplos
      if (debug.value) {
        const withStock = (globalItems.value || []).filter((p) => toInt(p?.total_qty, 0) > 0);
        dlog("withStock(total_qty>0) =", withStock.length);

        const active = toInt(activeBranchId?.value ?? activeBranchId, 0);
        if (active) {
          const withActiveStock = (globalItems.value || []).filter((p) => qtyForBranch(p, active) > 0);
          dlog(`withStock(active=${active}) =`, withActiveStock.length);
        }
      }
    } catch (e) {
      errorGlobal.value = e?.friendlyMessage || e?.message || "Error cargando catálogo POS";
      console.error(e);
    } finally {
      loadingGlobal.value = false;
    }
  }

  // -------------------------
  // Derivados: stock por sucursal activa
  // -------------------------
  const activeBranchIdNum = computed(() => toInt(activeBranchId?.value ?? activeBranchId, 0));

  const activeItemsWithStock = computed(() => {
    const bid = activeBranchIdNum.value;
    if (!bid) return [];
    return (globalItems.value || []).filter((p) => qtyForBranch(p, bid) > 0);
  });

  const sellableWithStockActive = computed(() => {
    const bid = activeBranchIdNum.value;
    if (!bid) return 0;
    return (globalItems.value || []).filter((p) => qtyForBranch(p, bid) > 0 && isSellable?.(p)).length;
  });

  function branchesWithStock(p) {
    const branches = uniqById(branchScope?.branches?.value || branchScope?.branches || []);
    const out = [];
    for (const b of branches) {
      const bid = toInt(b?.id, 0);
      if (!bid) continue;
      const q = qtyForBranch(p, bid);
      if (q > 0) out.push({ id: bid, name: b?.name || `Sucursal #${bid}`, qty: q });
    }
    return out;
  }

  // Si cambia sucursal activa, opcionalmente refrescamos SOLO esa (rápido)
  watch(
    () => activeBranchIdNum.value,
    async (bid, prev) => {
      if (!bid || bid === prev) return;
      // refresco parcial: recalcula stockByBranch[bid] “fresco”
      await fetchGlobalPool({ in_stock: 0, only_branch_id: bid });
    }
  );

  return {
    loadingGlobal,
    errorGlobal,
    globalItems,

    // ✅ claves para POS
    qtyForBranch,
    qtyForActive,
    activeItemsWithStock,
    sellableWithStockActive,

    fetchGlobalPool,
    branchesWithStock,
  };
}