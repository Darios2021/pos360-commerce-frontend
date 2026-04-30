// Token base64url para serializar el comprobante en la URL.
// Permite compartir el link y que cualquiera lo abra (sin sessionStorage del comprador).
//
// Formato: base64url(JSON.stringify(receipt))
// La URL queda ~1-3KB. Para receipts más grandes podríamos comprimir con LZ-String,
// por ahora es suficiente para órdenes típicas.

function utf8ToBase64(s) {
  // unescape() está deprecated en algunos contextos; usamos TextEncoder cuando se puede
  if (typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return btoa(unescape(encodeURIComponent(s)));
}

function base64ToUtf8(b64) {
  if (typeof TextDecoder !== "undefined") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return decodeURIComponent(escape(atob(b64)));
}

function toBase64Url(b64) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64u) {
  let s = String(b64u || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return s;
}

/**
 * Codifica un objeto receipt a un string token base64url (URL-safe).
 * @param {object} receipt
 * @returns {string} token
 */
export function encodeReceiptToken(receipt) {
  if (!receipt) return "";
  try {
    const json = JSON.stringify(receipt);
    return toBase64Url(utf8ToBase64(json));
  } catch (e) {
    console.warn("[receiptToken] encode failed", e);
    return "";
  }
}

/**
 * Decodifica un token base64url a un objeto receipt.
 * @param {string} token
 * @returns {object|null}
 */
export function decodeReceiptToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  try {
    const json = base64ToUtf8(fromBase64Url(t));
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object") return obj;
    return null;
  } catch (e) {
    console.warn("[receiptToken] decode failed", e);
    return null;
  }
}
