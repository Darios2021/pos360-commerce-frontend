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
import {
  authMe,
  authLogout,
  authGoogle,
  authUpdateProfile,
} from "@/modules/shop/service/shop.auth.public.api";
import { setToken, clearToken, getToken } from "@/app/utils/tokenStorage";

function safeCustomer(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: c.id ?? null,
    email: c.email ?? null,
    first_name: c.first_name ?? null,
    last_name: c.last_name ?? null,
    phone: c.phone ?? null,
    picture_url: c.picture_url || null,
    // Backend lo manda como boolean coerced; si llega 0/1 lo coerce de nuevo.
    profile_completed: c.profile_completed === true || Number(c.profile_completed) === 1,
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
    isProfileComplete: (s) => !!(s.customer && s.customer.profile_completed),
    /**
     * true cuando hay cliente logueado pero le falta completar el perfil.
     * Lo usamos para disparar el modal bloqueante en el shop layout.
     */
    needsProfile: (s) => !!(s.customer && s.customer.id && !s.customer.profile_completed),
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
    avatarUrl: (s) => String(s.customer?.picture_url || "").trim(),
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

        // Persistimos el session token que el backend devuelve en el body
        // (necesario para Capacitor — la cookie httpOnly no es confiable
        // entre cierres del WebView).
        const token = r?.session?.token ?? r?.data?.session?.token ?? null;
        const expiresIn = Number(r?.session?.expires_in ?? r?.data?.session?.expires_in ?? 0);
        if (token) {
          try { await setToken(token, expiresIn); } catch {}
        }

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

    /**
     * Completa o actualiza el perfil del cliente logueado.
     * payload: { first_name, last_name, phone, password? }
     * Si password viene vacía, no se cambia.
     */
    async updateProfile(payload) {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        const r = await authUpdateProfile(payload);
        const customer = r?.customer ?? r?.data?.customer ?? null;
        if (customer) {
          this.customer = safeCustomer(customer);
        } else {
          // fallback: re-fetch /me
          await this.fetchMe({ force: true });
        }
        return this.customer;
      } catch (e) {
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
        try { await clearToken(); } catch {}
        this.customer = null;
        this.booted = true;
        this.loading = false;
      }
    },

    /**
     * Hidratación al boot del app. En mobile (Capacitor) lee el token
     * persistido y lo usa para validar la sesión via /me. En web cae
     * a fetchMe() directo (la cookie httpOnly va por sí sola).
     */
    async hydrate() {
      try {
        const tok = await getToken();
        const isNative =
          typeof window !== "undefined" &&
          window.Capacitor?.isNativePlatform?.();
        if (isNative && !tok) {
          // Sin token guardado en mobile → seguimos como invitado.
          this.booted = true;
          return null;
        }
        await this.fetchMe({ force: true });
        return this.customer;
      } catch {
        this.booted = true;
        return null;
      }
    },
  },
});
