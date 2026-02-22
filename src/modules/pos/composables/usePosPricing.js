// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosPricing.js
//
// Objetivo:
// - Unificar cálculo de precios POS (LIST / DISCOUNT / RESELLER / EFFECTIVE)
// - isSellable() NO debe ser ultra estricto y dejar 14 productos “vendibles”
// - Tolerar números como string, con $ . , espacios, etc.
// - Fallbacks realistas según tus columnas reales en DB
//
// Reglas:
// - LIST: price_list | list_price | priceList | prices?.list
// - DISCOUNT: price_discount | discount_price | priceDiscount | prices?.discount
// - RESELLER: price_reseller | reseller_price | priceReseller | prices?.reseller
// - EFFECTIVE: effective_price | final_price | price | unit_price | prices?.effective
//
// Nota:
// - "Vendible" = tiene ALGÚN precio > 0 (idealmente DISCOUNT o LIST)
// - En UI POS, podés seguir mostrando “Con stock (incluye sin precio)” por separado.

import { computed } from "vue";

function toNum(v, def = 0) {
  if (v === null || v === undefined) return def;
  if (typeof v === "number") return Number.isFinite(v) ? v : def;

  // strings tipo "$ 12.345,67" o "12345.67"
  let s = String(v).trim();
  if (!s) return def;

  // sacar símbolos y espacios raros
  s = s.replace(/\s+/g, "");
  s = s.replace(/\$/g, "");

  // si tiene coma y punto, asumimos separador miles + decimal
  // "12.345,67" -> "12345.67"
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",") && !s.includes(".")) {
    // "12345,67" -> "12345.67"
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : def;
}

function pickFirstPositive(...vals) {
  for (const v of vals) {
    const n = toNum(v, 0);
    if (n > 0) return n;
  }
  return 0;
}

function readPrice(p, key) {
  if (!p) return 0;

  // soporte por si viene un objeto "prices"
  const prices = p.prices || p.price || p.pricing || null;

  if (key === "LIST") {
    return pickFirstPositive(
      p.price_list,
      p.list_price,
      p.priceList,
      prices?.list,
      prices?.price_list
    );
  }

  if (key === "DISCOUNT") {
    return pickFirstPositive(
      p.price_discount,
      p.discount_price,
      p.priceDiscount,
      prices?.discount,
      prices?.price_discount
    );
  }

  if (key === "RESELLER") {
    return pickFirstPositive(
      p.price_reseller,
      p.reseller_price,
      p.priceReseller,
      prices?.reseller,
      prices?.price_reseller
    );
  }

  if (key === "EFFECTIVE") {
    return pickFirstPositive(
      p.effective_price,
      p.final_price,
      p.price,
      p.unit_price,
      prices?.effective,
      prices?.effective_price
    );
  }

  // default
  return 0;
}

function resolveUnitPrice(p, policy = "DISCOUNT") {
  const pol = String(policy || "DISCOUNT").toUpperCase();

  // política explícita
  if (pol === "LIST") return readPrice(p, "LIST");
  if (pol === "DISCOUNT") {
    // descuento si existe, sino list, sino effective
    return pickFirstPositive(readPrice(p, "DISCOUNT"), readPrice(p, "LIST"), readPrice(p, "EFFECTIVE"));
  }
  if (pol === "RESELLER") {
    return pickFirstPositive(readPrice(p, "RESELLER"), readPrice(p, "DISCOUNT"), readPrice(p, "LIST"), readPrice(p, "EFFECTIVE"));
  }
  if (pol === "EFFECTIVE") {
    return pickFirstPositive(readPrice(p, "EFFECTIVE"), readPrice(p, "DISCOUNT"), readPrice(p, "LIST"), readPrice(p, "RESELLER"));
  }

  // fallback seguro
  return pickFirstPositive(readPrice(p, "DISCOUNT"), readPrice(p, "LIST"), readPrice(p, "EFFECTIVE"), readPrice(p, "RESELLER"));
}

function isSellable(p) {
  // Vendible si tiene AL MENOS un precio > 0 (en cualquiera de tus columnas)
  const hasAny =
    pickFirstPositive(
      readPrice(p, "DISCOUNT"),
      readPrice(p, "LIST"),
      readPrice(p, "EFFECTIVE"),
      readPrice(p, "RESELLER")
    ) > 0;

  return !!hasAny;
}

export function usePosPricing() {
  return {
    toNum,
    resolveUnitPrice,
    isSellable,
  };
}