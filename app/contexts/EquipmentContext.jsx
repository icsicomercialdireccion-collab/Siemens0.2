// contexts/EquipmentContext.jsx
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,

  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../../firebase/FirebaseConfig';

const EquipmentContext = createContext({});

export const useEquipment = () => useContext(EquipmentContext);

export const EquipmentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState([]);

  // 1. OBTENER EQUIPOS DE UN INVENTARIO
  const getEquipmentsByInventory = async (inventoryId) => {
    try {
      setLoading(true);
      console.log("🔍 Obteniendo equipos para inventario:", inventoryId);
      
      const q = query(
        collection(db, 'inventarios', inventoryId, 'equipos')
      );
      
      const querySnapshot = await getDocs(q);
      const equipmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ ${equipmentsList.length} equipos encontrados`);
      setEquipments(equipmentsList);
      
      return equipmentsList;
      
    } catch (error) {
      console.error("❌ Error obteniendo equipos:", error);
      Alert.alert("Error", "No se pudieron cargar los equipos");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 2. CREAR NUEVO EQUIPO
  const createEquipment = async (inventoryId, equipmentData) => {
    try {
      setLoading(true);
      console.log("🔄 Creando equipo en inventario:", inventoryId);
      console.log("📦 Datos del equipo:", equipmentData);
      
      // Validar datos requeridos
      if (!equipmentData.serial) {
        throw new Error("El número de serie es requerido");
      }
      
      // Agregar metadata
      const equipmentWithMeta = {
        ...equipmentData,
        inventoryId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };
      
      // 1. Agregar equipo a la subcolección
      const equipmentRef = await addDoc(
        collection(db, 'inventarios', inventoryId, 'equipos'),
        equipmentWithMeta
      );
      
      console.log("✅ Equipo creado ID:", equipmentRef.id);
      
      // 2. Actualizar contador del inventario
      const inventoryRef = doc(db, 'inventarios', inventoryId);
      await updateDoc(inventoryRef, {
        totalEquipos: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // 3. Actualizar estado local
      const newEquipment = {
        id: equipmentRef.id,
        ...equipmentWithMeta
      };
      
      setEquipments(prev => [...prev, newEquipment]);
      
      return {
        success: true,
        id: equipmentRef.id,
        message: 'Equipo creado exitosamente'
      };
      
    } catch (error) {
      console.error("❌ Error creando equipo:", error);
      
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
    }
  };

  // 3. ACTUALIZAR EQUIPO
  const updateEquipment = async (inventoryId, equipmentId, updates) => {
  try {
    setLoading(true);
    console.log("✏️ [CONTEXTO] Actualizando equipo:", { 
      inventoryId, 
      equipmentId, 
      updates 
    });
    
    // ✅ VERIFICAR QUE LOS PARÁMETROS NO SEAN UNDEFINED
    if (!inventoryId || !equipmentId) {
      throw new Error("inventoryId o equipmentId son undefined");
    }
    
    const equipmentRef = doc(db, 'inventarios', inventoryId, 'equipos', equipmentId);
    console.log("📄 [CONTEXTO] Referencia:", equipmentRef.path);
    
    await updateDoc(equipmentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log("✅ [CONTEXTO] Equipo actualizado exitosamente");
    
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
    console.error("❌ [CONTEXTO] Error actualizando equipo:", error);
    console.error("🔥 Detalles:", error.code, error.message);
    
    return {
      success: false,
      error: `Error al actualizar equipo: ${error.message}`
    };
  } finally {
    setLoading(false);
  }
};

  // 4. ELIMINAR EQUIPO
  const deleteEquipment = async (inventoryId, equipmentId) => {
    try {
      setLoading(true);
      console.log("🗑️ Eliminando equipo:", equipmentId);
      
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
      console.error("❌ Error eliminando equipo:", error);
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
      const equipmentSnap = await getDocs(equipmentRef);
      
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
      console.error("❌ Error obteniendo equipo:", error);
      return {
        success: false,
        error: 'Error al cargar equipo'
      };
    }
  };

  // Valor del contexto
  const value = {
    // Estados
    loading,
    equipments,
    
    // Funciones CRUD
    getEquipmentsByInventory,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipment,
    
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