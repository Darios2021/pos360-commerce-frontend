// src/modules/shop/service/notifications.api.js
//
// Cliente para /api/v1/public/notifications/*

import httpPublic from "@/app/api/httpPublic";

export async function fetchNotifications({ limit = 30, offset = 0, only_unread = false, type = null } = {}) {
  const params = { limit, offset };
  if (only_unread) params.only_unread = 1;
  if (type) params.type = type;
  const r = await httpPublic.get("/public/notifications", { params });
  return r.data;
}

export async function fetchUnreadCount() {
  const r = await httpPublic.get("/public/notifications/unread-count");
  return Number(r?.data?.count || 0);
}

export async function markNotificationRead(id) {
  const r = await httpPublic.post(`/public/notifications/${Number(id)}/read`);
  return r.data;
}

export async function markAllNotificationsRead() {
  const r = await httpPublic.post(`/public/notifications/read-all`);
  return r.data;
}
