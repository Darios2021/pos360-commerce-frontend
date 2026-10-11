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

// Locutores disponibles para la voz en off: [{ id, nombre, porDefecto,
// descripcion, genero, edad, tono, proveedor, muestra }]. `muestra` es la URL
// absoluta y pública del MP3 de prueba (la arma la API).
export async function listarVoces() {
  const { data } = await http.get(`${BASE}/voces`);
  return Array.isArray(data) ? data : [];
}

// Catálogo de sonidos (efectos, filtro, músicas) con su muestra y el mapa viral.
export async function listarSonidos() {
  const { data } = await http.get(`${BASE}/sonidos`);
  return { sonidos: Array.isArray(data?.sonidos) ? data.sonidos : [], viral: data?.viral || {} };
}

// Corta un video en cola o dibujándose: queda en estado "cancelada".
export async function cancelarPieza(id) {
  const { data } = await http.post(`${BASE}/piezas/${id}/cancelar`);
  return data;
}

// Redes conectadas del comercio: { instagram, facebook, whatsapp, ensayo } (sin tokens).
export async function getRedes() {
  const { data } = await http.get(`${BASE}/redes`);
  return data;
}

// Guarda credenciales o el modo ensayo (sólo super admin). Los tokens van al servicio cifrados.
export async function guardarRedes(cambios) {
  await http.put(`${BASE}/redes`, cambios);
}

// Publica un video listo: { destinos: ["instagram", "facebook"], texto }.
export async function publicarPieza(id, publicacion) {
  const { data } = await http.post(`${BASE}/piezas/${id}/publicaciones`, publicacion);
  return data;
}

// Cupo mensual de videos: {mes, limite, usados, quedan, renueva, nombreMes}; limite null = sin tope.
export async function getCupo() {
  const { data } = await http.get(`${BASE}/cupo`);
  return data;
}
