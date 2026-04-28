// app/(forms)/editEquipment.jsx - VERSIÓN CORREGIDA
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react"; // ✅ Agregar useRef
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FormEditStyle } from "../../assets/styles/formEditEquipment.style";
import { COLORS } from "../../constants/colors";
import LocalStorageService from "../../services/localStorageService";
import { useEquipment } from "../contexts/EquipmentContext";

// ✅ USAR expo-document-picker en lugar de expo-image-picker
import * as DocumentPicker from "expo-document-picker";

// ✅ IMPORTAR CameraView para tomar fotos
import { CameraView, useCameraPermissions } from "expo-camera";

export default function EditEquipmentScreen() {
  const { inventoryId, equipmentId, equipmentData } = useLocalSearchParams();
  const router = useRouter();
  const { updateEquipment, uploadImageToStorage, loading } = useEquipment();

  // ✅ HOOK DE PERMISOS PARA CÁMARA
  const [permission, requestPermission] = useCameraPermissions();

  const [formData, setFormData] = useState({
    serial: "",
    estado: "nuevo",
    observaciones: "",
    ubicacion: "",
    imagenUrl: null,
    currentImageUrl: null,
  });

  const [saveImageLocally, setSaveImageLocally] = useState(true);
  const [imageSavedLocally, setImageSavedLocally] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // ✅ NUEVO: Estados para modal de cámara
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraType, setCameraType] = useState("back");

  // ✅ CORRECCIÓN: Usar useRef en lugar de useState para la referencia de cámara
  const cameraRef = useRef(null);

  useEffect(() => {
    if (equipmentData) {
      try {
        const parsedData = JSON.parse(equipmentData);
        setOriginalData(parsedData);
        setFormData({
          serial: parsedData.serial || "",
          estado: parsedData.estado || "nuevo",
          observaciones: parsedData.observaciones || "",
          imagenUrl: parsedData.imagenUrl || null,
          currentImageUrl: parsedData.imagenUrl || null,
          ubicacion: parsedData.ubicacion || "",
        });
      } catch (error) {
        console.error("Error parsing equipment data:", error);
        Alert.alert("Error", "No se pudo cargar la información del equipo");
      }
    }
  }, [equipmentData]);

  const saveImageToDevice = async (imageUri, serial) => {
    if (!saveImageLocally) return { success: false, skipped: true };

    try {
      const fileName = `equipo_${serial}_${Date.now()}.jpg`;
      const result = await LocalStorageService.saveImageToGallery(
        imageUri,
        fileName,
      );

      if (result.success) {
        setImageSavedLocally(true);
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error("❌ Error guardando imagen local:", error);
      return { success: false, error: error.message };
    }
  };

  // ✅ FUNCIÓN PARA SELECCIONAR IMAGEN DESDE GALERÍA
  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpeg", "image/jpg"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      // ✅ CORRECTO: Usar "canceled" en lugar de "type"
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        setImage(selectedImage.uri);
        setFormData((prev) => ({ ...prev, imagenUrl: selectedImage.uri }));

        Alert.alert(
          "✅ Imagen seleccionada",
          `"${selectedImage.name}" cargada correctamente`,
          [{ text: "OK" }],
        );
      } else {
      }
    } catch (error) {
      console.error("❌ Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  // ✅ FUNCIÓN PARA TOMAR FOTO CON LA CÁMARA
  const takePhoto = async () => {
    try {
      // Verificar permisos de cámara
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            "Permiso denegado",
            "Necesitas permitir acceso a la cámara",
          );
          return;
        }
      }

      // Abrir modal de cámara
      setShowCameraModal(true);
    } catch (error) {
      console.error("❌ Error accediendo a la cámara:", error);
      Alert.alert("Error", "No se pudo acceder a la cámara");
    }
  };

  // ✅ FUNCIÓN PARA CAPTURAR FOTO CON CAMERAVIEW
  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photoOptions = {
          quality: 0.7,
          base64: false,
          exif: false,
        };

        const photo = await cameraRef.current.takePictureAsync(photoOptions);
        setShowCameraModal(false);

        setImage(photo.uri);
        setFormData((prev) => ({ ...prev, imagenUrl: photo.uri }));

        Alert.alert("✅ Foto tomada", "Foto guardada exitosamente", [
          { text: "OK" },
        ]);
      } catch (error) {
        console.error("Error tomando foto:", error);
        Alert.alert("Error", "No se pudo tomar la foto");
        setShowCameraModal(false);
      }
    }
  };

  // ✅ FUNCIÓN PARA CAMBIAR TIPO DE CÁMARA
  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  const removeImage = () => {
    Alert.alert(
      "Eliminar imagen",
      "¿Estás seguro de eliminar la imagen del equipo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setImage(null);
            setFormData((prev) => ({ ...prev, imagenUrl: null }));
          },
        },
      ],
    );
  };

  const uploadImage = async () => {
    if (!image) return null;

    try {
      setUploading(true);

      const result = await uploadImageToStorage(
        image,
        inventoryId,
        formData.serial || "equipo",
      );

      return result.url;
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      Alert.alert(
        "Error",
        "No se pudo subir la imagen. El equipo se guardará sin imagen.",
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.serial.trim()) {
      Alert.alert("Error", "El número de serie es requerido");
      return;
    }

    if (uploading || isSaving) {
      Alert.alert("Espera", "Procesando imagen, por favor espera...");
      return;
    }

    const serial = formData.serial.trim().toUpperCase();
    let localImageUri = null;

    try {
      // 1. Si hay nueva imagen y está activado el guardado local, guardar primero
      if (image && image !== formData.currentImageUrl && saveImageLocally) {
        const saveResult = await saveImageToDevice(image, serial);

        if (saveResult.success) {
          localImageUri = saveResult.uri;
        } else if (!saveResult.skipped) {
          if (saveResult.error?.includes("Permiso")) {
            Alert.alert(
              "Permiso denegado",
              "No se pudo guardar la imagen en la galería. Verifica los permisos de la app.",
              [{ text: "OK" }],
            );
          }
        }
      }

      // 2. Subir nueva imagen a Firebase Storage si es necesario
      let finalImageUrl = formData.currentImageUrl;
      let imageFileName = null;

      if (image && image !== formData.currentImageUrl) {
        setIsSaving(true);
        const uploadResult = await uploadImageToStorage(
          image,
          inventoryId,
          serial,
        );

        if (uploadResult && uploadResult.url) {
          finalImageUrl = uploadResult.url;
          imageFileName = uploadResult.fileName;
        }
      } else if (
        !image &&
        formData.currentImageUrl &&
        formData.imagenUrl === null
      ) {
        finalImageUrl = null;
      }

      // 3. Preparar datos para actualizar
      const updateData = {
        serial: serial,
        estado: formData.estado,
        observaciones: formData.observaciones.trim(),
        ubicacion: formData.ubicacion.trim(),
      };

      if (finalImageUrl !== formData.currentImageUrl) {
        updateData.imagenUrl = finalImageUrl;
        if (imageFileName) {
          updateData.imagenFileName = imageFileName;
        } else if (finalImageUrl === null) {
          updateData.imagenFileName = null;
        }
      }

      // 4. Verificar cambios
      const hasChanges = Object.keys(updateData).some((key) => {
        // Si es imagen, considerar que hay cambio si se modificó
        if (key === "imagenUrl" || key === "imagenFileName") {
          return finalImageUrl !== formData.currentImageUrl;
        }
        // Para ubicacion y otros campos
        return updateData[key] !== originalData?.[key];
      });

      // 5. Ejecutar actualización
      const result = await updateEquipment(
        inventoryId,
        equipmentId,
        updateData,
      );

      if (result.success) {
        // Mensaje de éxito personalizado
        let successMessage = "✅ Equipo actualizado correctamente";
        if (localImageUri) {
          successMessage =
            "✅ Equipo actualizado\n📸 Imagen guardada en tu galería";
        } else if (image && saveImageLocally && !localImageUri) {
          successMessage = "✅ Equipo actualizado";
        } else if (image) {
          successMessage =
            "✅ Equipo actualizado\n📸 Imagen actualizada en la nube";
        }

        Alert.alert("Éxito", successMessage, [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", result.error || "No se pudo actualizar el equipo");
      }
    } catch (error) {
      console.error("Error actualizando equipo:", error);
      Alert.alert("Error", "Error al actualizar el equipo");
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  const processUpdate = async (uploadNewImage) => {
    setUploading(uploadNewImage);

    try {
      let finalImageUrl = formData.currentImageUrl;
      let imageFileName = null;

      // Subir nueva imagen si es necesario
      if (uploadNewImage && image) {
        const uploadResult = await uploadImageToStorage(
          image,
          inventoryId,
          formData.serial || "equipo",
        );

        if (uploadResult && uploadResult.url) {
          finalImageUrl = uploadResult.url;
          imageFileName = uploadResult.fileName;
        }
      }
      // Si se eliminó la imagen
      else if (
        !image &&
        formData.currentImageUrl &&
        formData.imagenUrl === null
      ) {
        finalImageUrl = null;
      }

      // Preparar datos para actualizar
      const updateData = {
        serial: formData.serial.trim().toUpperCase(),
        estado: formData.estado,
        observaciones: formData.observaciones.trim(),
        ubicacion: formData.ubicacion ? formData.ubicacion.trim() : "",
      };

      // Solo agregar campos de imagen si cambiaron
      if (finalImageUrl !== formData.currentImageUrl) {
        updateData.imagenUrl = finalImageUrl;
        if (imageFileName) {
          updateData.imagenFileName = imageFileName;
        } else if (finalImageUrl === null) {
          updateData.imagenFileName = null;
        }
      }

      console.log("📤 updateData a enviar:", updateData); // 👈 Debe incluir ubicacion

      // Verificar si hay cambios reales
      const hasChanges = Object.keys(updateData).some((key) => {
        if (key === "imagenUrl" || key === "imagenFileName") return true;
        return updateData[key] !== originalData?.[key];
      });

      if (!hasChanges) {
        Alert.alert("Sin cambios", "No se detectaron cambios para actualizar");
        return;
      }

      // Ejecutar actualización
      const result = await updateEquipment(
        inventoryId,
        equipmentId,
        updateData,
      );

      if (result.success) {
        Alert.alert("Éxito", "Equipo actualizado correctamente", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", result.error || "No se pudo actualizar el equipo");
      }
    } catch (error) {
      console.error("Error actualizando equipo:", error);
      Alert.alert("Error", "Error al actualizar el equipo");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    // Verificar si hay cambios sin guardar
    const hasChanges =
      formData.serial !== originalData?.serial ||
      formData.estado !== originalData?.estado ||
      formData.observaciones !== originalData?.observaciones ||
      formData.ubicacion !== originalData?.ubicacion ||
      (image && image !== originalData?.imagenUrl) ||
      (!image && originalData?.imagenUrl && formData.imagenUrl === null);

    if (hasChanges) {
      Alert.alert(
        "Cambios sin guardar",
        "¿Estás seguro de salir sin guardar los cambios?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  // Verificar si está cargando
  const isLoading = loading || uploading;

  return (
    <>
      <ScrollView style={FormEditStyle.container}>
        <View style={FormEditStyle.header}>
          <TouchableOpacity
            style={FormEditStyle.backButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={FormEditStyle.title}>✏️ Editar Equipo</Text>
          <Text style={FormEditStyle.subtitle}>
            Actualiza la información del equipo
          </Text>
        </View>

        <View style={FormEditStyle.form}>
          <View style={FormEditStyle.section}>
            <View style={FormEditStyle.saveLocalContainer}>
              <View style={{ flex: 1 }}>
                <Text style={FormEditStyle.saveLocalLabel}>
                  📸 Guardado automático en galería
                </Text>
                <Text style={FormEditStyle.saveLocalSubLabel}>
                  La imagen se guardará en tu teléfono al actualizar el equipo
                </Text>
              </View>
              <Switch
                value={saveImageLocally}
                onValueChange={setSaveImageLocally}
                trackColor={{ false: "#767577", true: COLORS.primary }}
                thumbColor={saveImageLocally ? "#fff" : "#f4f3f4"}
              />
            </View>
            {imageSavedLocally && (
              <Text style={FormEditStyle.successText}>
                ✅ Imagen guardada en tu galería
              </Text>
            )}
          </View>

          {/* Sección de Imagen */}
          <View style={FormEditStyle.imageSection}>
            <Text style={FormEditStyle.sectionTitle}>📸 Imagen del Equipo</Text>

            <View style={FormEditStyle.imageContainer}>
              {image ? (
                <View style={FormEditStyle.selectedImageContainer}>
                  <Image
                    source={{ uri: image }}
                    style={FormEditStyle.selectedImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={FormEditStyle.removeImageButton}
                    onPress={removeImage}
                    disabled={isLoading}
                  >
                    <Ionicons name="close-circle" size={30} color="#FF4444" />
                  </TouchableOpacity>
                  <Text style={FormEditStyle.imageNote}>
                    Nueva imagen seleccionada
                  </Text>
                </View>
              ) : formData.currentImageUrl ? (
                <View style={FormEditStyle.currentImageContainer}>
                  <Image
                    source={{ uri: formData.currentImageUrl }}
                    style={FormEditStyle.currentImage}
                    resizeMode="cover"
                  />
                  <Text style={FormEditStyle.imageNote}>Imagen actual</Text>
                </View>
              ) : (
                <View style={FormEditStyle.noImageContainer}>
                  <Ionicons name="image-outline" size={60} color="#ccc" />
                  <Text style={FormEditStyle.noImageText}>Sin imagen</Text>
                </View>
              )}
            </View>

            <View style={FormEditStyle.imageButtons}>
              <TouchableOpacity
                style={[FormEditStyle.imageButton, FormEditStyle.galleryButton]}
                onPress={pickImage}
                disabled={isLoading}
              >
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={FormEditStyle.imageButtonText}>Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[FormEditStyle.imageButton, FormEditStyle.cameraButton]}
                onPress={takePhoto}
                disabled={isLoading}
              >
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={FormEditStyle.imageButtonText}>Cámara</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Información del Equipo */}
          <View style={FormEditStyle.infoSection}>
            <Text style={FormEditStyle.sectionTitle}>
              📋 Información del Equipo
            </Text>

            {/* Serial */}
            <View style={FormEditStyle.inputGroup}>
              <Text style={FormEditStyle.label}>
                Número de Serie <Text style={FormEditStyle.required}>*</Text>
              </Text>
              <TextInput
                style={FormEditStyle.input}
                value={formData.serial}
                onChangeText={(text) =>
                  setFormData({ ...formData, serial: text })
                }
                placeholder="Ej: SN123456789"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>

            <View style={FormEditStyle.inputGroup}>
              <Text style={FormEditStyle.label}>📍 Ubicación específica</Text>
              <TextInput
                style={FormEditStyle.input}
                value={formData.ubicacion}
                onChangeText={(text) =>
                  setFormData({ ...formData, ubicacion: text })
                }
                placeholder="Ej: Planta baja, oficina 101, bodega norte"
                placeholderTextColor="#999"
                editable={!isLoading}
              />
              <Text style={FormEditStyle.helperText}>
                Lugar exacto donde se encuentra el equipo
              </Text>
            </View>

            {/* Estado */}
            <View style={FormEditStyle.inputGroup}>
              <Text style={FormEditStyle.label}>Estado del Equipo</Text>
              <View style={FormEditStyle.pickerContainer}>
                <Picker
                  selectedValue={formData.estado}
                  onValueChange={(value) =>
                    setFormData({ ...formData, estado: value })
                  }
                  style={FormEditStyle.picker}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Equipo Nuevo" value="nuevo" />
                  <Picker.Item label="Equipo Usado" value="usado" />
                  <Picker.Item label="En Reparación" value="reparacion" />
                  <Picker.Item label="Dañado" value="danado" />
                </Picker>
              </View>
            </View>

            {/* Observaciones */}
            <View style={FormEditStyle.inputGroup}>
              <Text style={FormEditStyle.label}>Observaciones</Text>
              <TextInput
                style={[FormEditStyle.input, FormEditStyle.textArea]}
                value={formData.observaciones}
                onChangeText={(text) =>
                  setFormData({ ...formData, observaciones: text })
                }
                placeholder="Notas o comentarios adicionales..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Botones de acción */}
          <View style={FormEditStyle.actions}>
            <TouchableOpacity
              style={[
                FormEditStyle.button,
                FormEditStyle.cancelButton,
                isLoading && FormEditStyle.buttonDisabled,
              ]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Ionicons name="close-outline" size={20} color={COLORS.text} />
              <Text style={FormEditStyle.cancelButtonText}> Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                FormEditStyle.button,
                FormEditStyle.saveButton,
                isLoading && FormEditStyle.buttonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={FormEditStyle.saveButtonText}>
                    {" "}
                    Guardar Cambios
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Estado de carga */}
        {uploading && (
          <View style={FormEditStyle.uploadOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={FormEditStyle.uploadText}>Subiendo imagen...</Text>
          </View>
        )}
      </ScrollView>

      {/* ✅ MODAL PARA TOMAR FOTO CON CÁMARA (usando Modal componente) */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              style={styles.cameraBackButton}
              onPress={() => setShowCameraModal(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>TOMAR FOTO</Text>
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {permission?.granted ? (
            <CameraView
              ref={cameraRef} // ✅ CORRECTO: usando useRef
              style={styles.cameraView}
              facing={cameraType}
            />
          ) : (
            <View style={styles.permissionContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.permissionText}>Solicitando permisos...</Text>
            </View>
          )}

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={capturePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraInstructions}>
            <Text style={styles.instructionsText}>
              Toca el círculo blanco para tomar la foto
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ✅ ESTILOS PARA EL MODAL DE CÁMARA
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  flipCameraButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraView: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  permissionText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  cameraControls: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  cameraInstructions: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
});
