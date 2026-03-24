export function usePosPageActions({
  posStore,
  canSell,
  needsBranchPick,
  toast,
  detailsItem,
  closeDetails,
}) {
  function addToCartSafe(product, qty = 1) {
    if (!product) return false;

    const candidates = [
      ["addToCart", (s) => s.addToCart(product, qty)],
      ["add", (s) => s.add(product, qty)],
      ["addItem", (s) => s.addItem(product, qty)],
      ["addProduct", (s) => s.addProduct(product, qty)],
    ];

    for (const [name, fn] of candidates) {
      try {
        if (typeof posStore?.[name] === "function") {
          fn(posStore);
          return true;
        }
      } catch {}
    }

    return false;
  }

  function add(product) {
    if (!product) return;

    if (!canSell?.value) {
      toast("⛔ Sin permisos");
      return;
    }

    if (needsBranchPick?.value) {
      toast("🏬 Elegí sucursal");
      return;
    }

    const ok = addToCartSafe(product, 1);

    if (!ok) {
      toast("⚠️ Error agregando al carrito");
    }
  }

  function addFromDetails(payload) {
    const product = detailsItem.value;
    if (!product) return;

    const unitPrice = Number(payload?.unit_price || 0);

    if (unitPrice <= 0) {
      toast("⚠️ Precio inválido");
      return;
    }

    const cloned = {
      ...product,
      unit_price: unitPrice,
      __pos_pricing: payload,
    };

    addToCartSafe(cloned, 1);

    toast("✅ Agregado");
    closeDetails();
  }

  return {
    add,
    addFromDetails,
  };
}