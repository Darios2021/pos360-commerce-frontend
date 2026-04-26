// src/modules/admin/services/messaging.service.js
import http from "@/app/api/http";

// Templates
export const listMessageTemplates = (channel = "") =>
  http.get("/admin/messaging/templates", { params: channel ? { channel } : {} });
export const createMessageTemplate = (data) => http.post("/admin/messaging/templates", data);
export const updateMessageTemplate = (id, data) => http.put(`/admin/messaging/templates/${id}`, data);
export const deleteMessageTemplate = (id) => http.delete(`/admin/messaging/templates/${id}`);

// Variables disponibles para los templates
export const listMessageVariables = () => http.get("/admin/messaging/variables");

// Estado de los proveedores (SMTP / WhatsApp)
export const getMessagingStatus = () => http.get("/admin/messaging/status");

// Test rápido de SMTP enviando a un correo arbitrario.
export const testSendEmail = ({ to, subject, body }) =>
  http.post("/admin/messaging/test-email", { to, subject, body });

// Preview / send
export const previewMessage = (data) => http.post("/admin/messaging/preview", data);
export const sendMessage = (data) => http.post("/admin/messaging/send", data);
export const sendMessageBulk = (data) => http.post("/admin/messaging/send-bulk", data);

// Historial
export const listMessageLogs = (params = {}) =>
  http.get("/admin/messaging/logs", { params });
export const getCustomerMessageLogs = (customerId) =>
  http.get(`/admin/messaging/logs/customer/${customerId}`);

// Vista previa del layout HTML completo (con firma + promos resueltos).
// Devuelve { html, branding } para mostrar el email armado en un iframe.
export const previewEmailLayout = (data) =>
  http.post("/admin/messaging/preview-layout", data);

// Vista previa del mensaje de WhatsApp formateado (texto plano con
// markdown WhatsApp y emojis). El frontend lo muestra en un mockup.
export const previewWhatsAppMessage = (data) =>
  http.post("/admin/messaging/preview-whatsapp", data);

