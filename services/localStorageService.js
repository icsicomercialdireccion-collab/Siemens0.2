// app/services/localStorageService.js - VERSIÓN SIN FILESYSTEM

import * as MediaLibrary from "expo-media-library";
import { Alert, Linking, Platform } from "react-native";

class LocalStorageService {
  // Solicitar permisos de galería
  static async requestPermissions() {
    try {
      console.log("🔍 Solicitando permisos de galería...");

      // En Android 13+, verificar estado primero
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const { status: currentStatus } =
          await MediaLibrary.getPermissionsAsync();
        console.log("   Estado actual:", currentStatus);

        if (currentStatus === "granted") {
          console.log("✅ Permisos ya concedidos");
          return true;
        }

        const { status, canAskAgain } =
          await MediaLibrary.requestPermissionsAsync();
        console.log("   Resultado solicitud:", status);

        if (status !== "granted") {
          if (!canAskAgain) {
            Alert.alert(
              "⚠️ Permiso necesario",
              "Para guardar imágenes en tu galería:\n\n" +
                "1. Ve a Configuración\n" +
                "2. Aplicaciones\n" +
                "3. Siemens\n" +
                "4. Permisos\n" +
                "5. Activa 'Archivos y medios'",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Abrir configuración",
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          } else {
            Alert.alert(
              "Permiso requerido",
              "Necesitamos acceso a tu galería para guardar las imágenes de los equipos",
            );
          }
          return false;
        }

        return true;
      }

      // Android 12 o inferior, iOS
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galería para guardar las imágenes",
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Error solicitando permisos:", error);
      return false;
    }
  }

  // Guardar imagen en galería - VERSIÓN SIN FILESYSTEM
  static async saveImageToGallery(imageUri, fileName = null) {
    try {
      console.log("=".repeat(50));
      console.log("📸 Guardando imagen en galería");
      console.log("   URI:", imageUri?.substring(0, 100));

      if (!imageUri) {
        throw new Error("No hay imagen para guardar");
      }

      // 1. Solicitar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: "Permiso denegado para guardar imágenes",
          code: "PERMISSION_DENIED",
        };
      }

      // 2. Guardar directamente - ¡SIN FILESYSTEM!
      console.log("📸 Ejecutando saveToLibraryAsync...");
      const asset = await MediaLibrary.saveToLibraryAsync(imageUri);

      console.log("✅ Imagen guardada exitosamente!");
      console.log("   URI del asset:", asset.uri);
      console.log("=".repeat(50));

      return {
        success: true,
        uri: asset.uri,
        message: "Imagen guardada en la galería",
      };
    } catch (error) {
      console.error("=".repeat(50));
      console.error("❌ Error guardando imagen:");
      console.error("   Mensaje:", error.message);
      console.error("   Código:", error.code);
      console.error("=".repeat(50));

      // Mensaje de error amigable
      let userMessage = "No se pudo guardar la imagen";

      if (error.message?.includes("permission")) {
        userMessage =
          "Permiso denegado. Activa el permiso de almacenamiento en Configuración";
      } else if (
        error.message?.includes("storage") ||
        error.message?.includes("space")
      ) {
        userMessage = "Espacio insuficiente en el dispositivo";
      }

      return {
        success: false,
        error: userMessage,
        technicalError: error.message,
      };
    }
  }
}

export default LocalStorageService;
