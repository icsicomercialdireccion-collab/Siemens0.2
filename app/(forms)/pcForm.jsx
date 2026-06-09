import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { formEquipmentStyle } from "../../assets/styles/formEquitpment.style";
import { COLORS } from "../../constants/colors";
import LocalStorageService from "../../services/localStorageService";
import UbicacionService from "../../services/UbicacionService";
import { useEquipment } from "../contexts/EquipmentContext";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

export default function PcForm() {
  const { inventoryId } = useLocalSearchParams();
  const router = useRouter();
  const { createEquipment, loading } = useEquipment();

  const { width: screenWidth } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();

  // Estados del formulario (NUEVO ORDEN)
  const [formData, setFormData] = useState({
    serial: "", // Número de serie
    perfil: "Standard", // 👈 NUEVO: Standard | Workstation | Ejecutiva | Mini | Tower
    ubicacion: "", // Ubicación física
    estado: "nuevo", // 👈 NUEVOS ESTADOS (valor interno)
    esquema: "Activo Fijo", // 👈 NUEVO: Activo Fijo | CaaS
    observaciones: "", // 👈 NUEVO: será picker con opciones fijas
    nota: "", // 👈 NUEVO: campo Nota (texto libre)
    imagen: null,
  });

  const [saveImageLocally, setSaveImageLocally] = useState(true);
  const [imageSavedLocally, setImageSavedLocally] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraType, setCameraType] = useState("back");

  const scannerCameraRef = useRef(null);
  const photoCameraRef = useRef(null);

  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Opciones de los pickers
  const perfiles = ["Standard", "Workstation", "Ejecutiva", "Mini", "Tower"];
  const estados = [
    "Baja",
    "Dañado Destrucción",
    "Donación",
    "En Reparación",
    "Nuevo",
    "Renovado",
    "Venta",
    "Usado con Garantía",
    "Usado Sin Garantía",
  ];
  const esquemas = ["CaaS", "Activo Fijo"];
  const observacionesOpciones = [
    "Etiqueta Dañada",
    "No carga imagen de Siemens",
    "No esta en AMTO",
    "No se puede instalar sistema operativo",
    "No tiene acciones en myIT",
    "Obtener Hash",
    "Sin caja",
    "Sin Cargador",
    "Sin Cargador y Sin Caja",
    "Sin etiqueta",
    "Sin imagen",
    "Otro",
  ];

  // Mapeo de estados a valores internos (para guardar en Firebase)
  const estadoMap = {
    Baja: "baja",
    "Dañado Destrucción": "danado_destruccion",
    Donación: "donacion",
    "En Reparación": "reparacion",
    Nuevo: "nuevo",
    Renovado: "renovado",
    Venta: "venta",
    "Usado con Garantía": "usado_garantia",
    "Usado Sin Garantía": "usado_sin_garantia",
  };

  const buscarSugerencias = async (texto) => {
    setFormData((prev) => ({ ...prev, ubicacion: texto }));
    if (texto.length >= 2) {
      const resultados = await UbicacionService.buscarUbicaciones(texto);
      setSugerencias(resultados);
      setMostrarSugerencias(resultados.length > 0);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  const seleccionarSugerencia = (ubicacion) => {
    setFormData((prev) => ({ ...prev, ubicacion }));
    setMostrarSugerencias(false);
  };

  const saveImageToDevice = async (imageUri, serial) => {
    if (!saveImageLocally) return { success: false, skipped: true };
    try {
      const fileName = `equipo_${serial}_${Date.now()}.jpg`;
      const result = await LocalStorageService.saveImageToGallery(
        imageUri,
        fileName,
      );
      if (result.success) setImageSavedLocally(true);
      return result;
    } catch (error) {
      console.error("❌ Error guardando imagen local:", error);
      return { success: false, error: error.message };
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      setFormData((prev) => ({ ...prev, serial: data }));
      setTimeout(() => {
        setShowScanner(false);
        Alert.alert("✅ Código Escaneado", `Número de serie: ${data}`);
      }, 1500);
    }
  };

  const openScanner = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            "Permiso requerido",
            "Necesitas permitir el acceso a la cámara para escanear",
          );
          return;
        }
      }
      setScanned(false);
      if (global.gc) global.gc();
      await new Promise((resolve) => setTimeout(resolve, 100));
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

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpeg", "image/jpg"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        const compressedImage = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        setFormData((prev) => ({ ...prev, imagen: compressedImage.uri }));
        setImagePreview(compressedImage.uri);
        setImageSavedLocally(false);
        Alert.alert(
          "✅ Imagen seleccionada",
          `"${selectedImage.name}" cargada correctamente`,
        );
      }
    } catch (error) {
      console.error("❌ Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

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

  const capturePhoto = async () => {
    if (photoCameraRef.current) {
      try {
        const photoOptions = {
          quality: 0.5,
          base64: false,
          exif: false,
          skipProcessing: true,
        };
        const photo =
          await photoCameraRef.current.takePictureAsync(photoOptions);
        const compressedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        if (photoCameraRef.current) {
          await photoCameraRef.current.pausePreview?.();
          photoCameraRef.current = null;
        }
        setShowCameraModal(false);
        setFormData((prev) => ({ ...prev, imagen: compressedPhoto.uri }));
        setImagePreview(compressedPhoto.uri);
        setImageSavedLocally(false);
        Alert.alert("Foto tomada", "Foto guardada exitosamente");
      } catch (error) {
        console.error("Error tomando foto:", error);
        Alert.alert("Error", "No se pudo tomar la foto");
        setShowCameraModal(false);
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === "back" ? "front" : "back"));
  };

  const limpiarImagenTemporal = async (uri) => {
    if (uri && uri.startsWith("file://")) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) await FileSystem.deleteAsync(uri);
      } catch (error) {}
    }
  };

  const handleSubmit = async () => {
    if (!formData.serial.trim()) {
      Alert.alert("Error", "El número de serie es requerido");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    const serial = formData.serial.trim().toUpperCase();
    let localImageUri = null;

    try {
      if (formData.imagen && saveImageLocally) {
        const saveResult = await saveImageToDevice(formData.imagen, serial);
        if (saveResult.success) localImageUri = saveResult.uri;
      }

      const equipmentData = {
        serial: serial,
        perfil: formData.perfil,
        ubicacion: formData.ubicacion,
        estado: estadoMap[formData.estado] || formData.estado,
        esquema: formData.esquema,
        observaciones: formData.observaciones,
        nota: formData.nota,
        imagenUrl: formData.imagen,
        tipo: "computadora",
        createdAt: new Date().toISOString(),
        localImageUri: localImageUri,
      };

      const result = await createEquipment(inventoryId, equipmentData);

      if (result.success) {
        if (formData.imagen && formData.imagen.startsWith("file://")) {
          try {
            await FileSystem.deleteAsync(formData.imagen);
            console.log("🧹 Imagen temporal eliminada del caché");
          } catch (e) {
            console.log("No se pudo eliminar imagen temporal");
          }
        }
        if (formData.ubicacion)
          await UbicacionService.guardarUbicacion(formData.ubicacion);

        let successMessage = "✅ Equipo registrado correctamente";
        if (localImageUri)
          successMessage =
            "✅ Equipo registrado\n📸 Imagen guardada en tu galería";
        else if (formData.imagen && saveImageLocally)
          successMessage = "✅ Imagen guardada en la galería";
        else if (formData.imagen)
          successMessage =
            "✅ Equipo registrado\n📸 Imagen guardada en la nube";

        Alert.alert("¡Éxito!", successMessage, [
          {
            text: "Agregar otro",
            onPress: () => {
              setFormData({
                serial: "",
                perfil: "Standard",
                ubicacion: "",
                estado: "Nuevo",
                esquema: "Activo Fijo",
                observaciones: "",
                nota: "",
                imagen: null,
              });
              setImagePreview(null);
              setImageSavedLocally(false);
            },
          },
          { text: "Volver a detalles", onPress: () => router.back() },
        ]);
      } else {
        if (result.code === "DUPLICATE_SERIAL")
          Alert.alert("⚠️ Serial Duplicado", result.error);
        else
          Alert.alert(
            "Error",
            result.error || "No se pudo registrar el equipo",
          );
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const regionOfInterest = useMemo(() => {
    const frameWidth = 0.85;
    const frameHeight = 0.35;
    const offsetX = (1 - frameWidth) / 2;
    const offsetY = (1 - frameHeight) / 2;
    return { x: offsetX, y: offsetY, width: frameWidth, height: frameHeight };
  }, []);

  const [scanAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    let animation;
    if (!scanned && showScanner) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [scanned, showScanner]);

  useEffect(() => {
    return () => {
      if (formData.imagen) limpiarImagenTemporal(formData.imagen);
      if (imagePreview) limpiarImagenTemporal(imagePreview);
      if (scannerCameraRef.current) scannerCameraRef.current = null;
      if (photoCameraRef.current) photoCameraRef.current = null;
    };
  }, []);

  return (
    <>
      <ScrollView
        style={formEquipmentStyle.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={formEquipmentStyle.formContainer}>
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

          {/* Guardado automático en galería */}
          <View style={formEquipmentStyle.section}>
            <View style={formEquipmentStyle.saveLocalContainer}>
              <View style={{ flex: 1 }}>
                <Text style={formEquipmentStyle.saveLocalLabel}>
                  📸 Guardado automático en galería
                </Text>
                <Text style={formEquipmentStyle.saveLocalSubLabel}>
                  La imagen se guardará en tu teléfono al registrar el equipo
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
              <Text style={formEquipmentStyle.successText}>
                ✅ Imagen guardada en tu galería
              </Text>
            )}
          </View>

          {/* 1. Número de serie */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              🔢 Número de Serie *
            </Text>
            <View style={formEquipmentStyle.inputGroup}>
              <View style={formEquipmentStyle.serialInputContainer}>
                <TextInput
                  style={[
                    formEquipmentStyle.input,
                    formEquipmentStyle.serialInput,
                  ]}
                  value={formData.serial}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, serial: text }))
                  }
                  placeholder="Ej: SN123456789ABC"
                  placeholderTextColor="#999"
                  editable={!loading && !isSaving}
                  autoCapitalize="characters"
                  maxLength={50}
                />
                <TouchableOpacity
                  style={formEquipmentStyle.scannerButton}
                  onPress={openScanner}
                  disabled={loading || isSaving}
                >
                  <Ionicons name="barcode-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={formEquipmentStyle.scannerFullButton}
                onPress={openScanner}
                disabled={loading || isSaving}
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

          {/* 2. Perfil */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>📌 Perfil</Text>
            <View style={formEquipmentStyle.inputGroup}>
              <View style={formEquipmentStyle.pickerContainer}>
                <Picker
                  selectedValue={formData.perfil}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, perfil: value }))
                  }
                  style={formEquipmentStyle.picker}
                  enabled={!loading && !isSaving}
                >
                  {perfiles.map((perfil) => (
                    <Picker.Item key={perfil} label={perfil} value={perfil} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* 3. Ubicación física */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📍 Ubicación Física
            </Text>
            <View style={formEquipmentStyle.inputGroup}>
              <TextInput
                style={formEquipmentStyle.input}
                value={formData.ubicacion}
                onChangeText={buscarSugerencias}
                placeholder="Ej: Planta baja, oficina 101, bodega norte"
                placeholderTextColor="#999"
                editable={!loading && !isSaving}
              />
              {mostrarSugerencias && sugerencias.length > 0 && (
                <View style={formEquipmentStyle.sugerenciasContainer}>
                  {sugerencias.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={formEquipmentStyle.sugerenciaItem}
                      onPress={() => seleccionarSugerencia(item)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={formEquipmentStyle.sugerenciaText}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={formEquipmentStyle.helperText}>
                Especifica el lugar exacto donde se encuentra el equipo
              </Text>
            </View>
          </View>

          {/* 4. Estado del equipo */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📝 Estado del Equipo
            </Text>
            <View style={formEquipmentStyle.inputGroup}>
              <View style={formEquipmentStyle.pickerContainer}>
                <Picker
                  selectedValue={formData.estado}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, estado: value }))
                  }
                  style={formEquipmentStyle.picker}
                  enabled={!loading && !isSaving}
                >
                  {estados.map((estado) => (
                    <Picker.Item key={estado} label={estado} value={estado} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* 5. Esquema */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>📄 Esquema</Text>
            <View style={formEquipmentStyle.inputGroup}>
              <View style={formEquipmentStyle.pickerContainer}>
                <Picker
                  selectedValue={formData.esquema}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, esquema: value }))
                  }
                  style={formEquipmentStyle.picker}
                  enabled={!loading && !isSaving}
                >
                  {esquemas.map((esquema) => (
                    <Picker.Item
                      key={esquema}
                      label={esquema}
                      value={esquema}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* 6. Observaciones (picker) */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📋 Observaciones
            </Text>
            <View style={formEquipmentStyle.inputGroup}>
              <View style={formEquipmentStyle.pickerContainer}>
                <Picker
                  selectedValue={formData.observaciones}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, observaciones: value }))
                  }
                  style={formEquipmentStyle.picker}
                  enabled={!loading && !isSaving}
                >
                  <Picker.Item label="Selecciona una observación" value="" />
                  {observacionesOpciones.map((obs) => (
                    <Picker.Item key={obs} label={obs} value={obs} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* 7. Nota (texto libre) */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>📝 Nota</Text>
            <View style={formEquipmentStyle.inputGroup}>
              <TextInput
                style={[formEquipmentStyle.input, formEquipmentStyle.textArea]}
                value={formData.nota}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, nota: text }))
                }
                placeholder="Nota adicional (opcional)"
                placeholderTextColor="#999"
                editable={!loading && !isSaving}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* 8. Imagen */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              📸 Fotografía del Equipo
            </Text>
            <Text style={formEquipmentStyle.label}>
              Sube una foto del equipo:
            </Text>
            <View style={formEquipmentStyle.imageButtonsContainer}>
              <TouchableOpacity
                style={[
                  formEquipmentStyle.imageButton,
                  formEquipmentStyle.galleryButton,
                ]}
                onPress={pickImage}
                disabled={loading || isSaving}
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
                disabled={loading || isSaving}
              >
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={formEquipmentStyle.imageButtonText}>Cámara</Text>
              </TouchableOpacity>
            </View>
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
                    setFormData((prev) => ({ ...prev, imagen: null }));
                    setImageSavedLocally(false);
                  }}
                  disabled={loading || isSaving}
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

          {/* Botones de acción */}
          <View style={formEquipmentStyle.actionButtons}>
            <TouchableOpacity
              style={[
                formEquipmentStyle.button,
                formEquipmentStyle.cancelButton,
              ]}
              onPress={() => router.back()}
              disabled={loading || isSaving}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              <Text style={formEquipmentStyle.cancelButtonText}> Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                formEquipmentStyle.button,
                formEquipmentStyle.submitButton,
                (loading || isSaving) && formEquipmentStyle.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || isSaving}
            >
              {loading || isSaving ? (
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

          {/* Camera Container - CameraView SIN hijos */}
          {permission?.granted ? (
            <View style={formEquipmentStyle.cameraContainer}>
              {/* Solo CameraView, sin hijos */}
              <CameraView
                ref={scannerCameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["code128"],
                  interval: 1000,
                  regionOfInterest: regionOfInterest,
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />

              {/* Overlay FUERA de CameraView - con posición absoluta */}
              <View style={formEquipmentStyle.scannerOverlay}>
                <View
                  style={[
                    formEquipmentStyle.scannerFrame,
                    {
                      width: screenWidth * 0.95,
                      height: screenWidth * 0.35,
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
                    name={scanned ? "checkmark-circle" : "barcode-outline"}
                    size={30}
                    color="#fff"
                    style={formEquipmentStyle.scanIcon}
                  />
                </View>
              </View>
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
        onRequestClose={() => {
          setShowCameraModal(false);
          if (photoCameraRef.current) {
            photoCameraRef.current = null;
          }
        }}
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
