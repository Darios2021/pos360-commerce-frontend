// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/store/shopAuth.store.js
//
// Store simple de sesión SHOP (cookie httpOnly)
// - fetchMe() trae customer desde /public/auth/me
// - logout() llama /public/auth/logout y limpia state
// - setCustomer() para setear rápido luego de login en UI
// - ✅ loginGoogle({ credential }) -> POST /public/auth/google y setea customer
//
// Requiere Pinia (ya usás en cart)

import { defineStore } from "pinia";
import { authMe, authLogout, authGoogle } from "@/modules/shop/service/shop.auth.public.api";

function safeCustomer(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: c.id ?? null,
    email: c.email ?? null,
    first_name: c.first_name ?? null,
    last_name: c.last_name ?? null,
    phone: c.phone ?? null,
  };
}

export const useShopAuthStore = defineStore("shopAuth", {
  state: () => ({
    customer: null,
    loading: false,
    error: null,
    booted: false, // evita refetch en bucle
  }),

  getters: {
    isLogged: (s) => !!(s.customer && s.customer.id),
    fullName: (s) => {
      const c = s.customer;
      if (!c) return "";
      const n = `${c.first_name || ""} ${c.last_name || ""}`.trim();
      return n || (c.email || "");
    },
    initials: (s) => {
      const c = s.customer;
      if (!c) return "";
      const a = (c.first_name || "").trim().slice(0, 1).toUpperCase();
      const b = (c.last_name || "").trim().slice(0, 1).toUpperCase();
      const e = (c.email || "").trim().slice(0, 1).toUpperCase();
      return (a + b).trim() || e || "U";
    },
  },

  actions: {
    setCustomer(c) {
      this.customer = safeCustomer(c);
      this.error = null;
      this.booted = true;
    },

    async fetchMe({ force = false } = {}) {
      if (this.loading) return;
      if (this.booted && !force) return;

      this.loading = true;
      this.error = null;

      try {
        const r = await authMe();
        this.customer = safeCustomer(r?.customer);
        this.booted = true;
      } catch (e) {
        this.customer = null;
        this.booted = true;
        this.error = e?.friendlyMessage || e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    // ✅ NUEVO: login Google (GIS credential)
    async loginGoogle({ credential } = {}) {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        if (!credential || typeof credential !== "string") {
          throw new Error("No llegó credential de Google.");
        }

        // POST /public/auth/google  { credential }
        const r = await authGoogle({ credential });

        // muchos backends devuelven { customer }, otros { data: { customer } }
        const customer = r?.customer ?? r?.data?.customer ?? null;

        // si vino customer, seteamos; si no, pedimos /me por consistencia
        if (customer) {
          this.customer = safeCustomer(customer);
          this.booted = true;
        } else {
          // fuerza leer cookie + customer desde /me
          await this.fetchMe({ force: true });
        }

        // si igual no quedó logueado, levantamos error
        if (!this.customer?.id) {
          throw new Error("Login Google no pudo iniciar sesión (customer vacío).");
        }

        return this.customer;
      } catch (e) {
        this.customer = null;
        this.booted = true;
        this.error = e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        await authLogout();
      } catch (e) {
        // aunque falle, igual limpiamos state para UX
      } finally {
        this.customer = null;
        this.booted = true;
        this.loading = false;
      }
    },
  },
});
