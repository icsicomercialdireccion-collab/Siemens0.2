// contexts/InventoryContext.jsx
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebase/FirebaseConfig';

const InventoryContext = createContext({});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [userInventories, setUserInventories] = useState([]);

  // Obtener inventarios del usuario actual
  const getUserInventories = async () => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("👤 getUserInventories: No hay usuario autenticado");
      return [];
    }

    console.log("🔍 Buscando inventarios para:", currentUser.uid);
    
    try {
      const q = query(
        collection(db, 'inventories'),
        where('createdBy', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const inventories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("✅ Inventarios encontrados:", inventories.length);
      return inventories;
      
    } catch (error) {
      console.error('❌ Error obteniendo inventarios:', error);
      return [];
    }
  };

  // Cargar inventarios cuando el usuario cambie
  useEffect(() => {
    const loadInventories = async () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("👤 No hay usuario, limpiando inventarios");
        setUserInventories([]);
        return;
      }
      
      console.log("🔄 Cargando inventarios para:", currentUser.email);
      const inventories = await getUserInventories();
      setUserInventories(inventories);
    };
    
    loadInventories();
    
    // Escuchar cambios de autenticación
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("👤 Auth state changed:", user?.email);
      loadInventories();
    });
    
    return unsubscribe;
  }, []); // Solo se ejecuta una vez al montar

  // Crear nuevo inventario
  const createInventory = async (inventoryData) => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("❌ createInventory: Usuario no autenticado");
      return { success: false, error: 'Usuario no autenticado' };
    }

    console.log("✅ createInventory: Usuario válido:", currentUser.uid);
    
    setLoading(true);
    
    try {
      const inventoryWithMeta = {
        // Datos del formulario
        mes: inventoryData.mes,
        anio: parseInt(inventoryData.anio),
        estado: inventoryData.estado,
        localidad: inventoryData.localidad,
        
        // Metadatos
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email?.split('@')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalEquipos: 0,
        isActive: true
      };

      console.log("📝 Creando inventario:", inventoryWithMeta);
      
      const docRef = await addDoc(
        collection(db, 'inventarios'), // Cambia a 'inventarios' si es diferente
        inventoryWithMeta
      );

      console.log("🎉 Inventario creado ID:", docRef.id);
      
      // Actualizar la lista local
      const newInventory = {
        id: docRef.id,
        ...inventoryWithMeta
      };
      setUserInventories(prev => [...prev, newInventory]);
      
      return { 
        success: true, 
        id: docRef.id,
        message: 'Inventario creado exitosamente' 
      };
      
    } catch (error) {
      console.error('❌ Error creando inventario:', error);
      return { 
        success: false, 
        error: error.message || 'Error al crear inventario' 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    userInventories,
    createInventory,
    getUserInventories,
    refreshInventories: () => getUserInventories().then(inv => {
      setUserInventories(inv);
      return inv;
    })
  };

  console.log("🔄 InventoryProvider render, inventarios:", userInventories.length);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};