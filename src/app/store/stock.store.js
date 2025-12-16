// src/app/store/stock.store.js
import { defineStore } from "pinia";
import { StockService } from "../services/stock.service";

export const useStockStore = defineStore("stock", {
  state: () => ({
    warehouse_id: null,
    q: "",
    items: [],
    movements: [],
    loadingStock: false,
    loadingMovements: false,
    error: null,
  }),

  actions: {
    async fetchStock({ warehouse_id = this.warehouse_id, q = this.q } = {}) {
      if (!warehouse_id) return;
      this.loadingStock = true;
      this.error = null;
      try {
        const data = await StockService.getStock({ warehouse_id, q });
        this.warehouse_id = data.warehouse_id;
        this.items = data.items || [];
        this.q = q || "";
      } catch (e) {
        this.error = e.friendlyMessage || e.message;
      } finally {
        this.loadingStock = false;
      }
    },

    async fetchMovements({ warehouse_id = this.warehouse_id } = {}) {
      if (!warehouse_id) return;
      this.loadingMovements = true;
      this.error = null;
      try {
        const data = await StockService.listMovements({ warehouse_id });
        this.movements = data.items || [];
      } catch (e) {
        this.error = e.friendlyMessage || e.message;
      } finally {
        this.loadingMovements = false;
      }
    },

    async createMovement(payload) {
      this.error = null;
      try {
        const data = await StockService.createMovement(payload);
        // refresh
        const wh = payload.warehouse_id || payload.from_warehouse_id || this.warehouse_id;
        await this.fetchStock({ warehouse_id: wh, q: this.q });
        await this.fetchMovements({ warehouse_id: wh });
        return data.movement;
      } catch (e) {
        // backend: INSUFFICIENT_STOCK details
        const d = e?.response?.data;
        if (d?.code === "INSUFFICIENT_STOCK") {
          const det = d.details || {};
          this.error = `Stock insuficiente (warehouse:${det.warehouse_id}, product:${det.product_id}). Actual: ${det.current}, Necesita: ${det.needed}`;
          return null;
        }
        this.error = e.friendlyMessage || e.message;
        return null;
      }
    },
  },
});
