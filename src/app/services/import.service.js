// src/app/services/import.service.js
import http from "@/app/api/http"; // <--- SIN las llaves

export const ImportService = {
  /**
   * Sube el CSV al backend
   * @param {File} file
   */
  async importProductsCsv(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await http.post("/import/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  },
};