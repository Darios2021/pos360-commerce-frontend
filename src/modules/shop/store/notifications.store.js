// src/modules/shop/store/notifications.store.js
//
// Store de notificaciones del cliente del shop. Mantiene:
//  - lista paginada de notificaciones
//  - contador de no leídas (badge)
//  - polling automático cada 60s cuando hay sesión activa
//
// startPolling() se llama desde el header (NotificationBell) cuando
// el usuario está logueado. stopPolling() al hacer logout.

import { defineStore } from "pinia";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/modules/shop/service/notifications.api";

const POLL_INTERVAL_MS = 60_000;

let _pollTimer = null;

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    items: [],
    total: 0,
    unread: 0,
    loading: false,
    error: null,
    lastFetchedAt: 0,
  }),

  getters: {
    hasUnread: (s) => s.unread > 0,
  },

  actions: {
    async refreshUnread() {
      try {
        this.unread = await fetchUnreadCount();
      } catch (e) {
        // Silencioso — si no hay sesión devuelve 401, lo dejamos en 0
        if (e?.response?.status === 401) this.unread = 0;
      }
    },

    async loadFirstPage({ force = false } = {}) {
      const now = Date.now();
      if (!force && now - this.lastFetchedAt < 5_000) return;
      this.loading = true;
      this.error = null;
      try {
        const r = await fetchNotifications({ limit: 30, offset: 0 });
        this.items = Array.isArray(r?.rows) ? r.rows : [];
        this.total = Number(r?.total || 0);
        this.unread = Number(r?.unread || 0);
        this.lastFetchedAt = Date.now();
      } catch (e) {
        if (e?.response?.status === 401) {
          this.items = [];
          this.total = 0;
          this.unread = 0;
        } else {
          this.error = e?.friendlyMessage || e?.message || "No se pudieron cargar las notificaciones";
        }
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(id) {
      // Optimistic
      const item = this.items.find((x) => Number(x.id) === Number(id));
      if (item && !item.read_at) {
        item.read_at = new Date().toISOString();
        this.unread = Math.max(0, this.unread - 1);
      }
      try {
        await markNotificationRead(id);
      } catch {
        // si falla, dejamos el optimistic — el siguiente poll lo
        // resincroniza
      }
    },

    async markAllAsRead() {
      const now = new Date().toISOString();
      this.items.forEach((x) => {
        if (!x.read_at) x.read_at = now;
      });
      this.unread = 0;
      try {
        await markAllNotificationsRead();
      } catch {}
    },

    startPolling() {
      this.stopPolling();
      // primer fetch inmediato
      this.refreshUnread();
      _pollTimer = setInterval(() => {
        this.refreshUnread();
      }, POLL_INTERVAL_MS);
    },

    stopPolling() {
      if (_pollTimer) {
        clearInterval(_pollTimer);
        _pollTimer = null;
      }
    },

    reset() {
      this.items = [];
      this.total = 0;
      this.unread = 0;
      this.error = null;
      this.lastFetchedAt = 0;
    },
  },
});
