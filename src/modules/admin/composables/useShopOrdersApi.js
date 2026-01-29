// src/modules/admin/composables/useShopOrdersApi.js
// ✅ COPY-PASTE FINAL (Admin Shop Orders API - PRO + DEBUG)
// - Soporta token en: token | access_token | accessToken | jwt | auth_token
// - Soporta VITE_API_BASE_URL con o sin /api/v1
// - Evita duplicar /api/v1
// - Debug en consola (token presente? baseUrl? url final?)
// - Manejo 401 con mensaje claro

function toStr(v) {
  return String(v ?? "").trim();
}

function getToken() {
  return (
    toStr(localStorage.getItem("token")) ||
    toStr(localStorage.getItem("access_token")) ||
    toStr(localStorage.getItem("accessToken")) || // ✅ tu login devuelve accessToken
    toStr(localStorage.getItem("jwt")) ||
    toStr(localStorage.getItem("auth_token")) ||
    ""
  );
}

function normalizeBaseUrl() {
  const raw = toStr(import.meta?.env?.VITE_API_BASE_URL);
  const b = raw ? raw.replace(/\/+$/, "") : "";
  const hasV1 = /\/api\/v1$/i.test(b);
  return { base: b, hasV1 };
}

function apiUrl(path) {
  const { base, hasV1 } = normalizeBaseUrl();

  let p = toStr(path);
  if (!p.startsWith("/")) p = `/${p}`;

  // si base ya trae /api/v1, recorto si path lo trae también
  if (hasV1 && p.toLowerCase().startsWith("/api/v1/")) {
    p = p.slice("/api/v1".length);
  }

  // si base NO trae /api/v1, lo agrego si el path no lo trae
  if (!hasV1 && !p.toLowerCase().startsWith("/api/v1/")) {
    p = `/api/v1${p}`;
  }

  // si no hay base => relativo (dev proxy / mismo origin)
  return base ? `${base}${p}` : p;
}

function setQuery(urlObj, query) {
  if (!query || typeof query !== "object") return;
  Object.entries(query).forEach(([k, v]) => {
    const sv = String(v ?? "").trim();
    if (!sv || sv === "null" || sv === "undefined") return;
    urlObj.searchParams.set(k, sv);
  });
}

async function http(method, path, { json, formData, query } = {}) {
  const token = getToken();
  const finalUrl = apiUrl(path);
  const urlObj = new URL(finalUrl, window.location.origin);
  setQuery(urlObj, query);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // ✅ DEBUG (te deja ver si falta token)
  console.log("[ADMIN SHOP ORDERS API]", {
    method,
    path,
    final: urlObj.toString(),
    hasToken: !!token,
    base: normalizeBaseUrl(),
  });

  let body;
  if (formData) {
    body = formData;
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const r = await fetch(urlObj.toString(), { method, headers, body });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!r.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.detail || data.code)) ||
      (typeof data === "string" && data) ||
      `HTTP ${r.status}`;

    const err = new Error(msg);
    err.status = r.status;
    err.payload = data;
    throw err;
  }

  return data;
}

function normalizeOrderRow(r) {
  return {
    ...r,
    customer_name: r.customer_name ?? null,
    customer_email: r.customer_email ?? null,
    items_count: Number(r.items_count ?? 0),
    items_qty: Number(r.items_qty ?? 0),
    total: Number(r.total ?? 0),
  };
}

