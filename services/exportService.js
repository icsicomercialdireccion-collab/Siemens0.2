// app/services/exportService.js - VERSIÓN SIMPLIFICADA
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase/FirebaseConfig";

class ExportService {
  constructor() {
    this.exportFunction = httpsCallable(functions, "exportInventory");
    this.statusFunction = httpsCallable(functions, "getExportStatus");
    this.testFunction = httpsCallable(functions, "testConnection");
  }

  async testConnection() {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "No autenticado" };
      }

      const result = await this.testFunction({ test: true });

      return { success: true, data: result.data };
    } catch (error) {
      console.error("❌ Error en test:", error);
      return { success: false, error: error.message };
    }
  }

  async startExport(inventoryId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: "Por favor inicia sesión para exportar.",
          code: "unauthenticated",
        };
      }

      // Forzar refresh del token antes de llamar
      await user.getIdToken(true);

      const result = await this.exportFunction({ inventoryId });

      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error("❌ Error en exportService:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      return {
        success: false,
        error: error.message || "Error al exportar",
        code: error.code,
      };
    }
  }

  async getStatus(jobId) {
    try {
      const result = await this.statusFunction({ jobId });
      return {
        success: true,
        ...result.data,
      };
    } catch (error) {
      console.error("Error obteniendo estado:", error);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }
}

export default new ExportService();
