// ✅ COPY-PASTE FINAL COMPLETO
// src/app/services/admin.shopLinks.api.js
// Admin Shop Links API (requiere JWT)
// Exporta NAMED exports + default (por compatibilidad)

import axios from "axios";
import { useAuthStore } from "@/app/store/auth.store";

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeBaseURL(raw) {
  let base = String(raw || "").trim();
  if (!base) base = "/api/v1";

  base = base.replace(/\/+$/, "");
  base = base.replace(/\/api\/v1\/api\/v1$/i, "/api/v1");

  const isAbsolute = /^https?:\/\//i.test(base);
  const endsWithV1 = /\/api\/v1$/i.test(base);

  if (isAbsolute && !endsWithV1) base = `${base}/api/v1`;
  if (!isAbsolute && !endsWithV1) {
    if (base === "/") base = "";
    base = `${base}/api/v1`.replace(/\/+/, "/");
  }

  base = base.replace(/([^:]\/)\/+/g, "$1");
  return base;
}

function getBaseURL() {
  return normalizeBaseURL(import.meta.env.VITE_API_BASE_URL || "");
}

function getAccessToken() {
  // 1) store
  try {
    const auth = useAuthStore();
    const t =
      auth?.accessToken ||
      auth?.token ||
      auth?.jwt ||
      auth?.tokens?.access ||
      auth?.tokens?.accessToken ||
      "";
    if (t) return String(t);
  } catch {
    // ignore
  }

  // 2) localStorage
  const keys = ["pos360_auth", "auth", "pos360Auth", "POS360_AUTH"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const obj = safeJsonParse(raw);
    const t =
      obj?.accessToken ||
      obj?.token ||
      obj?.jwt ||
      obj?.tokens?.access ||
      obj?.tokens?.accessToken ||
      "";
    if (t) return String(t);
  }

  return "";
}

const http = axios.create({
  baseURL: getBaseURL(),
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  config.headers = config.headers || {};
  config.headers.Accept = "application/json";
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function unwrapError(e) {
  const status = e?.response?.status;
  const msg =
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    "Request error";
  const full = status ? `${status} ${msg}` : msg;
  const err = new Error(full);
  err.status = status;
  err.data = e?.response?.data;
  return err;
}

// ============================
// ✅ ENDPOINTS REALES (según tu v1.routes):
// /api/v1/admin/shop/links
// ============================

export async function adminListLinks(params = {}) {
  try {
    const { data } = await http.get("/admin/shop/links", { params });
    return data;
  } catch (e) {
    throw unwrapError(e);
  }
}

export async function adminCreateLink(payload) {
  try {
    const { data } = await http.post("/admin/shop/links", payload);
    return data;
  } catch (e) {
    throw unwrapError(e);
  }
}

export async function adminUpdateLink(id, payload) {
  try {
    const { data } = await http.patch(`/admin/shop/links/${id}`, payload);
    return data;
  } catch (e) {
    throw unwrapError(e);
  }
}

export async function adminDeleteLink(id) {
  try {
    const { data } = await http.delete(`/admin/shop/links/${id}`);
    return data;
  } catch (e) {
    throw unwrapError(e);
  }
}

// ✅ default (por si algún import viejo hacía "import api from ...")
export default {
  adminListLinks,
  adminCreateLink,
  adminUpdateLink,
  adminDeleteLink,
};
