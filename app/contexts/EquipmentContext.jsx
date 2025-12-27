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
    console.log('📋 Obteniendo equipos para inventario:', inventoryId);
    
    const q = query(
      collection(db, 'inventarios', inventoryId, 'equipos')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 ${querySnapshot.docs.length} equipos encontrados`);
    
    const equipmentsList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        serial: data.serial || 'Sin serial',
        estado: data.estado || 'nuevo',
        observaciones: data.observaciones || '',
        tipo: data.tipo || "computadora",
        imagenUrl: data.imagenUrl || null,
        imagenFileName: data.imagenFileName || null,
        
        // CONVERTIR TIMESTAMPS
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        
        // Mantener otros campos
        ...Object.keys(data).reduce((acc, key) => {
          if (!['createdAt', 'updatedAt'].includes(key)) {
            acc[key] = data[key];
          }
          return acc;
        }, {})
      };
    });
    
    setEquipments(equipmentsList);
    return equipmentsList;
    
  } catch (error) {
    console.error("❌ Error obteniendo equipos:", {
      message: error.message,
      code: error.code,
      inventoryId
    });
    
    let errorMessage = "No se pudieron cargar los equipos";
    if (error.code === 'permission-denied') {
      errorMessage = "No tienes permiso para ver estos equipos";
    }
    
    Alert.alert("Error", errorMessage);
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
    console.log('🔍 getEquipment llamado:', { inventoryId, equipmentId });
    
    if (!inventoryId || !equipmentId) {
      console.error('❌ IDs inválidos:', { inventoryId, equipmentId });
      return {
        success: false,
        error: 'IDs de inventario o equipo inválidos'
      };
    }
    
    const equipmentRef = doc(db, 'inventarios', inventoryId, 'equipos', equipmentId);
    console.log('📄 Referencia creada:', equipmentRef.path);
    
    const equipmentSnap = await getDoc(equipmentRef);
    console.log('📦 Snap obtenido:', equipmentSnap.exists());
    
    if (equipmentSnap.exists()) {
      const data = equipmentSnap.data();
      
      // CONVERTIR TIMESTAMPS DE FIRESTORE
      const processedData = {
        id: equipmentSnap.id,
        serial: data.serial || 'Sin serial',
        estado: data.estado || 'nuevo',
        observaciones: data.observaciones || '',
        tipo: data.tipo || 'computadora',
        imagenUrl: data.imagenUrl || null,
        imagenFileName: data.imagenFileName || null,
        
        // CONVERTIR TIMESTAMPS CRÍTICO
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        
        // Campos adicionales que puedan existir
        ...Object.keys(data).reduce((acc, key) => {
          if (!['createdAt', 'updatedAt'].includes(key)) {
            acc[key] = data[key];
          }
          return acc;
        }, {})
      };
      
      console.log('✅ Equipo procesado:', {
        id: processedData.id,
        serial: processedData.serial,
        hasImage: !!processedData.imagenUrl,
        createdAt: processedData.createdAt,
        updatedAt: processedData.updatedAt
      });
      
      return {
        success: true,
        data: processedData
      };
      
    } else {
      console.log('❌ Equipo no existe en Firestore');
      return {
        success: false,
        error: 'Equipo no encontrado en la base de datos'
      };
    }
  } catch (error) {
    console.error("🔥 Error en getEquipment:", {
      message: error.message,
      code: error.code,
      inventoryId,
      equipmentId
    });
    
    let errorMessage = 'Error al cargar equipo';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'No tienes permisos para ver este equipo';
    } else if (error.code === 'not-found') {
      errorMessage = 'Equipo no encontrado';
    } else if (error.message.includes('Invalid document reference')) {
      errorMessage = 'Referencia inválida al equipo';
    }
    
    return {
      success: false,
      error: errorMessage
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