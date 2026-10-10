// src/modules/admin/services/contenidos.service.js
// Gestión de contenidos: videos para redes hechos por el servicio de contenidos.
// Todo pasa por la API de POS 360 (/admin/contenidos), que guarda la clave.
import http from "@/app/api/http";

const BASE = "/admin/contenidos";

export async function getFuente() {
  const { data } = await http.get(`${BASE}/fuente`);
  return data;
}

export async function buscarProductos(buscar = "", pagina = 1) {
  const { data } = await http.get(`${BASE}/productos`, { params: { buscar, pagina } });
  return data;
}

export async function sugerirGuion(encargo) {
  const { data } = await http.post(`${BASE}/guion`, encargo);
  return data;
}

export async function listarPiezas(limite = 30) {
  const { data } = await http.get(`${BASE}/piezas`, { params: { limite } });
  return data;
}

export async function crearPieza(encargo) {
  const { data } = await http.post(`${BASE}/piezas`, encargo);
  return data;
}

export async function verPieza(id) {
  const { data } = await http.get(`${BASE}/piezas/${id}`);
  return data;
}

export async function borrarPieza(id) {
  await http.delete(`${BASE}/piezas/${id}`);
}

// Título y descripción del video (no salen en el video). null o "" los borra.
export async function editarPieza(id, cambios) {
  const { data } = await http.patch(`${BASE}/piezas/${id}`, cambios);
  return data;
}

// Locutores disponibles para la voz en off: [{ id, nombre, porDefecto }].
export async function listarVoces() {
  const { data } = await http.get(`${BASE}/voces`);
  return Array.isArray(data) ? data : [];
}

// Corta un video en cola o dibujándose: queda en estado "cancelada".
export async function cancelarPieza(id) {
  const { data } = await http.post(`${BASE}/piezas/${id}/cancelar`);
  return data;
}
