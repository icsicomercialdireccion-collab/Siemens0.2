// app/(forms)/pcForm.jsx - VERSIÓN CORREGIDA Y SIMPLIFICADA
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
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

// ✅ IMPORTACIÓN CORRECTA PARA SDK 54
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function PcForm() {
  const { inventoryId } = useLocalSearchParams();
  const router = useRouter();
  const { createEquipment, loading } = useEquipment();

  const { width: screenWidth } = useWindowDimensions();

  // ✅ HOOK DE PERMISOS (SDK 54+)
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

  const cameraRef = useRef(null);

  // ✅ MANEJAR CÓDIGO ESCANEADO
  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      console.log('📦 Código escaneado:', { type, data });
      
      setFormData(prev => ({
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

  // ✅ ABRIR SCANNER CON VERIFICACIÓN DE PERMISOS
  const openScanner = async () => {
    try {
      // Si no hay permisos, solicitarlos
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            "Permiso requerido",
            "Necesitas permitir el acceso a la cámara para escanear",
            [{ text: "OK" }]
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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // FUNCIÓN PARA SELECCIONAR IMAGEN
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitas permitir acceso a la galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        setFormData(prev => ({
          ...prev,
          imagen: selectedImage.uri,
        }));
        setImagePreview(selectedImage.uri);
      }
    } catch (error) {
      console.error("❌ Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  // FUNCIÓN PARA TOMAR FOTO
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitas permitir acceso a la cámara");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        setFormData(prev => ({
          ...prev,
          imagen: photo.uri,
        }));
        setImagePreview(photo.uri);
      }
    } catch (error) {
      console.error("❌ Error tomando foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    }
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
                  <Picker.Item label="🆕 Equipo Nuevo" value="nuevo" />
                  <Picker.Item label="🔄 Equipo Usado" value="usado" />
                  <Picker.Item label="🔧 En Reparación" value="reparacion" />
                  <Picker.Item label="⚡ Dañado" value="danado" />
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

      {/* ✅ MODAL DEL SCANNER SIMPLIFICADO */}
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
          
          {/* ✅ USAR CameraView EN LUGAR DE Camera */}
          {permission?.granted ? (
            <View style={formEquipmentStyle.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'qr',
                    'ean13',
                    'ean8',
                    'upc_a',
                    'upc_e',
                    'code39',
                    'code93',
                    'code128',
                    'codabar',
                    'itf14'
                  ]
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              >
                {/* OVERLAY */}
                <View style={formEquipmentStyle.scannerOverlay}>
                  <View style={[formEquipmentStyle.scannerFrame, {
                    width: screenWidth * 0.7,
                    height: screenWidth * 0.7,
                  }]}>
                    <View style={formEquipmentStyle.cornerTL} />
                    <View style={formEquipmentStyle.cornerTR} />
                    <View style={formEquipmentStyle.cornerBL} />
                    <View style={formEquipmentStyle.cornerBR} />
                    
                    {!scanned && (
                      <View style={formEquipmentStyle.scanLine} />
                    )}
                  </View>
                  
                  <View style={formEquipmentStyle.scannerInstructions}>
                    <Text style={formEquipmentStyle.instructionsText}>
                      {scanned ? '✅ Código detectado...' : 'Apunta el código de barras dentro del marco'}
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
                ? 'Procesando código...' 
                : 'El scanner se detendrá automáticamente al detectar un código'}
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
    </>
  );
}

// Estilos simplificados
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});