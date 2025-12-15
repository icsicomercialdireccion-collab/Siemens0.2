// contexts/InventoryContext.jsx
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebase/FirebaseConfig';

const InventoryContext = createContext({});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {

  const [loading, setLoading] = useState(false);
  const [userInventories, setUserInventories] = useState([]);
  const [allInventories, setAllInventories] = useState([]);

  // 1. Obtener SOLO los inventarios del usuario actual (PARA USERS)
  const getUserInventories = async () => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("👤 getUserInventories: No hay usuario autenticado");
      return [];
    }

    console.log("🔍 Buscando MIS inventarios para:", currentUser.uid);
    
    try {
      const q = query(
        collection(db, 'inventarios'),
        where('createdBy', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const inventories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("✅ Mis inventarios encontrados:", inventories.length);
      return inventories;
      
    } catch (error) {
      console.error('❌ Error obteniendo MIS inventarios:', error);
      return [];
    }
  };

  // 2. Obtener TODOS los inventarios (PARA ADMIN)
  const getAllInventories = async () => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log("👤 getAllInventories: No hay usuario autenticado");
      return [];
    }

    console.log("🔍 Buscando TODOS los inventarios (modo admin)");
    
    try {
      const q = query(collection(db, 'inventarios'));
      
      const querySnapshot = await getDocs(q);
      const inventories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("✅ TODOS los inventarios encontrados:", inventories.length);
      return inventories;
      
    } catch (error) {
      console.error('❌ Error obteniendo TODOS los inventarios:', error);
      return [];
    }
  };

  // En el useEffect, después de cargar userInventories, agrega:
  const loadAllInventories = async () => {
  const inventories = await getAllInventories();
  setAllInventories(inventories);
};

  // Cargar inventarios cuando el usuario cambie
  useEffect(() => {
    const loadInventories = async () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("👤 No hay usuario, limpiando inventarios");
        setUserInventories([]);
        setAllInventories([]);
        return;
      }
      
      console.log("🔄 Cargando inventarios para:", currentUser.email);
      
      // 1. Siempre cargar los inventarios del usuario
      const userInventories = await getUserInventories();
      setUserInventories(userInventories);

      // 2. SIEMPRE cargar TODOS los inventarios también
      // (Simplificado: ambos arrays se mantienen actualizados)
      console.log("📦 Cargando TODOS los inventarios también...");
      const allInventories = await getAllInventories();
      setAllInventories(allInventories);

    };
    
    loadInventories();
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("👤 Auth state changed:", user?.email);
      loadInventories();
    });
    
    return unsubscribe;
  }, []);

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
        mes: inventoryData.mes,
        anio: parseInt(inventoryData.anio), // ← CON 'anio' (sin ñ)
        estado: inventoryData.estado,
        localidad: inventoryData.localidad,
        
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email?.split('@')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalEquipos: 0,
        isActive: true
      };

      console.log("📝 Creando inventario:", inventoryWithMeta);
      
      const docRef = await addDoc(
        collection(db, 'inventarios'),
        inventoryWithMeta
      );

      console.log("🎉 Inventario creado ID:", docRef.id);
      
      const newInventory = {
        id: docRef.id,
        ...inventoryWithMeta
      };
      setUserInventories(prev => [...prev, newInventory]);
      setAllInventories(prev => [...prev, newInventory]);
      
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
    allInventories,
    createInventory,
    getUserInventories,
    getAllInventories,
    refreshInventories: () => getUserInventories().then(inv => {
      setUserInventories(inv);
      return inv;
    })
  };

  console.log("🔄 InventoryProvider, mis inventarios:", userInventories.length);
  console.log("🔄 InventoryProvider, todos inventarios:", allInventories.length);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};