import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { formEquipmentStyle } from "../../assets/styles/formEquitpment.style";
import { COLORS } from "../../constants/colors";
import { useEquipment } from "../contexts/EquipmentContext";

// ✅ USAR expo-document-picker (más estable para Expo)
import * as DocumentPicker from "expo-document-picker";

// ✅ IMPORTACIÓN PARA SDK 54
import { CameraView, useCameraPermissions } from "expo-camera";

export default function PcForm() {
  const { inventoryId } = useLocalSearchParams();
  const router = useRouter();
  const { createEquipment, loading } = useEquipment();

  const { width: screenWidth } = useWindowDimensions();

  // ✅ HOOK DE PERMISOS
  const [permission, requestPermission] = useCameraPermissions();

  // Estados del formulario
  const [formData, setFormData] = useState({
    serial: "",
    notas: "nuevo",
    imagen: null,
    observaciones: "",
  });

  // Estados del scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Estado para modal de cámara de fotos
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraType, setCameraType] = useState("back");

  const scannerCameraRef = useRef(null);
  const photoCameraRef = useRef(null);

  // ✅ MANEJAR CÓDIGO ESCANEADO
  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      console.log("📦 Código escaneado:", { type, data });

      setFormData((prev) => ({
        ...prev,
        serial: data,
      }));

      setTimeout(() => {
        setShowScanner(false);
        Alert.alert("✅ Código Escaneado", `Número de serie: ${data}`, [
          { text: "OK" },
        ]);
      }, 1500);
    }
  };

  // ✅ ABRIR SCANNER
  const openScanner = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            "Permiso requerido",
            "Necesitas permitir el acceso a la cámara para escanear",
            [{ text: "OK" }],
          );
          return;
        }
      }

      setScanned(false);
      setShowScanner(true);
    } catch (error) {
      console.error("Error abriendo scanner:", error);
      Alert.alert("Error", "No se pudo abrir la cámara");
    }
  };

  const closeScanner = () => {
    setShowScanner(false);
    setScanned(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ FUNCIÓN PARA SELECCIONAR IMAGEN CON expo-document-picker
  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpeg", "image/jpg"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log("Resultado completo:", JSON.stringify(result, null, 2));

      // ✅ CORREGIDO: Chequear "canceled" en lugar de "type"
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log(
          "✅ Imagen seleccionada correctamente:",
          selectedImage.name,
        );

        setFormData((prev) => ({
          ...prev,
          imagen: selectedImage.uri,
        }));
        setImagePreview(selectedImage.uri);

        Alert.alert(
          "✅ Imagen seleccionada",
          `"${selectedImage.name}" cargada correctamente`,
          [{ text: "OK" }],
        );
      } else {
        console.log("❌ Usuario canceló o no seleccionó");
        // No hacer nada si el usuario canceló
      }
    } catch (error) {
      console.error("❌ Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  // ✅ FUNCIÓN PARA TOMAR FOTO
  const takePhoto = async () => {
    try {
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

      setShowCameraModal(true);
    } catch (error) {
      console.error("❌ Error accediendo a la cámara:", error);
      Alert.alert("Error", "No se pudo acceder a la cámara");
    }
  };

  // ✅ FUNCIÓN PARA CAPTURAR FOTO
  const capturePhoto = async () => {
    if (photoCameraRef.current) {
      try {
        const photoOptions = {
          quality: 0.7,
          base64: false,
          exif: false,
        };

        const photo =
          await photoCameraRef.current.takePictureAsync(photoOptions);
        setShowCameraModal(false);

        setFormData((prev) => ({
          ...prev,
          imagen: photo.uri,
        }));
        setImagePreview(photo.uri);

        Alert.alert("Foto tomada", "Foto guardada exitosamente", [
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

  const handleSubmit = async () => {
    if (!formData.serial.trim()) {
      Alert.alert("Error", "El número de serie es requerido");
      return;
    }

    const equipmentData = {
      serial: formData.serial.trim().toUpperCase(),
      estado: formData.notas,
      observaciones: formData.observaciones.trim(),
      imagenUrl: formData.imagen,
      tipo: "computadora",
      createdAt: new Date().toISOString(),
    };

    const result = await createEquipment(inventoryId, equipmentData);

    if (result.success) {
      Alert.alert("¡Éxito!", "Equipo registrado correctamente", [
        {
          text: "Agregar otro",
          onPress: () => {
            setFormData({
              serial: "",
              notas: "nuevo",
              imagen: null,
              observaciones: "",
            });
            setImagePreview(null);
          },
        },
        {
          text: "Volver a detalles",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert("Error", result.error || "No se pudo registrar el equipo");
    }
  };

  return (
    <>
      <ScrollView
        style={formEquipmentStyle.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={formEquipmentStyle.formContainer}>
          {/* TÍTULO */}
          <View style={formEquipmentStyle.header}>
            <Ionicons
              name="hardware-chip-outline"
              size={40}
              color={COLORS.primary}
            />
            <Text style={formEquipmentStyle.title}>Registrar Nuevo Equipo</Text>
            <Text style={formEquipmentStyle.subtitle}>
              Inventario: {inventoryId?.substring(0, 8)}...
            </Text>
          </View>

          {/* SECCIÓN 1: NÚMERO DE SERIE CON SCANNER */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              🔢 Número de Serie *
            </Text>

            <View style={formEquipmentStyle.inputGroup}>
              <Text style={formEquipmentStyle.label}>
                Ingresa el número de serie del equipo:
              </Text>

              {/* INPUT CON BOTÓN DE SCANNER */}
              <View style={formEquipmentStyle.serialInputContainer}>
                <TextInput
                  style={[
                    formEquipmentStyle.input,
                    formEquipmentStyle.serialInput,
                  ]}
                  value={formData.serial}
                  onChangeText={(text) => handleInputChange("serial", text)}
                  placeholder="Ej: SN123456789ABC"
                  placeholderTextColor="#999"
                  editable={!loading}
                  autoCapitalize="characters"
                  maxLength={50}
                />
                <TouchableOpacity
                  style={formEquipmentStyle.scannerButton}
                  onPress={openScanner}
                  disabled={loading}
                >
                  <Ionicons name="barcode-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* BOTÓN DE SCANNER COMPLETO */}
              <TouchableOpacity
                style={formEquipmentStyle.scannerFullButton}
                onPress={openScanner}
                disabled={loading}
              >
                <Ionicons
                  name="barcode-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={formEquipmentStyle.scannerButtonText}>
                  {" "}
                  ESCANEAR CÓDIGO DE BARRAS
                </Text>
              </TouchableOpacity>

              <Text style={formEquipmentStyle.helperText}>
                Este campo es obligatorio. Usa mayúsculas o escanea el código.
              </Text>
            </View>
          </View>

          {/* SECCIÓN 2: ESTADO DEL EQUIPO (NOTAS) */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📝 Estado del Equipo
            </Text>

            <View style={formEquipmentStyle.inputGroup}>
              <Text style={formEquipmentStyle.label}>
                Selecciona el estado:
              </Text>
              <View style={formEquipmentStyle.pickerContainer}>
                <Picker
                  selectedValue={formData.notas}
                  onValueChange={(value) => handleInputChange("notas", value)}
                  style={formEquipmentStyle.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Equipo Nuevo" value="nuevo" />
                  <Picker.Item label="Equipo Usado" value="usado" />
                  <Picker.Item label="En Reparación" value="reparacion" />
                  <Picker.Item label="Dañado" value="danado" />
                </Picker>
              </View>
            </View>
          </View>

          {/* SECCIÓN 3: IMAGEN */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📸 Fotografía del Equipo
            </Text>

            <Text style={formEquipmentStyle.label}>
              Sube una foto del equipo:
            </Text>

            {/* BOTONES DE IMAGEN */}
            <View style={formEquipmentStyle.imageButtonsContainer}>
              <TouchableOpacity
                style={[
                  formEquipmentStyle.imageButton,
                  formEquipmentStyle.galleryButton,
                ]}
                onPress={pickImage}
                disabled={loading}
              >
                <Ionicons name="image-outline" size={24} color="#fff" />
                <Text style={formEquipmentStyle.imageButtonText}>Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  formEquipmentStyle.imageButton,
                  formEquipmentStyle.cameraButton,
                ]}
                onPress={takePhoto}
                disabled={loading}
              >
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={formEquipmentStyle.imageButtonText}>Cámara</Text>
              </TouchableOpacity>
            </View>

            {/* PREVIEW DE LA IMAGEN */}
            {imagePreview ? (
              <View style={formEquipmentStyle.imagePreviewContainer}>
                <Text style={formEquipmentStyle.label}>Vista previa:</Text>
                <Image
                  source={{ uri: imagePreview }}
                  style={formEquipmentStyle.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={formEquipmentStyle.removeImageButton}
                  onPress={() => {
                    setImagePreview(null);
                    handleInputChange("imagen", null);
                  }}
                  disabled={loading}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={COLORS.error}
                  />
                  <Text style={formEquipmentStyle.removeImageText}>
                    Eliminar imagen
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={formEquipmentStyle.noImageContainer}>
                <Ionicons name="image-outline" size={60} color="#ddd" />
                <Text style={formEquipmentStyle.noImageText}>
                  No hay imagen seleccionada
                </Text>
                <Text style={formEquipmentStyle.noImageSubtext}>
                  Toca un botón arriba para agregar
                </Text>
              </View>
            )}
          </View>

          {/* SECCIÓN 4: OBSERVACIONES */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📋 Observaciones Adicionales
            </Text>

            <View style={formEquipmentStyle.inputGroup}>
              <Text style={formEquipmentStyle.label}>Notas o comentarios:</Text>
              <TextInput
                style={[formEquipmentStyle.input, formEquipmentStyle.textArea]}
                value={formData.observaciones}
                onChangeText={(text) =>
                  handleInputChange("observaciones", text)
                }
                placeholder="Ej: Equipo con detalles en la carcasa, falta cable de poder, etc."
                placeholderTextColor="#999"
                editable={!loading}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={formEquipmentStyle.charCount}>
                {formData.observaciones.length}/500 caracteres
              </Text>
            </View>
          </View>

          {/* BOTONES DE ACCIÓN */}
          <View style={formEquipmentStyle.actionButtons}>
            <TouchableOpacity
              style={[
                formEquipmentStyle.button,
                formEquipmentStyle.cancelButton,
              ]}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              <Text style={formEquipmentStyle.cancelButtonText}> Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                formEquipmentStyle.button,
                formEquipmentStyle.submitButton,
                loading && formEquipmentStyle.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={formEquipmentStyle.submitButtonText}>
                    {" "}
                    Registrar Equipo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ✅ MODAL DEL SCANNER */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={closeScanner}
      >
        <View style={formEquipmentStyle.scannerContainer}>
          {/* HEADER */}
          <View style={formEquipmentStyle.scannerHeader}>
            <TouchableOpacity
              style={formEquipmentStyle.scannerBackButton}
              onPress={closeScanner}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={formEquipmentStyle.scannerTitle}>ESCANEAR CÓDIGO</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* ✅ USAR CameraView */}
          {permission?.granted ? (
            <View style={formEquipmentStyle.cameraContainer}>
              <CameraView
                ref={scannerCameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "qr",
                    "ean13",
                    "ean8",
                    "upc_a",
                    "upc_e",
                    "code39",
                    "code93",
                    "code128",
                    "codabar",
                    "itf14",
                  ],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              >
                {/* OVERLAY */}
                <View style={formEquipmentStyle.scannerOverlay}>
                  <View
                    style={[
                      formEquipmentStyle.scannerFrame,
                      {
                        width: screenWidth * 0.7,
                        height: screenWidth * 0.7,
                      },
                    ]}
                  >
                    <View style={formEquipmentStyle.cornerTL} />
                    <View style={formEquipmentStyle.cornerTR} />
                    <View style={formEquipmentStyle.cornerBL} />
                    <View style={formEquipmentStyle.cornerBR} />

                    {!scanned && <View style={formEquipmentStyle.scanLine} />}
                  </View>

                  <View style={formEquipmentStyle.scannerInstructions}>
                    <Text style={formEquipmentStyle.instructionsText}>
                      {scanned
                        ? "✅ Código detectado..."
                        : "Apunta el código de barras dentro del marco"}
                    </Text>
                    <Ionicons
                      name={scanned ? "checkmark-circle" : "scan-outline"}
                      size={30}
                      color="#fff"
                      style={formEquipmentStyle.scanIcon}
                    />
                  </View>
                </View>
              </CameraView>
            </View>
          ) : (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Verificando permisos...</Text>
            </View>
          )}

          {/* FOOTER */}
          <View style={formEquipmentStyle.scannerFooter}>
            <Text style={formEquipmentStyle.scannerHint}>
              {scanned
                ? "Procesando código..."
                : "El scanner se detendrá automáticamente al detectar un código"}
            </Text>

            <TouchableOpacity
              style={formEquipmentStyle.manualEntryButton}
              onPress={closeScanner}
            >
              <Text style={formEquipmentStyle.manualEntryText}>
                Ingresar manualmente
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL PARA TOMAR FOTO CON CÁMARA */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraModalContainer}>
          {/* HEADER */}
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

          {/* CÁMARA */}
          <View style={styles.cameraWrapper}>
            {permission?.granted ? (
              <CameraView
                ref={photoCameraRef}
                style={StyleSheet.absoluteFillObject}
                facing={cameraType}
              />
            ) : (
              <View style={styles.permissionContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.permissionText}>
                  Verificando permisos...
                </Text>
              </View>
            )}
          </View>

          {/* CONTROLES */}
          <View style={styles.cameraControls}>
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={capturePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>

          {/* INSTRUCCIONES */}
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

// ✅ ESTILOS
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },

  // Estilos para el modal de cámara
  cameraModalContainer: {
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
  cameraWrapper: {
    flex: 1,
    position: "relative",
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
  captureButtonContainer: {
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
