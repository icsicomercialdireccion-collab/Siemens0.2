// contexts/EquipmentContext.jsx - VERSIÓN LIMPIA
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { db, storage } from '../../firebase/FirebaseConfig';

const EquipmentContext = createContext({});

export const useEquipment = () => useContext(EquipmentContext);

export const EquipmentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 1. OBTENER EQUIPOS DE UN INVENTARIO
  const getEquipmentsByInventory = async (inventoryId) => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'inventarios', inventoryId, 'equipos')
      );
      
      const querySnapshot = await getDocs(q);
      const equipmentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
      
      setEquipments(equipmentsList);
      return equipmentsList;
      
    } catch (error) {
      console.error("Error obteniendo equipos:", error);
      Alert.alert("Error", "No se pudieron cargar los equipos");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 2. CREAR NUEVO EQUIPO (VERSIÓN LIMPIA)
  const createEquipment = async (inventoryId, equipmentData) => {
    try {
      setLoading(true);
      
      // Validación básica
      if (!equipmentData.serial || !equipmentData.serial.trim()) {
        throw new Error("El número de serie es requerido");
      }
      
      const serial = equipmentData.serial.trim().toUpperCase();
      let finalImageUrl = null;
      let imageFileName = null;
      
      // Subir imagen si es URI local
      if (equipmentData.imagenUrl && equipmentData.imagenUrl.startsWith('file://')) {
        try {
          const imageResult = await uploadImageToStorage(
            equipmentData.imagenUrl,
            inventoryId,
            serial
          );
          
          finalImageUrl = imageResult.url;
          imageFileName = imageResult.fileName;
          
        } catch (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          finalImageUrl = null;
          Alert.alert(
            "Aviso", 
            "Equipo creado pero no se pudo subir la imagen",
            [{ text: "OK" }]
          );
        }
      } 
      // Si ya es URL de Storage, usarla directamente
      else if (equipmentData.imagenUrl && equipmentData.imagenUrl.includes('firebasestorage.googleapis.com')) {
        finalImageUrl = equipmentData.imagenUrl;
      }
      
      // Preparar datos para Firestore
      const equipmentWithMeta = {
        serial: serial,
        estado: equipmentData.estado || equipmentData.notas || 'nuevo',
        observaciones: equipmentData.observaciones || '',
        tipo: equipmentData.tipo || "computadora",
        imagenUrl: finalImageUrl, // Solo URL de Storage o null
        imagenFileName: imageFileName,
        inventoryId: inventoryId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        lastImageUpdate: finalImageUrl ? serverTimestamp() : null
      };
      
      // Guardar en Firestore
      const equipmentRef = await addDoc(
        collection(db, 'inventarios', inventoryId, 'equipos'),
        equipmentWithMeta
      );
      
      // Actualizar contador del inventario
      try {
        const inventoryRef = doc(db, 'inventarios', inventoryId);
        await updateDoc(inventoryRef, {
          totalEquipos: increment(1),
          updatedAt: serverTimestamp()
        });
      } catch (counterError) {
        console.warn("Error actualizando contador:", counterError);
      }
      
      // Preparar respuesta
      const newEquipment = {
        id: equipmentRef.id,
        ...equipmentWithMeta,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Actualizar estado local
      setEquipments(prev => [...prev, newEquipment]);
      
      return {
        success: true,
        id: equipmentRef.id,
        message: finalImageUrl ? 'Equipo creado con imagen' : 'Equipo creado sin imagen',
        data: newEquipment,
        hasImage: !!finalImageUrl
      };
      
    } catch (error) {
      console.error("Error creando equipo:", error);
      
      let errorMessage = 'Error al crear equipo';
      if (error.message.includes('serial')) {
        errorMessage = 'El número de serie es requerido';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para crear equipos';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  // 3. ACTUALIZAR EQUIPO
  const updateEquipment = async (inventoryId, equipmentId, updates) => {
    try {
      setLoading(true);
      
      const equipmentRef = doc(db, 'inventarios', inventoryId, 'equipos', equipmentId);
      
      await updateDoc(equipmentRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Actualizar estado local
      setEquipments(prev => 
        prev.map(eq => 
          eq.id === equipmentId 
            ? { ...eq, ...updates, updatedAt: new Date() }
            : eq
        )
      );
      
      return {
        success: true,
        message: 'Equipo actualizado exitosamente'
      };
      
    } catch (error) {
      console.error("Error actualizando equipo:", error);
      return {
        success: false,
        error: 'Error al actualizar equipo'
      };
    } finally {
      setLoading(false);
    }
  };

  // 4. ELIMINAR EQUIPO
  const deleteEquipment = async (inventoryId, equipmentId) => {
    try {
      setLoading(true);
      
      const equipmentRef = doc(db, 'inventarios', inventoryId, 'equipos', equipmentId);
      
      // 1. Eliminar equipo
      await deleteDoc(equipmentRef);
      
      // 2. Actualizar contador del inventario
      const inventoryRef = doc(db, 'inventarios', inventoryId);
      await updateDoc(inventoryRef, {
        totalEquipos: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      // 3. Actualizar estado local
      setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
      
      return {
        success: true,
        message: 'Equipo eliminado exitosamente'
      };
      
    } catch (error) {
      console.error("Error eliminando equipo:", error);
      return {
        success: false,
        error: 'Error al eliminar equipo'
      };
    } finally {
      setLoading(false);
    }
  };

  // 5. OBTENER UN EQUIPO ESPECÍFICO
  const getEquipment = async (inventoryId, equipmentId) => {
    try {
      const equipmentRef = doc(db, 'inventarios', inventoryId, 'equipos', equipmentId);
      const equipmentSnap = await getDoc(equipmentRef);
      
      if (equipmentSnap.exists()) {
        return {
          success: true,
          data: {
            id: equipmentSnap.id,
            ...equipmentSnap.data()
          }
        };
      } else {
        return {
          success: false,
          error: 'Equipo no encontrado'
        };
      }
    } catch (error) {
      console.error("Error obteniendo equipo:", error);
      return {
        success: false,
        error: 'Error al cargar equipo'
      };
    }
  };

  // FUNCIÓN PARA SUBIR IMAGEN A STORAGE
  const uploadImageToStorage = async (imageUri, inventoryId, serial) => {
    try {
      // Convertir URI a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Limpiar serial para nombre de archivo
      const cleanSerial = serial
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 50);
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 6);
      
      // Nombre de archivo
      const fileName = `equipos/${inventoryId}/${cleanSerial}_${timestamp}_${randomString}.jpg`;
      
      // Verificaciones
      if (!blob.type.startsWith('image/')) {
        throw new Error('El archivo no es una imagen válida');
      }
      
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error('La imagen es muy grande (máximo 5MB)');
      }
      
      // Subir a Storage
      const storageRef = ref(storage, fileName);
      const uploadTask = await uploadBytes(storageRef, blob, {
        contentType: blob.type,
        customMetadata: {
          serial: serial,
          inventoryId: inventoryId,
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Obtener URL pública
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      return {
        url: downloadURL,
        fileName: fileName,
        serial: serial
      };
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw new Error(`No se pudo subir la imagen: ${error.message}`);
    }
  };

  // Valor del contexto
  const value = {
    // Estados
    loading,
    equipments,
    uploadProgress,
    
    // Funciones CRUD
    getEquipmentsByInventory,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipment,
    uploadImageToStorage,
    
    // Funciones auxiliares
    refreshEquipments: (inventoryId) => getEquipmentsByInventory(inventoryId),
    clearEquipments: () => setEquipments([])
  };

  return (
    <EquipmentContext.Provider value={value}>
      {children}
    </EquipmentContext.Provider>
  );
};

// Export default para Expo Router
export default EquipmentProvider;