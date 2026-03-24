// utils/imageProcessor.js
import * as ImageManipulator from "expo-image-manipulator";

export const processImageForUpload = async (uri) => {
  try {
    // 1. Obtener dimensiones originales
    // 2. Aplicar manipulaciones:
    //    - Redimensionar (Manteniendo el aspecto, max 1200px de ancho)
    //    - Comprimir al 80%
    //    - Formato JPEG (más compatible con ExcelJS en el backend)

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    console.log(
      `📸 Imagen optimizada: de original a ${result.width}px. Nuevo URI: ${result.uri}`,
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("❌ Error procesando imagen:", error);
    return { uri }; // Si falla, devolvemos la original para no bloquear al usuario
  }
};
