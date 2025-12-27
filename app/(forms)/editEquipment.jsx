// app/(forms)/editEquipment.jsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FormEditStyle } from '../../assets/styles/formEditEquipment.style';
import { COLORS } from '../../constants/colors';
import { useEquipment } from '../contexts/EquipmentContext';

export default function EditEquipmentScreen() {
  const { inventoryId, equipmentId, equipmentData } = useLocalSearchParams();
  const router = useRouter();
  const { updateEquipment, uploadImageToStorage, loading } = useEquipment();
  
  const [formData, setFormData] = useState({
    serial: '',
    estado: 'nuevo',
    observaciones: '',
    imagenUrl: null,
    currentImageUrl: null,
  });
  
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (equipmentData) {
      try {
        const parsedData = JSON.parse(equipmentData);
        setOriginalData(parsedData);
        setFormData({
          serial: parsedData.serial || '',
          estado: parsedData.estado || 'nuevo',
          observaciones: parsedData.observaciones || '',
          imagenUrl: parsedData.imagenUrl || null,
          currentImageUrl: parsedData.imagenUrl || null,
        });
      } catch (error) {
        console.error('Error parsing equipment data:', error);
        Alert.alert('Error', 'No se pudo cargar la información del equipo');
      }
    }
  }, [equipmentData]);

  const pickImage = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para seleccionar una imagen');
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        setFormData(prev => ({ ...prev, imagenUrl: selectedImage.uri }));
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la cámara para tomar una foto');
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        setImage(photo.uri);
        setFormData(prev => ({ ...prev, imagenUrl: photo.uri }));
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de eliminar la imagen del equipo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setImage(null);
            setFormData(prev => ({ ...prev, imagenUrl: null }));
          }
        }
      ]
    );
  };

  const uploadImage = async () => {
    if (!image) return null;
    
    try {
      setUploading(true);
      console.log('Subiendo imagen...', { inventoryId, serial: formData.serial });
      
      const result = await uploadImageToStorage(
        image,
        inventoryId,
        formData.serial || 'equipo'
      );
      
      console.log('✅ Imagen subida:', result.url);
      return result.url;
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. El equipo se guardará sin imagen.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    // Validaciones
    if (!formData.serial.trim()) {
      Alert.alert('Error', 'El número de serie es requerido');
      return;
    }

    if (uploading) {
      Alert.alert('Espera', 'La imagen se está subiendo, por favor espera...');
      return;
    }

    try {
      let finalImageUrl = formData.currentImageUrl;
      let hasNewImage = false;

      // Si hay una nueva imagen seleccionada, subirla
      if (image && image !== formData.currentImageUrl) {
        Alert.alert(
          'Subir imagen',
          '¿Deseas actualizar la imagen del equipo?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Sí, subir imagen',
              onPress: async () => {
                await processUpdate(true);
              }
            },
            {
              text: 'Sí, pero sin imagen',
              onPress: async () => {
                await processUpdate(false);
              }
            }
          ]
        );
      } else {
        await processUpdate(false);
      }
    } catch (error) {
      console.error('Error en handleUpdate:', error);
      Alert.alert('Error', 'No se pudo procesar la actualización');
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
          formData.serial || 'equipo'
        );
        
        if (uploadResult && uploadResult.url) {
          finalImageUrl = uploadResult.url;
          imageFileName = uploadResult.fileName;
        }
      }
      // Si se eliminó la imagen
      else if (!image && formData.currentImageUrl && formData.imagenUrl === null) {
        finalImageUrl = null;
      }

      // Preparar datos para actualizar
      const updateData = {
        serial: formData.serial.trim().toUpperCase(),
        estado: formData.estado,
        observaciones: formData.observaciones.trim(),
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

      // Verificar si hay cambios reales
      const hasChanges = Object.keys(updateData).some(key => {
        if (key === 'imagenUrl' || key === 'imagenFileName') return true;
        return updateData[key] !== originalData?.[key];
      });

      if (!hasChanges) {
        Alert.alert('Sin cambios', 'No se detectaron cambios para actualizar');
        return;
      }

      console.log('Actualizando equipo con:', updateData);

      // Ejecutar actualización
      const result = await updateEquipment(inventoryId, equipmentId, updateData);

      if (result.success) {
        Alert.alert('Éxito', 'Equipo actualizado correctamente', [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el equipo');
      }
    } catch (error) {
      console.error('Error actualizando equipo:', error);
      Alert.alert('Error', 'Error al actualizar el equipo');
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
      (image && image !== originalData?.imagenUrl) ||
      (!image && originalData?.imagenUrl && formData.imagenUrl === null);

    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        '¿Estás seguro de salir sin guardar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Salir', 
            style: 'destructive',
            onPress: () => router.back() 
          }
        ]
      );
    } else {
      router.back();
    }
  };

  // Verificar si está cargando
  const isLoading = loading || uploading;

  return (
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
        <Text style={FormEditStyle.subtitle}>Actualiza la información del equipo</Text>
      </View>

      <View style={FormEditStyle.form}>
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
                <Text style={FormEditStyle.imageNote}>Nueva imagen seleccionada</Text>
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
          <Text style={FormEditStyle.sectionTitle}>📋 Información del Equipo</Text>

          {/* Serial */}
          <View style={FormEditStyle.inputGroup}>
            <Text style={FormEditStyle.label}>
              Número de Serie <Text style={FormEditStyle.required}>*</Text>
            </Text>
            <TextInput
              style={FormEditStyle.input}
              value={formData.serial}
              onChangeText={(text) => setFormData({ ...formData, serial: text })}
              placeholder="Ej: SN123456789"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </View>

          {/* Estado */}
          <View style={FormEditStyle.inputGroup}>
            <Text style={FormEditStyle.label}>Estado del Equipo</Text>
            <View style={FormEditStyle.pickerContainer}>
              <Picker
                selectedValue={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
                style={FormEditStyle.picker}
                enabled={!isLoading}
              >
                <Picker.Item label="🆕 Nuevo" value="nuevo" />
                <Picker.Item label="🔄 Usado" value="usado" />
                <Picker.Item label="🔧 En Reparación" value="reparacion" />
                <Picker.Item label="⚡ Dañado" value="danado" />
              </Picker>
            </View>
          </View>

          {/* Observaciones */}
          <View style={FormEditStyle.inputGroup}>
            <Text style={FormEditStyle.label}>Observaciones</Text>
            <TextInput
              style={[FormEditStyle.input, FormEditStyle.textArea]}
              value={formData.observaciones}
              onChangeText={(text) => setFormData({ ...formData, observaciones: text })}
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
            style={[FormEditStyle.button, FormEditStyle.cancelButton, isLoading && FormEditStyle.buttonDisabled]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Ionicons name="close-outline" size={20} color={COLORS.text} />
            <Text style={FormEditStyle.cancelButtonText}> Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[FormEditStyle.button, FormEditStyle.saveButton, isLoading && FormEditStyle.buttonDisabled]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={FormEditStyle.saveButtonText}> Guardar Cambios</Text>
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
  );
}

