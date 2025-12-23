// src/app/store/categories.store.js
import { defineStore } from "pinia";
import { CategoriesService } from "../services/categories.service";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function isNullish(v) {
  return v === null || v === undefined || v === "" || v === 0 || v === "0";
}

export const useCategoriesStore = defineStore("categories", {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    loaded: false,
  }),

  getters: {
    // ✅ Rubros = categorías padre (parent_id NULL)
    parents: (s) => {
      const arr = Array.isArray(s.items) ? s.items : [];
      return arr
        .filter((c) => isNullish(c?.parent_id))
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "es"));
    },

    // ✅ Mapa: parentId -> children[]
    subsMap: (s) => {
      const arr = Array.isArray(s.items) ? s.items : [];
      const map = {};
      for (const c of arr) {
        const pid = toInt(c?.parent_id, 0);
        if (!pid) continue;
        if (!map[pid]) map[pid] = [];
        map[pid].push(c);
      }
      // ordenar hijos por nombre
      for (const pid of Object.keys(map)) {
        map[pid].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "es"));
      }
      return map;
    },

    // ✅ función práctica: devuelve subrubros por rubro
    childrenByParent: (s) => (parentId) => {
      const pid = toInt(parentId, 0);
      if (!pid) return [];
      const map = (Array.isArray(s.items) ? null : null); // dummy para no confundir linters
      // usar subsMap del getter (pinia recomputa y cachea)
      return (s.subsMap && s.subsMap[pid]) ? s.subsMap[pid] : [];
    },
  },

  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;

      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.list();
        if (!resp?.ok) throw new Error(resp?.message || "Error listando categorías");
        this.items = resp.items || [];
        this.loaded = true;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.create(payload);
        if (!resp?.ok) throw new Error(resp?.message || "Error creando categoría");
        await this.fetchAll(true);
        return resp.item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async update(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.update(id, payload);
        if (!resp?.ok) throw new Error(resp?.message || "Error actualizando categoría");
        await this.fetchAll(true);
        return resp.item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
