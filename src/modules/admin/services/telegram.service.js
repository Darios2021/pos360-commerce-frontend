// src/modules/admin/services/telegram.service.js
import http from "@/app/api/http";

const BASE = "/admin/telegram";

export async function getTelegramConfig() {
  const { data } = await http.get(`${BASE}/config`);
  return data;
}

export async function updateTelegramConfig(patch) {
  const { data } = await http.put(`${BASE}/config`, patch);
  return data;
}

export async function testTelegramSend(text) {
  const { data } = await http.post(`${BASE}/test-send`, { text: text || "" });
  return data;
}

export async function pingTelegramBot() {
  const { data } = await http.get(`${BASE}/ping`);
  return data;
}

export async function listTelegramLogs({ limit = 100, offset = 0, alert_code = "" } = {}) {
  const { data } = await http.get(`${BASE}/logs`, {
    params: { limit, offset, alert_code },
  });
  return data;
}

export async function runScansNow() {
  const { data } = await http.post(`${BASE}/run-scans-now`);
  return data;
}

export async function scanLowStock(limit = 30) {
  const { data } = await http.post(`${BASE}/scan-low-stock`, { limit });
  return data;
}

export default {
  getTelegramConfig,
  updateTelegramConfig,
  testTelegramSend,
  pingTelegramBot,
  listTelegramLogs,
};
