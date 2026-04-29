// src/modules/shop/service/shopFavorites.store.js
//
// Store reactivo de favoritos del cliente logueado.
// - Cachea el set de product_id favoritos para que cualquier ProductCard
//   pueda consultar "¿está en favoritos?" sin llamar al backend.
// - Optimistic toggle: actualiza UI antes de la respuesta y revierte si falla.
// - Si el cliente no está logueado, los métodos no hacen nada (silencioso).

import { defineStore } from "pinia";
import {
  getMyFavorites,
  addFavorite,
  removeFavorite,
} from "@/modules/shop/service/shop.account.public.api";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

export const useShopFavoritesStore = defineStore("shopFavorites", {
  state: () => ({
    /** Set<number> con los product_id favoritos */
    ids: new Set(),
    loading: false,
    booted: false,
    error: null,
  }),

  getters: {
    isFavorite: (s) => (productId) => s.ids.has(Number(productId)),
    count: (s) => s.ids.size,
  },

  actions: {
    /**
     * Carga la lista de favoritos del backend. Idempotente: solo vuelve a
     * pedir si force=true o si el cliente cambió.
     */
    async fetch({ force = false } = {}) {
      const auth = useShopAuthStore();
      if (!auth.isLogged) {
        this.ids = new Set();
        this.booted = true;
        return;
      }
      if (this.booted && !force) return;
      if (this.loading) return;

      this.loading = true;
      this.error = null;
      try {
        const r = await getMyFavorites();
        const list = r?.items || r?.favorites || r?.data || (Array.isArray(r) ? r : []);
        const next = new Set();
        for (const it of list || []) {
          const pid = Number(it?.product_id ?? it?.id);
          if (pid > 0) next.add(pid);
        }
        this.ids = next;
        this.booted = true;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    /** Agrega o quita el producto de favoritos según corresponda. Optimistic.
        IMPORTANTE: reasignamos `ids = new Set(...)` en cada cambio para que
        Pinia detecte la mutación y refresque las computed (set.add/delete
        sobre el mismo Set NO disparan reactividad). */
    async toggle(productId) {
      const auth = useShopAuthStore();
      if (!auth.isLogged) return { ok: false, reason: "NOT_LOGGED_IN" };
      if (!auth.isProfileComplete) return { ok: false, reason: "PROFILE_INCOMPLETE" };

      const pid = Number(productId);
      if (!pid) return { ok: false, reason: "INVALID_ID" };

      const wasFav = this.ids.has(pid);

      // Optimistic UI — reasignamos para disparar reactividad
      const optimistic = new Set(this.ids);
      if (wasFav) optimistic.delete(pid);
      else optimistic.add(pid);
      this.ids = optimistic;

      try {
        if (wasFav) await removeFavorite(pid);
        else await addFavorite(pid);
        return { ok: true, isFav: !wasFav };
      } catch (e) {
        // Revert — también reasignando
        const reverted = new Set(this.ids);
        if (wasFav) reverted.add(pid);
        else reverted.delete(pid);
        this.ids = reverted;
        this.error = e?.friendlyMessage || e?.message || String(e);
        return { ok: false, reason: "API_ERROR", error: this.error };
      }
    },

    /** Limpia el state — invocar al hacer logout. */
    reset() {
      this.ids = new Set();
      this.booted = false;
      this.error = null;
    },
  },
});
