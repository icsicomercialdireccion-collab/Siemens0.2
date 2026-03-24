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
      console.log("🧪 Probando conexión con Cloud Functions V1...");

      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "No autenticado" };
      }

      const result = await this.testFunction({ test: true });
      console.log("✅ Test exitoso:", result.data);

      return { success: true, data: result.data };
    } catch (error) {
      console.error("❌ Error en test:", error);
      return { success: false, error: error.message };
    }
  }

  async startExport(inventoryId) {
    try {
      console.log("📤 Iniciando exportación...");

      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: "Por favor inicia sesión para exportar.",
          code: "unauthenticated",
        };
      }

      console.log("✅ Usuario autenticado:", user.uid);

      // Forzar refresh del token antes de llamar
      await user.getIdToken(true);

      const result = await this.exportFunction({ inventoryId });

      console.log("✅ Exportación iniciada:", result.data);
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
