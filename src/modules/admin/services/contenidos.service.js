// src/modules/admin/services/contenidos.service.js
// Gestión de contenidos: videos para redes hechos por el servicio de contenidos.
// Todo pasa por la API de POS 360 (/admin/contenidos), que guarda la clave.
import http from "@/app/api/http";

const BASE = "/admin/contenidos";

export async function getFuente() {
  const { data } = await http.get(`${BASE}/fuente`);
  return data;
}

export async function buscarProductos(buscar = "") {
  const { data } = await http.get(`${BASE}/productos`, { params: { buscar } });
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
