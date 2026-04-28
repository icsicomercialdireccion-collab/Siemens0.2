// app/services/UbicacionService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ubicaciones_usadas";

class UbicacionService {
  // Obtener todas las ubicaciones usadas
  static async getUbicaciones() {
    try {
      const ubicaciones = await AsyncStorage.getItem(STORAGE_KEY);
      return ubicaciones ? JSON.parse(ubicaciones) : [];
    } catch (error) {
      console.error("Error obteniendo ubicaciones:", error);
      return [];
    }
  }

  // Guardar una nueva ubicación
  static async guardarUbicacion(ubicacion) {
    if (!ubicacion || ubicacion.trim() === "") return;

    try {
      const ubicaciones = await this.getUbicaciones();
      const ubicacionLimpia = ubicacion.trim().toUpperCase();

      // Evitar duplicados
      if (!ubicaciones.includes(ubicacionLimpia)) {
        const nuevasUbicaciones = [ubicacionLimpia, ...ubicaciones].slice(
          0,
          20,
        ); // Máximo 20
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nuevasUbicaciones),
        );
      }
    } catch (error) {
      console.error("Error guardando ubicación:", error);
    }
  }

  // Buscar ubicaciones que coincidan con el texto
  static async buscarUbicaciones(texto) {
    if (!texto || texto.length < 2) return [];

    const ubicaciones = await this.getUbicaciones();
    const textoLower = texto.toLowerCase();

    return ubicaciones
      .filter((ubi) => ubi.toLowerCase().includes(textoLower))
      .slice(0, 10); // Máximo 10 sugerencias
  }
}

export default UbicacionService;
