// src/modules/shop/composables/useCheckoutState.js
// ✅ COPY-PASTE FINAL
//
// Persiste el checkout en sessionStorage para:
// - si MP vuelve a /shop/checkout, retomar donde estabas
// - si el user refresca, no perder todo
//
// TTL: por defecto 45 min.

const KEY = "pos360_shop_checkout_state_v1";

export function useCheckoutState(options = {}) {
  const ttlMs = Number(options.ttlMs || 45 * 60 * 1000);

  function now() {
    return Date.now();
  }

  function save(state) {
    try {
      const payload = {
        saved_at: now(),
        expires_at: now() + ttlMs,
        state: state || null,
      };
      sessionStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const exp = Number(parsed?.expires_at || 0);
      if (!exp || exp < now()) {
        sessionStorage.removeItem(KEY);
        return null;
      }
      return parsed?.state || null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  }

  return { save, load, clear };
}
