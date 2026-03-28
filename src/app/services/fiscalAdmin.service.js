// src/app/services/fiscalAdmin.service.js
// ✅ COPY-PASTE FINAL COMPLETO
// Servicio frontend para Fiscal Admin
// - Usa /api/v1/admin/fiscal/*
// - Envía branch_id por query/body
// - Envía x-branch-id por header
// - Compatible con src/app/api/http.js

import http from "../api/http";

function toBranchId(branchId) {
  const n = Number(branchId);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function withBranchHeaders(branchId) {
  const id = toBranchId(branchId);
  return id
    ? {
        headers: {
          "x-branch-id": String(id),
        },
      }
    : {};
}

function withBranchQuery(branchId, extra = {}) {
  const id = toBranchId(branchId);
  return {
    params: {
      ...(extra?.params || {}),
      ...(id ? { branch_id: id } : {}),
    },
    headers: {
      ...(extra?.headers || {}),
      ...(id ? { "x-branch-id": String(id) } : {}),
    },
  };
}

function unwrapItem(resp) {
  return resp?.data?.item ?? null;
}

function unwrapItems(resp) {
  return resp?.data?.items ?? [];
}

function unwrapMessage(resp, fallback = "Operación realizada correctamente.") {
  return resp?.data?.message || fallback;
}

const fiscalAdminService = {
  async getConfig(branchId) {
    const id = toBranchId(branchId);
    const resp = await http.get("/admin/fiscal/config", withBranchQuery(id));
    return unwrapItem(resp);
  },

  async putConfig(payload) {
    const id = toBranchId(payload?.branch_id);
    const body = {
      branch_id: id,
      enabled: !!payload?.enabled,
      environment: payload?.environment || "testing",
      cuit: String(payload?.cuit || "").trim(),
      razon_social: String(payload?.razon_social || "").trim(),
      punto_venta: Number(payload?.punto_venta || 0),
      condicion_iva: payload?.condicion_iva || "RESPONSABLE_INSCRIPTO",
      default_invoice_type: payload?.default_invoice_type || "B",
      wsaa_url: String(payload?.wsaa_url || "").trim(),
      wsfe_url: String(payload?.wsfe_url || "").trim(),
      cert_active_id: payload?.cert_active_id ? Number(payload.cert_active_id) : null,
      notes: String(payload?.notes || "").trim(),
    };

    const resp = await http.put("/admin/fiscal/config", body, withBranchHeaders(id));
    return unwrapItem(resp);
  },

  async listCertificates(branchId) {
    const id = toBranchId(branchId);
    const resp = await http.get("/admin/fiscal/certificates", withBranchQuery(id));
    return unwrapItems(resp);
  },

  async upsertCertificate(payload) {
    const id = toBranchId(payload?.branch_id);
    const body = {
      branch_id: id,
      alias: String(payload?.alias || "").trim(),
      cert_path: String(payload?.cert_path || "").trim(),
      key_path: String(payload?.key_path || "").trim(),
      passphrase: String(payload?.passphrase || "").trim(),
      active: !!payload?.active,
      expires_at: payload?.expires_at || null,
    };

    const resp = await http.post("/admin/fiscal/certificates", body, withBranchHeaders(id));
    return unwrapItem(resp);
  },

  async testConnection(branchId) {
    const id = toBranchId(branchId);
    const body = { branch_id: id };
    const resp = await http.post(
      `/admin/fiscal/test-connection`,
      body,
      withBranchQuery(id)
    );

    return {
      ok: !!resp?.data?.ok,
      message: unwrapMessage(resp, "Prueba ejecutada correctamente."),
      item: resp?.data?.item ?? null,
    };
  },
};

export default fiscalAdminService;