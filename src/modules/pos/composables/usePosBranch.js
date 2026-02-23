// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosBranch.js
import { ref, computed } from "vue";
import http from "../../../app/api/http";

function toInt(v, def = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function isPlaceholderName(name, id) {
  const s = String(name || "").trim();
  if (!s) return true;
  // "Sucursal #3"
  if (id && s === `Sucursal #${id}`) return true;
  // por las dudas
  if (/^sucursal\s*#\s*\d+$/i.test(s)) return true;
  return false;
}

function normalizeBranches(raw) {
  // raw puede ser:
  // - [{id,name}, ...]
  // - [{branch_id,name}, ...]
  // - [1,2,3]
  // - ["1","2"]
  let arr = Array.isArray(raw?.value) ? raw.value : Array.isArray(raw) ? raw : [];

  if (!arr.length) return [];

  // caso números
  if (typeof arr[0] !== "object") {
    const ids = arr.map((x) => toInt(x, 0)).filter((id) => id > 0);
    const uniq = Array.from(new Set(ids));
    return uniq.map((id) => ({ id, name: `Sucursal #${id}` }));
  }

  // caso objetos
  const out = arr
    .map((b) => ({
      id: toInt(b?.id ?? b?.branch_id ?? b?.branchId ?? b?.value, 0),
      name: String(b?.name || b?.title || b?.label || b?.branch_name || "").trim() || null,
    }))
    .filter((b) => b.id > 0)
    .map((b) => ({ id: b.id, name: b.name || `Sucursal #${b.id}` }));

  // uniq
  const map = new Map();
  for (const b of out) map.set(b.id, b);
  return Array.from(map.values());
}

function normalizeList(payload) {
  const a =
    payload?.data?.items ??
    payload?.items ??
    payload?.data?.data?.items ??
    payload?.data?.data ??
    payload?.data ??
    payload;
  return Array.isArray(a) ? a : [];
}

export function usePosBranch({ auth, posStore }) {
  const branchPickOpen = ref(false);
  const activeBranchId = ref(null);

  // ✅ cache interno de sucursales (por si las traemos desde API)
  const fetchedBranches = ref([]);

  // ✅ debug flags (sin rebuild)
  const debug = computed(() => {
    try {
      return localStorage.getItem("debug_pos_branch") === "1" || localStorage.getItem("debug_pos") === "1";
    } catch {
      return false;
    }
  });

  function dlog(...args) {
    if (!debug.value) return;
    // eslint-disable-next-line no-console
    console.log("[POS_BRANCH]", ...args);
  }

  // ✅ Detecta si hay que buscar nombres reales
  const needsRealNames = computed(() => {
    const fromUser = normalizeBranches(auth?.user?.branches);
    if (!fromUser.length) return false;
    return fromUser.some((b) => isPlaceholderName(b?.name, b?.id));
  });

  // ✅ Trae nombres reales desde backend (sirve para admin y NO admin)
  async function ensureBranchesLoadedForNames() {
    // si ya tenemos nombres reales en fetchedBranches, ok
    const already = normalizeBranches(fetchedBranches.value);
    if (already.length && already.some((b) => !isPlaceholderName(b?.name, b?.id))) return;

    // si el user no necesita reemplazo (ya trae nombres), no hace falta
    if (!needsRealNames.value) return;

    const candidates = ["/branches", "/admin/branches"];
    for (const url of candidates) {
      try {
        dlog("GET", url);
        const { data } = await http.get(url, { params: { limit: 5000 } });
        dlog("RESP body =", data);

        const list = normalizeList(data);
        dlog("LIST len =", list.length, "sample =", list?.[0]);

        const norm = normalizeBranches(list);
        dlog("NORM len =", norm.length, "sample =", norm?.[0]);

        if (norm.length) {
          fetchedBranches.value = norm;
          return;
        }
      } catch (e) {
        // probar siguiente
        dlog("GET failed", url, e?.message || e);
      }
    }
  }

  // ✅ userBranches robusto:
  // - si auth.user.branches viene como [1,2,3], lo usamos como "ids permitidos"
  // - pero si fetchedBranches trae nombres reales, los pisamos
  const userBranches = computed(() => {
    const fromUser = normalizeBranches(auth?.user?.branches);
    const fromFetch = normalizeBranches(fetchedBranches.value);

    // Mapa id -> nombre real (del backend)
    const realNameById = new Map();
    for (const b of fromFetch) {
      const id = toInt(b?.id, 0);
      const name = String(b?.name || "").trim();
      if (id > 0 && name && !isPlaceholderName(name, id)) {
        realNameById.set(id, name);
      }
    }

    // 1) Si el user ya trae branches, devolvemos esas PERO con nombres reales si existen
    if (fromUser.length) {
      const merged = fromUser.map((b) => {
        const id = toInt(b?.id, 0);
        const real = realNameById.get(id);
        const currentName = String(b?.name || "").trim();
        const name = real ? real : currentName || `Sucursal #${id}`;
        return { id, name };
      });

      // uniq
      const map = new Map();
      for (const b of merged) if (b.id > 0) map.set(b.id, b);
      return Array.from(map.values());
    }

    // 2) Si no hay fromUser, usamos fetched
    if (fromFetch.length) return fromFetch;

    // 3) fallback branch_id
    const main = toInt(auth?.user?.branch_id, 0);
    return main ? [{ id: main, name: `Sucursal #${main}` }] : [];
  });

  const branchItems = computed(() =>
    (userBranches.value || [])
      .map((b) => ({ title: String(b?.name || `Sucursal #${b?.id}`), value: toInt(b?.id, 0) }))
      .filter((x) => toInt(x.value, 0) > 0)
  );

  const needsBranchPick = computed(() => (branchItems.value.length > 1 ? !toInt(activeBranchId.value, 0) : false));

  function getStoredBranchId() {
    try {
      const v = localStorage.getItem("pos_branch_id");
      const n = toInt(v, 0);
      return n > 0 ? n : null;
    } catch {
      return null;
    }
  }

  function storeBranchId(id) {
    try {
      const n = toInt(id, 0);
      localStorage.setItem("pos_branch_id", n > 0 ? String(n) : "");
    } catch {}
  }

  function isAllowedBranchId(id) {
    const bid = toInt(id, 0);
    if (!bid) return false;
    return branchItems.value.some((x) => toInt(x.value, 0) === bid);
  }

  function pickDefaultBranch() {
    const main = toInt(auth?.user?.branch_id, 0) || null;
    if (main && isAllowedBranchId(main)) {
      activeBranchId.value = main;
      return;
    }
    const first = toInt(branchItems.value?.[0]?.value, 0) || null;
    if (first) activeBranchId.value = first;
  }

  const branchName = computed(() => {
    const bid = toInt(activeBranchId.value || auth?.user?.branch_id || posStore?.branch_id, 0) || null;
    const bs = userBranches.value || [];
    const found = bid ? bs.find((b) => toInt(b?.id, 0) === bid) : null;
    return found?.name || null;
  });

  const branchChipLabel = computed(() => {
    if (branchName.value) return branchName.value;
    const bid = toInt(activeBranchId.value || posStore?.branch_id || auth?.user?.branch_id, 0) || null;
    return bid ? `Sucursal #${bid}` : "—";
  });

  async function applyBranchToPosContext(bid) {
    const id = toInt(bid, 0) || null;
    if (!id) return;

    storeBranchId(id);

    try {
      const posBranch = toInt(posStore?.branch_id, 0) || null;

      if (posStore?.setBranch && posBranch !== id) {
        posStore.resetContext?.();
        posStore.setBranch(id);
      }

      await posStore.ensureContext?.({ force: true });
    } catch {}
  }

  async function confirmBranchPick() {
    const bid = toInt(activeBranchId.value, 0) || null;
    if (!bid || !isAllowedBranchId(bid)) return;
    await applyBranchToPosContext(bid);
    branchPickOpen.value = false;
  }

  // ✅ asegura una sucursal elegida al entrar (onMounted)
  async function ensureBranchSelected() {
    // 🔥 clave: si el user trae [1,2,3], buscamos nombres reales
    await ensureBranchesLoadedForNames();

    const multi = branchItems.value.length > 1;

    let desired = toInt(activeBranchId.value, 0) || null;

    if (!desired) {
      const stored = getStoredBranchId();
      if (stored && isAllowedBranchId(stored)) desired = stored;
    }

    if (!desired) {
      const main = toInt(auth?.user?.branch_id, 0) || null;
      if (main && (!multi || isAllowedBranchId(main))) desired = main;
    }

    if (!desired && branchItems.value.length) desired = toInt(branchItems.value[0].value, 0) || null;

    if (multi && !desired) {
      activeBranchId.value = null;
      branchPickOpen.value = true;
      return { ok: false };
    }

    if (desired && activeBranchId.value !== desired) activeBranchId.value = desired;

    if (desired) await applyBranchToPosContext(desired);

    if (multi && !toInt(activeBranchId.value, 0)) branchPickOpen.value = true;

    return { ok: !needsBranchPick.value };
  }

  return {
    userBranches,
    branchItems,
    branchPickOpen,
    activeBranchId,
    branchName,
    branchChipLabel,
    needsBranchPick,
    pickDefaultBranch,
    confirmBranchPick,
    ensureBranchSelected,
    fetchedBranches,
  };
}