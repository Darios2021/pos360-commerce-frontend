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
      for (const pid of Object.keys(map)) {
        map[pid].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "es"));
      }
      return map;
    },

    // ✅ FIX: en Pinia, para usar otros getters, usá "this"
    childrenByParent() {
      return (parentId) => {
        const pid = toInt(parentId, 0);
        if (!pid) return [];
        return this.subsMap?.[pid] || [];
      };
    },
  },

  actions: {
    clearError() {
      this.error = null;
    },

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
        this.error = e?.response?.data?.message || e?.friendlyMessage || e?.message || String(e);
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
        this.error = e?.response?.data?.message || e?.friendlyMessage || e?.message || String(e);
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
        this.error = e?.response?.data?.message || e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // ✅ “Eliminar” recomendado en POS: desactivar (soft delete)
    async deactivate(id) {
      return this.update(id, { is_active: 0 });
    },

    // ✅ delete real (solo si tu backend lo soporta)
    async remove(id) {
      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.remove(id);
        if (!resp?.ok) throw new Error(resp?.message || "Error eliminando categoría");
        await this.fetchAll(true);
        return true;
      } catch (e) {
        this.error = e?.response?.data?.message || e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
