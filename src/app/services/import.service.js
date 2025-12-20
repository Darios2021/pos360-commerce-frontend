// src/app/services/import.service.js
import http from "../api/http";

export const ImportService = {
  async importProductsCsv(file) {
    const fd = new FormData();
    fd.append("file", file);

    const { data } = await http.post("/import/products", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },
};
