import { defineStore } from "pinia";
import http from "../api/http";

export const usePosStore = defineStore("pos", {
  state: () => ({
    cart: [],
    customer: { name: "Consumidor Final", doc: "" },
    loading: false,
    error: null,
  }),

  getters: {
    totalAmount: (state) => {
      return state.cart.reduce((acc, item) => {
        const p = parseFloat(item.price) || 0;
        const q = parseFloat(item.qty) || 0;
        return acc + p * q;
      }, 0);
    },
    totalItems: (state) => {
      return state.cart.reduce((acc, item) => acc + (parseFloat(item.qty) || 0), 0);
    },
  },

  actions: {
    addToCart(product) {
      // Precio final robusto
      let finalPrice = parseFloat(product.price_list);
      if (!finalPrice || finalPrice === 0) finalPrice = parseFloat(product.price);
      if (!finalPrice || finalPrice <= 0) {
        console.warn(`⛔ [POS] Producto "${product.name}" ignorado por precio $0`);
        return;
      }

      const existing = this.cart.find((p) => p.id === product.id);

      if (existing) {
        existing.qty++;
        existing.subtotal = finalPrice * existing.qty;
        // si llega image nueva, la actualizamos
        if (product.image) existing.image = product.image;
      } else {
        this.cart.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: finalPrice,
          qty: 1,
          subtotal: finalPrice,
          image: product.image || null, // ✅
        });
      }
    },

    decreaseQty(productId) {
      const idx = this.cart.findIndex((p) => p.id === productId);
      if (idx === -1) return;

      const item = this.cart[idx];
      if (item.qty > 1) {
        item.qty--;
        item.subtotal = item.price * item.qty;
      } else {
        this.cart.splice(idx, 1);
      }
    },

    clearCart() {
      this.cart = [];
      this.customer = { name: "Consumidor Final", doc: "" };
    },

    async checkout(paymentMethod) {
      this.loading = true;
      this.error = null;

      try {
        const payload = {
          branch_id: 1,
          customer_name: this.customer.name,
          items: this.cart.map((i) => ({
            product_id: i.id,
            quantity: Number(i.qty),
            unit_price: Number(i.price),
            product_name_snapshot: i.name,
          })),
          payments: [
            {
              method: paymentMethod,
              amount: this.totalAmount,
            },
          ],
        };

        const { data } = await http.post("/pos/sales", payload);
        if (!data?.ok) throw new Error(data?.message || "Error al procesar");

        this.clearCart();
        return data;
      } catch (e) {
        console.error("Error Checkout:", e);
        this.error = e?.message || "Error";
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
