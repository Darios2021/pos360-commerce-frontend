// src/modules/pos/services/posCashRegisters.service.js
// ✅ COPY-PASTE FINAL COMPLETO
// Service backend caja POS
// Soporta:
// - VITE_API_BASE_URL=/api/v1
// - VITE_DEV_API_TARGET=https://pos360-commerce-api.cingulado.org
// - cookies + Bearer token
// - endpoints reales bajo /api/v1/pos/cash-registers/*

const ENV =
  typeof import.meta !== "undefined" && import.meta?.env
    ? import.meta.env
    : {};

const API_BASE_PATH = String(ENV.VITE_API_BASE_URL || "/api/v1").trim();
const DEV_API_TARGET = String(ENV.VITE_DEV_API_TARGET || "").trim();
const LEGACY_API_URL = String(ENV.VITE_API_URL || "").trim();
const IS_DEV = Boolean(ENV.DEV);

function stripSlashes(value = "") {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function ensureLeadingSlash(value = "") {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function joinUrlParts(...parts) {
  const cleaned = parts
    .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
    .map((part, index) => {
      const str = String(part).trim();
      if (index === 0 && /^https?:\/\//i.test(str)) {
        return str.replace(/\/+$/, "");
      }
      return stripSlashes(str);
    })
    .filter(Boolean);

  if (!cleaned.length) return "";

  const first = cleaned[0];
  if (/^https?:\/\//i.test(first)) {
    return cleaned.length === 1 ? first : `${first}/${cleaned.slice(1).join("/")}`;
  }

  return `/${cleaned.join("/")}`;
}

function getApiOrigin() {
  if (LEGACY_API_URL) return LEGACY_API_URL.replace(/\/+$/, "");
  if (IS_DEV && DEV_API_TARGET) return DEV_API_TARGET.replace(/\/+$/, "");
  return "";
}

function buildApiUrl(endpointPath = "") {
  const origin = getApiOrigin();
  const basePath = ensureLeadingSlash(API_BASE_PATH);
  const endpoint = ensureLeadingSlash(endpointPath);

  if (origin) {
    if (endpoint.startsWith(basePath + "/") || endpoint === basePath) {
      return `${origin}${endpoint}`;
    }
    return `${origin}${joinUrlParts(basePath, endpoint)}`;
  }

  if (endpoint.startsWith(basePath + "/") || endpoint === basePath) {
    return endpoint;
  }

  return joinUrlParts(basePath, endpoint);
}

function tryGetBearerToken() {
  try {
    const candidates = [
      localStorage.getItem("token"),
      localStorage.getItem("authToken"),
      localStorage.getItem("access_token"),
      localStorage.getItem("accessToken"),
      sessionStorage.getItem("token"),
      sessionStorage.getItem("authToken"),
      sessionStorage.getItem("access_token"),
      sessionStorage.getItem("accessToken"),
    ].filter(Boolean);

    return candidates[0] || "";
  } catch {
    return "";
  }
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await res.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

async function request(endpointPath, options = {}) {
  const url = buildApiUrl(endpointPath);
  const token = tryGetBearerToken();

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    const err = new Error(
      data?.message ||
        data?.error ||
        `Error HTTP ${res.status} en ${options.method || "GET"} ${url}`
    );
    err.status = res.status;
    err.code = data?.code || "HTTP_ERROR";
    err.data = data?.data || null;
    err.raw = data;
    err.url = url;
    throw err;
  }

  return data;
}

// ✅ IMPORTANTE: los endpoints reales van bajo /pos/cash-registers
const CASH_REGISTERS_BASE = "/pos/cash-registers";

export async function getCurrentCashRegister() {
  return request(`${CASH_REGISTERS_BASE}/current`, {
    method: "GET",
  });
}

export async function openCashRegister(payload) {
  return request(`${CASH_REGISTERS_BASE}/open`, {
    method: "POST",
    body: payload,
  });
}

export async function getCashRegisterSummary(id) {
  if (!id) {
    throw new Error("getCashRegisterSummary requiere un id de caja");
  }

  return request(`${CASH_REGISTERS_BASE}/${id}/summary`, {
    method: "GET",
  });
}

export async function createCashRegisterMovement(id, payload) {
  if (!id) {
    throw new Error("createCashRegisterMovement requiere un id de caja");
  }

  return request(`${CASH_REGISTERS_BASE}/${id}/movements`, {
    method: "POST",
    body: payload,
  });
}

export async function closeCashRegister(id, payload) {
  if (!id) {
    throw new Error("closeCashRegister requiere un id de caja");
  }

  return request(`${CASH_REGISTERS_BASE}/${id}/close`, {
    method: "POST",
    body: payload,
  });
}

// Listado admin de cajas con filtros y paginación.
export async function adminListCashRegisters(filters = {}) {
  const params = new URLSearchParams();
  const add = (k, v) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      params.append(k, String(v));
    }
  };
  add("status", filters.status);
  add("branch_id", filters.branch_id);
  add("user_id", filters.user_id);
  add("date_from", filters.date_from);
  add("date_to", filters.date_to);
  add("q", filters.q);
  if (filters.alerts_only) add("alerts_only", "1");
  if (filters.overtime_only) add("overtime_only", "1");
  if (filters.shortage_only) add("shortage_only", "1");
  add("page", filters.page || 1);
  add("limit", filters.limit || 25);

  const qs = params.toString();
  return request(`${CASH_REGISTERS_BASE}/admin/list${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

const posCashRegistersService = {
  getCurrentCashRegister,
  openCashRegister,
  getCashRegisterSummary,
  createCashRegisterMovement,
  closeCashRegister,
  adminListCashRegisters,
};

export default posCashRegistersService;