export function useShopOrdersApi(state) {
  const { loading, error, snack, rows, meta, branches, detail } = state;

  function setSnack(text) {
    if (!snack?.value) return;
    snack.value = { show: true, text: String(text || "") };
  }

  function set401(where = "") {
    error.value = `No autorizado (401). Iniciá sesión en el Admin y recargá. ${where ? `(${where})` : ""}`.trim();
  }

  async function fetchOrders(filters = {}) {
    loading.value = true;
    error.value = "";

    try {
      const q = {
        page: meta.value?.page || 1,
        limit: meta.value?.limit || 20,
        q: filters.q || "",
        status: filters.status || "",
        fulfillment_type: filters.fulfillment_type || "",
        branch_id: filters.branch_id || "",
        from: filters.from || "",
        to: filters.to || "",
      };

      // ✅ llamamos “corto” (el helper mete /api/v1 si hace falta)
      const out = await http("GET", "/admin/shop/orders", { query: q });

      rows.value = Array.isArray(out?.data) ? out.data.map(normalizeOrderRow) : [];
      meta.value = out?.meta
        ? { ...meta.value, ...out.meta }
        : { ...meta.value, total: rows.value.length, pages: 1 };
    } catch (e) {
      if (e?.status === 401) set401("orders");
      else error.value = e?.message || "No se pudo cargar pedidos.";
      rows.value = [];
      meta.value = { ...meta.value, total: 0, pages: 1 };
    } finally {
      loading.value = false;
    }
  }

  async function openDetail(orderId) {
    detail.value.open = true;
    detail.value.loading = true;
    detail.value.error = "";
    detail.value.data = null;

    try {
      const out = await http("GET", `/admin/shop/orders/${Number(orderId)}`);
      detail.value.data = {
        order: out?.order || null,
        items: Array.isArray(out?.items) ? out.items : [],
        payments: Array.isArray(out?.payments) ? out.payments : [],
      };
    } catch (e) {
      if (e?.status === 401) detail.value.error = "No autorizado (401).";
      else detail.value.error = e?.message || "No se pudo cargar el detalle.";
    } finally {
      detail.value.loading = false;
    }
  }

  async function loadBranches() {
    try {
      const tryUrls = ["/admin/shop/branches", "/branches"];
      let out = null;

      for (const u of tryUrls) {
        try {
          out = await http("GET", u);
          break;
        } catch (e) {
          // si 401 acá, no frenamos la pantalla
        }
      }

      const data = out?.data || out?.branches || out || [];
      branches.value = Array.isArray(data) ? data : [];
    } catch {
      branches.value = [];
    }
  }

  async function tryPost(urls, payload) {
    let lastErr = null;
    for (const u of urls) {
      try {
        return await http("POST", u, { json: payload });
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("No se pudo ejecutar acción.");
  }

  async function createMpLink(paymentId) {
    const id = Number(paymentId);
    if (!id) throw new Error("paymentId inválido");

    const urls = [
      `/admin/shop/payments/${id}/mp/link`,
      `/admin/shop/payments/${id}/mercadopago/link`,
      `/admin/shop/payments/${id}/mp/create-link`,
    ];

    const out = await tryPost(urls, {});
    setSnack("Link de MercadoPago generado.");
    if (detail.value?.data?.order?.id) await openDetail(detail.value.data.order.id);
    return out;
  }

  async function uploadTransferProof(paymentId, file, bank_reference = "") {
    const id = Number(paymentId);
    if (!id) throw new Error("paymentId inválido");
    if (!file) throw new Error("Falta archivo");

    const fd = new FormData();
    fd.append("file", file);
    if (toStr(bank_reference)) fd.append("bank_reference", toStr(bank_reference));

    const urls = [
      `/admin/shop/payments/${id}/transfer/proof`,
      `/ecom/payments/${id}/transfer/proof`,
    ];

    let lastErr = null;
    for (const u of urls) {
      try {
        const out = await http("POST", u, { formData: fd });
        setSnack("Comprobante subido.");
        if (detail.value?.data?.order?.id) await openDetail(detail.value.data.order.id);
        return out;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("No se pudo subir comprobante.");
  }

  async function reviewTransfer(paymentId, action, note = "") {
    const id = Number(paymentId);
    const a = toStr(action).toLowerCase();
    if (!id) throw new Error("paymentId inválido");
    if (a !== "approve" && a !== "reject") throw new Error("Acción inválida");

    const urls = [
      `/admin/shop/payments/${id}/transfer/review`,
      `/admin/shop/payments/${id}/review-transfer`,
    ];

    const out = await tryPost(urls, { action: a, note: toStr(note) });
    setSnack(a === "approve" ? "Transferencia aprobada." : "Transferencia rechazada.");
    if (detail.value?.data?.order?.id) await openDetail(detail.value.data.order.id);
    return out;
  }

  return {
    fetchOrders,
    openDetail,
    loadBranches,
    createMpLink,
    uploadTransferProof,
    reviewTransfer,
  };
}
