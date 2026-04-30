// Persistencia local del comprobante con TTL.
// Sobrevive al cierre de pestaña/sesión del comprador (a diferencia de sessionStorage).
// Para compartir con terceros usar el token de URL (receiptToken.js).

const STORAGE_KEY = "shop_receipts_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const LAST_KEY = "shop_last_receipt"; // legacy compat (sessionStorage)

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("[receiptStorage] write failed (quota?)", e);
  }
}

function pruneExpired(map) {
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(map)) {
    const e = map[k];
    if (!e || typeof e !== "object" || !e.expires_at || now > e.expires_at) {
      delete map[k];
      changed = true;
    }
  }
  return changed;
}

function keyFor(orderId, code) {
  const oid = String(orderId || "").trim();
  const c = String(code || "").trim();
  if (oid && c) return `${oid}|${c}`;
  if (oid) return oid;
  if (c) return c;
  return "";
}

/**
 * Guarda un receipt en localStorage con TTL 30 días.
 * Indexado por (order_id|code). También por order_id solo, y por code solo.
 */
export function saveReceiptLocal(receipt) {
  if (!receipt) return;
  const oid = receipt.order_id;
  const code = receipt.code;
  if (!oid && !code) {
    // sin identificador, lo guardamos como "last"
    try {
      sessionStorage.setItem(LAST_KEY, JSON.stringify(receipt));
    } catch {}
    return;
  }

  const map = readMap();
  pruneExpired(map);

  const entry = { receipt, expires_at: Date.now() + TTL_MS };

  const fullKey = keyFor(oid, code);
  if (fullKey) map[fullKey] = entry;
  if (oid) map[String(oid)] = entry;
  if (code) map[String(code)] = entry;

  writeMap(map);

  // Mantener compat con sessionStorage (legacy) — por si algún flujo viejo lee de ahí
  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(receipt));
  } catch {}
}

/**
 * Busca un receipt guardado localmente. Devuelve null si no existe o expiró.
 */
export function loadReceiptLocal({ order_id, code } = {}) {
  const map = readMap();
  if (pruneExpired(map)) writeMap(map);

  const tryKeys = [keyFor(order_id, code), String(order_id || ""), String(code || "")].filter(Boolean);

  for (const k of tryKeys) {
    const e = map[k];
    if (e && e.receipt) return e.receipt;
  }

  // Legacy sessionStorage fallback
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        const matchOid = order_id && String(obj.order_id) === String(order_id);
        const matchCode = code && String(obj.code) === String(code);
        if (matchOid || matchCode || (!order_id && !code)) return obj;
      }
    }
  } catch {}

  return null;
}

/**
 * Devuelve el último receipt guardado (sin filtrar por id).
 */
export function loadLastReceipt() {
  // Primero sessionStorage (más fresco)
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") return obj;
    }
  } catch {}

  // Luego el más reciente de localStorage
  const map = readMap();
  if (pruneExpired(map)) writeMap(map);

  let latest = null;
  let latestExp = 0;
  for (const k of Object.keys(map)) {
    const e = map[k];
    if (e && e.expires_at && e.expires_at > latestExp) {
      latest = e.receipt;
      latestExp = e.expires_at;
    }
  }
  return latest;
}
