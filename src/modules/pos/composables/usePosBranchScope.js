// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosBranchScope.js

import { computed } from "vue";

function toInt(v, def = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function pickBranchName(b) {
  const name = String(
    b?.name ??
      b?.branch_name ??
      b?.nombre ??
      b?.display_name ??
      b?.displayName ??
      b?.title ??
      b?.label ??
      b?.branch?.name ??
      b?.branch?.branch_name ??
      ""
  ).trim();
  return name || null;
}

function normalizeBranches(raw) {
  let arr = Array.isArray(raw?.value) ? raw.value : Array.isArray(raw) ? raw : [];
  if (!arr.length) return [];

  // caso [1,2,3]
  if (typeof arr[0] !== "object") {
    const ids = arr.map((x) => toInt(x, 0)).filter((id) => id > 0);
    const uniq = Array.from(new Set(ids));
    return uniq.map((id) => ({ id, name: `Sucursal #${id}` }));
  }

  const out = arr
    .map((b) => {
      const id = toInt(b?.id ?? b?.branch_id ?? b?.branchId, 0);
      const name = pickBranchName(b);
      return { id, name };
    })
    .filter((b) => b.id > 0)
    .map((b) => ({ id: b.id, name: b.name || `Sucursal #${b.id}` }));

  const map = new Map();
  for (const b of out) map.set(b.id, b);
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

function readLegacyToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("auth_token") ||
      ""
    );
  } catch {
    return "";
  }
}

function readDebugFlag() {
  try {
    return localStorage.getItem("debug_pos") === "1" || localStorage.getItem("debug_pos_pool") === "1";
  } catch {
    return false;
  }
}

export function usePosBranchScope({ auth, userBranches, branchItems } = {}) {
  const debug = computed(() => readDebugFlag());

  function dlog(...args) {
    if (!debug.value) return;
    // eslint-disable-next-line no-console
    console.log("[POS_SCOPE]", ...args);
  }

  const token = computed(() => {
    const t =
      String(auth?.accessToken || auth?.access_token || auth?.token || "").trim() || String(readLegacyToken() || "").trim();
    return t || "";
  });

  const branches = computed(() => {
    // 1) auth.branches getter (si existe)
    const fromGetter = normalizeBranches(auth?.branches);
    if (fromGetter.length) return fromGetter;

    // 2) auth.user.branches
    const fromUser = normalizeBranches(auth?.user?.branches);
    if (fromUser.length) return fromUser;

    // 3) userBranches (usePosBranch)
    const fromUsePosBranch = normalizeBranches(userBranches);
    if (fromUsePosBranch.length) return fromUsePosBranch;

    // 4) branchItems fallback
    const items = Array.isArray(branchItems?.value) ? branchItems.value : Array.isArray(branchItems) ? branchItems : [];
    const fromItems = items
      .map((x) => ({ id: toInt(x?.value, 0), name: String(x?.title || "").trim() || null }))
      .filter((b) => b.id > 0)
      .map((b) => ({ id: b.id, name: b.name || `Sucursal #${b.id}` }));
    if (fromItems.length) return fromItems;

    // 5) fallback branch_id
    const main = toInt(auth?.user?.branch_id, 0);
    return main ? [{ id: main, name: `Sucursal #${main}` }] : [];
  });

  const ids = computed(() => (branches.value || []).map((b) => toInt(b?.id, 0)).filter((x) => x > 0));
  const isMulti = computed(() => ids.value.length > 1);

  dlog("token.len =", token.value?.length || 0);
  dlog("branches =", branches.value);

  return {
    debug,
    token,
    branches,
    ids,
    isMulti,
    dlog,
  };
}