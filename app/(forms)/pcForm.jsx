// app/(forms)/pcForm.jsx - VERSIÓN SOLO CORRECCIONES FIREBASE
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

// ✅ MANTENER TUS IMPORTACIONES DE CÁMARA INTACTAS
import { CameraView, useCameraPermissions } from 'expo-camera';

// ✅ Importación para upload de imágenes a Firebase
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "../../firebase/FirebaseConfig";

export default function PcForm() {
  const { inventoryId } = useLocalSearchParams();
  const router = useRouter();
  const { createEquipment, updateEquipment,loading: contextLoading } = useEquipment(); // ✅ Renombrar para evitar conflicto

  const { width: screenWidth } = useWindowDimensions();

  // ✅ AÑADE ESTOS PARA DIAGNÓSTICO:
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Función de diagnóstico
  const checkPermissions = async () => {
    console.log("=== 🔍 DIAGNÓSTICO DE PERMISOS ===");
    
    // 1. Verificar usuario
    console.log("1. 🔐 USUARIO:");
    console.log("   - Autenticado?:", auth.currentUser !== null);
    console.log("   - UID:", auth.currentUser?.uid);
    console.log("   - Email:", auth.currentUser?.email);
    
    // 2. Verificar inventario
    if (inventoryId) {
      console.log("2. 📋 INVENTARIO:", inventoryId);
      try {
        const inventarioRef = doc(db, 'inventarios', inventoryId);
        const inventarioSnap = await getDoc(inventarioRef);
        
        if (inventarioSnap.exists()) {
          const data = inventarioSnap.data();
          console.log("   - Existe?: ✅ SÍ");
          console.log("   - CreadoPor:", data.creadoPor);
          console.log("   - Coincide con usuario?:", data.creadoPor === auth.currentUser?.uid);
        } else {
          console.log("   - Existe?: ❌ NO");
        }
      } catch (error) {
        console.log("   - Error al verificar:", error.message);
      }
    }
    
    // 3. Verificar Storage
    console.log("3. 📦 STORAGE CONFIG:");
    console.log("   - Configurado?:", storage !== null);
    console.log("   - Bucket:", storage._bucket || "No disponible");
    
    console.log("=== FIN DIAGNÓSTICO ===");
  };
//--------------------------------------------------------------------------------------------------------------------------------------------------

  // ✅ MANTENER TUS HOOKS DE CÁMARA INTACTOS
  const [permission, requestPermission] = useCameraPermissions();

  // Estados del formulario - CORREGIDO para coincidir con tu contexto
  const [formData, setFormData] = useState({
    serial: "",
    estado: "nuevo", // ✅ CAMBIADO: "estado" en lugar de "notas"
    imagen: null,
    observaciones: "",
  });

  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false); // ✅ Nuevo estado
  const [localLoading, setLocalLoading] = useState(false); // ✅ Loading local

  const cameraRef = useRef(null);
  const storage = getStorage(app); // ✅ Inicializar storage


  // ✅ FUNCIÓN PARA SUBIR IMAGEN A FIREBASE STORAGE
  const uploadImageToFirebase = async (imageUri, inventoryId, equipmentId) => {
  try {
      console.log("📤 Iniciando upload de imagen...");
      
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const fileName = `equipos/${inventoryId}/${equipmentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, fileName);

      console.log("📁 Subiendo a:", fileName);
      
      if (!blob.type.startsWith('image/')) {
        throw new Error("El archivo debe ser una imagen");
      }
      
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error("La imagen es demasiado grande (máximo 5MB)");
      }
      
      const uploadResult = await uploadBytes(storageRef, blob);
      console.log("✅ Upload completado:", uploadResult);
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log("🔗 URL obtenida:", downloadURL);
      
      return downloadURL;
      
    } catch (error) {
      console.error("❌ Error subiendo imagen:", error);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }
  };

  // ✅ CORREGIR: MANEJAR ENVÍO DEL FORMULARIO
  const handleSubmit = async () => {
  console.log("=== 🚀 INICIANDO handleSubmit ===");
  
  try {
    // Ejecutar diagnóstico primero
    await checkPermissions();

    if (!formData.serial.trim()) {
      Alert.alert("Error", "El número de serie es requerido");
      return;
    }

    setLocalLoading(true);
    
    console.log("📝 Datos del formulario:", formData);
    console.log("🔑 inventoryId:", inventoryId);

    // 1. Preparar datos del equipo
    const equipmentData = {
      serial: formData.serial.trim().toUpperCase(),
      estado: formData.estado,
      observaciones: formData.observaciones.trim(),
      tipo: "computadora",
    };

    console.log("📦 PASO 1: Creando equipo en Firestore...");

    // 2. Crear el equipo en Firestore
    const createResult = await createEquipment(inventoryId, equipmentData);
    
    console.log("📊 Resultado createEquipment:", createResult);

    if (!createResult.success) {
      throw new Error(createResult.error || "No se pudo crear el equipo");
    }

    const equipmentId = createResult.id;
    console.log("🆔 Equipment ID generado:", equipmentId);

    // 3. Procesar imagen si existe
    if (formData.imagen) {
      console.log("🖼️ PASO 2: Procesando imagen...");
      
      try {
        setUploadingImage(true);
        
        console.log("📤 Intentando subir imagen...");
        
        // 🔥 PRUEBA CON REGLAS PERMISIVAS
        const imagenUrl = await uploadImageToFirebase(
          formData.imagen, 
          inventoryId, 
          equipmentId
        );
        
        console.log("✅ ¡IMAGEN SUBIDA EXITOSAMENTE!");
        console.log("🔗 URL:", imagenUrl);
        
        // 🔥 PRUEBA ACTUALIZAR EQUIPO
        console.log("🔄 PASO 3: Actualizando equipo con URL...");
        
        const updateResult = await updateEquipment(inventoryId, equipmentId, { 
          imagenUrl: imagenUrl 
        });
        
        console.log("📋 Resultado updateEquipment:", updateResult);
        
        if (!updateResult.success) {
          console.error("❌ updateEquipment falló:", updateResult.error);
        } else {
          console.log("🎉 ¡ÉXITO COMPLETO! Equipo + imagen guardados");
        }
        
      } catch (uploadError) {
        console.error("❌ ERROR en proceso de imagen:", uploadError);
        console.error("📌 Código error:", uploadError.code);
        console.error("📌 Mensaje:", uploadError.message);
        
        // El equipo ya está creado, solo mostramos advertencia
        Alert.alert(
          "Equipo creado",
          "Equipo registrado, pero hubo un problema con la imagen: " + uploadError.message,
          [{ text: "Aceptar" }]
        );
      } finally {
        setUploadingImage(false);
      }
    } else {
      console.log("📸 No hay imagen para subir");
    }

    // 4. Mostrar éxito
    Alert.alert(
      "¡Éxito!", 
      "Equipo registrado correctamente" + (formData.imagen ? " con imagen" : ""),
      [
        {
          text: "Agregar otro",
          onPress: () => {
            setFormData({
              serial: "",
              estado: "nuevo",
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
      ]
    );

  } catch (error) {
    console.error("❌ ERROR CRÍTICO en handleSubmit:", error);
    Alert.alert("Error", error.message);
  } finally {
    setLocalLoading(false);
    setUploadingImage(false);
  }
};

  // ✅ MANEJAR CÓDIGO ESCANEADO - MANTENER INTACTO
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

  // ✅ ABRIR SCANNER - MANTENER INTACTO
  const openScanner = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            "Permiso requerido",
            "Necesitas permitir el acceso a la cámara",
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

  // ✅ FUNCIONES DE IMAGEN - MANTENER INTACTAS
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
        quality: 0.7,
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
        quality: 0.7,
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

  // ✅ CALCULAR LOADING TOTAL
  const isLoading = contextLoading || localLoading || uploadingImage;

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

          {/* SECCIÓN 1: NÚMERO DE SERIE */}
          <View style={formEquipmentStyle.section}>
            <Text style={formEquipmentStyle.sectionTitle}>
              🔢 Número de Serie *
            </Text>

            <View style={formEquipmentStyle.inputGroup}>
              <Text style={formEquipmentStyle.label}>
                Ingresa el número de serie del equipo:
              </Text>

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
                  editable={!isLoading}
                  autoCapitalize="characters"
                  maxLength={50}
                />
                <TouchableOpacity
                  style={formEquipmentStyle.scannerButton}
                  onPress={openScanner}
                  disabled={isLoading}
                >
                  <Ionicons name="barcode-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={formEquipmentStyle.scannerFullButton}
                onPress={openScanner}
                disabled={isLoading}
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

          {/* SECCIÓN 2: ESTADO DEL EQUIPO */}
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
                  selectedValue={formData.estado} // ✅ CAMBIADO A "estado"
                  onValueChange={(value) => handleInputChange("estado", value)}
                  style={formEquipmentStyle.picker}
                  enabled={!isLoading}
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
              📸 Fotografía del Equipo {uploadingImage && "(Subiendo...)"}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
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
                  (Opcional) Toca un botón arriba para agregar
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
                editable={!isLoading}
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
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              <Text style={formEquipmentStyle.cancelButtonText}> Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                formEquipmentStyle.button,
                formEquipmentStyle.submitButton,
                isLoading && formEquipmentStyle.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
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

      {/* ✅ MODAL DEL SCANNER - MANTENER INTACTO */}
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
          
          {/* CÁMARA */}
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

// Estilos
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});