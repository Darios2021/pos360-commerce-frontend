// src/modules/pos/composables/usePosProductActions.js
import { ref, computed } from "vue";

export function usePosProductActions({
  posStore,
  canSell,
  needsBranchPick,
  globalItems,
  productImage,
  toast,
}) {
  const detailsOpen = ref(false);
  const detailsItem = ref(null);

  function openDetails(product) {
    detailsItem.value = product || null;
    detailsOpen.value = true;
  }

  function normalizeId(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function normalizeText(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function getProductId(it) {
    return (
      normalizeId(it?.product_id) ||
      normalizeId(it?.productId) ||
      normalizeId(it?.product?.id) ||
      normalizeId(it?.id)
    );
  }

  function getProductSku(it) {
    return (
      String(
        it?.sku ??
          it?.code ??
          it?.product?.sku ??
          it?.product?.code ??
          ""
      ).trim() || ""
    );
  }

  function cartKey(it) {
    return {
      pid: getProductId(it),
      sku: getProductSku(it),
    };
  }

  function findProductInPool(it) {
    const { pid, sku } = cartKey(it);
    const pool = Array.isArray(globalItems?.value) ? globalItems.value : [];

    if (pid) {
      const foundById = pool.find((p) => {
        const pId =
          normalizeId(p?.id) ||
          normalizeId(p?.product_id) ||
          normalizeId(p?.product?.id);
        return pId === pid;
      });
      if (foundById) return foundById;
    }

    if (sku) {
      const skuNorm = normalizeText(sku);
      const foundBySku = pool.find((p) => {
        const pSku = normalizeText(p?.sku ?? p?.code ?? p?.product?.sku ?? p?.product?.code ?? "");
        return pSku && pSku === skuNorm;
      });
      if (foundBySku) return foundBySku;
    }

    return null;
  }

  const cartForCheckout = computed(() => {
    const cart = Array.isArray(posStore?.cart) ? posStore.cart : [];

    return cart.map((it) => {
      const currentImage = String(
        it?.image ??
          it?.image_url ??
          it?.imageUrl ??
          it?.thumb ??
          it?.thumbnail ??
          it?.product?.image ??
          it?.product?.image_url ??
          ""
      ).trim();

      if (currentImage) return it;

      const source = findProductInPool(it);
      if (!source) return it;

      const img = typeof productImage === "function" ? productImage(source) : "";
      if (!img) return it;

      return {
        ...it,
        image: img,
        image_url: img,
        imageUrl: img,
        thumb: img,
        thumbnail: img,
        product: it?.product
          ? {
              ...it.product,
              image: img,
              image_url: img,
              imageUrl: img,
            }
          : it?.product,
      };
    });
  });

  function tryStoreMethod(methodNames, ...args) {
    for (const name of methodNames) {
      try {
        if (typeof posStore?.[name] === "function") {
          posStore[name](...args);
          return true;
        }
      } catch (error) {
        console.warn(`[POS] falló el método ${name}`, error);
      }
    }
    return false;
  }

  function patchCartFallback(product, qty = 1) {
    try {
      const currentCart = Array.isArray(posStore?.cart) ? [...posStore.cart] : [];
      const pid = getProductId(product);
      const sku = normalizeText(getProductSku(product));

      const index = currentCart.findIndex((row) => {
        const rowPid = getProductId(row);
        const rowSku = normalizeText(getProductSku(row));
        return (pid && rowPid === pid) || (sku && rowSku === sku);
      });

      if (index >= 0) {
        const currentQty = Number(currentCart[index]?.qty ?? currentCart[index]?.quantity ?? 1) || 1;
        currentCart[index] = {
          ...currentCart[index],
          qty: currentQty + qty,
          quantity: currentQty + qty,
        };
      } else {
        const img = typeof productImage === "function" ? productImage(product) : "";

        currentCart.push({
          ...product,
          product_id: getProductId(product),
          qty,
          quantity: qty,
          image: img || product?.image || product?.image_url || "",
          image_url: img || product?.image_url || product?.image || "",
        });
      }

      if (typeof posStore?.$patch === "function") {
        posStore.$patch({ cart: currentCart });
        return true;
      }

      posStore.cart = currentCart;
      return true;
    } catch (error) {
      console.warn("[POS] fallback patchCart falló", error);
      return false;
    }
  }

  function addToCartSafe(product, qty = 1) {
    if (!product) return false;

    const ok = tryStoreMethod(
      ["addToCart", "add", "addItem", "addProduct", "cartAdd", "pushToCart"],
      product,
      qty
    );

    if (ok) return true;

    return patchCartFallback(product, qty);
  }

  function enrichProductWithImage(product) {
    if (!product) return product;

    const existingImg = String(
      product?.image || product?.image_url || product?.imageUrl || ""
    ).trim();
    if (existingImg) return product;

    const img = typeof productImage === "function" ? productImage(product) : "";
    if (!img) return product;

    return {
      ...product,
      image: img,
      image_url: img,
      imageUrl: img,
    };
  }

  function add(product) {
    if (!product) return;

    if (!canSell?.value) {
      toast?.("⛔ No tenés permiso para vender.");
      return;
    }

    if (needsBranchPick?.value) {
      toast?.("🏬 Elegí una sucursal antes de agregar productos.");
      return;
    }

    // Backend /pos/products no devuelve imagen; la resolvemos en el frontend
    // vía productImage() y la inyectamos antes de guardar en el carrito.
    const enriched = enrichProductWithImage(product);

    const ok = addToCartSafe(enriched, 1);

    if (!ok) {
      toast?.("⚠️ No se pudo agregar el producto al carrito.");
      console.warn("[POS] no se encontró método válido para agregar al carrito", posStore);
    }
  }

  function buildPricedProduct(product, meta = {}) {
    const unitPrice = Number(meta.unit_price ?? meta.unitPrice ?? 0) || 0;
    const installments = Number(meta.installments ?? 1) || 1;
    const applyReseller = Boolean(meta.applyReseller);
    const paymentMethod = meta.paymentMethod ?? meta.payment_method ?? null;
    const pricePolicy = meta.price_policy ?? meta.pricePolicy ?? null;
    const priceLabel = meta.price_label ?? meta.priceLabel ?? null;

    const img = typeof productImage === "function" ? productImage(product) : "";

    return {
      ...product,
      product_id: getProductId(product),
      unit_price: unitPrice,
      unitPrice: unitPrice,
      installments,
      paymentMethod,
      payment_method: paymentMethod,
      applyReseller,
      price_policy: pricePolicy,
      pricePolicy,
      price_label: priceLabel,
      priceLabel,
      image: img || product?.image || product?.image_url || "",
      image_url: img || product?.image_url || product?.image || "",
      __pos_pricing: {
        ...meta,
        unit_price: unitPrice,
        installments,
        applyReseller,
        paymentMethod,
        price_policy: pricePolicy,
        price_label: priceLabel,
      },
    };
  }

  function addFromDetails(payload = {}) {
    const product = detailsItem.value;
    if (!product) {
      toast?.("⚠️ No hay producto seleccionado.");
      return;
    }

    if (!canSell?.value) {
      toast?.("⛔ No tenés permiso para vender.");
      return;
    }

    if (needsBranchPick?.value) {
      toast?.("🏬 Elegí una sucursal antes de agregar productos.");
      return;
    }

    const unitPrice = Number(payload?.unit_price ?? payload?.unitPrice ?? 0) || 0;
    if (unitPrice <= 0) {
      toast?.("⚠️ Producto sin precio válido.");
      return;
    }

    const okPriced = tryStoreMethod(
      ["addToCartWithPrice", "addWithPrice", "addPriced", "addFromDetails"],
      product,
      unitPrice,
      payload
    );

    if (okPriced) {
      toast?.("✅ Agregado al carrito");
      detailsOpen.value = false;
      return;
    }

    const pricedProduct = buildPricedProduct(product, payload);
    const okFallback = addToCartSafe(pricedProduct, 1);

    if (!okFallback) {
      toast?.("⚠️ No se pudo agregar el producto al carrito.");
      console.warn("[POS] no se encontró método válido para agregar al carrito con precio", posStore);
      return;
    }

    toast?.("✅ Agregado al carrito");
    detailsOpen.value = false;
  }

  return {
    detailsOpen,
    detailsItem,
    cartForCheckout,
    openDetails,
    add,
    addFromDetails,
    addToCartSafe,
    findProductInPool,
  };
}