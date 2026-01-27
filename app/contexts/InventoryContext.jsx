// contexts/InventoryContext.jsx - SIN BUCLE
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../../firebase/FirebaseConfig";

const InventoryContext = createContext({});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [loading, setLoading] = useState(true); // true inicial
  const [userInventories, setUserInventories] = useState([]);
  const [allInventories, setAllInventories] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const isMounted = useRef(true); // Para evitar updates después de desmontar

  // 🔧 FUNCIONES BÁSICAS SIN ACTUALIZAR ESTADO
  const fetchUserInventories = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, "inventarios"),
        where("createdBy", "==", currentUser.uid),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetchUserInventories:", error);
      return [];
    }
  };

  const fetchAllInventories = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const q = query(collection(db, "inventarios"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetchAllInventories:", error);
      return [];
    }
  };

  // 🔄 FUNCIÓN DE REFRESH (SEGURA)
  const refreshInventories = async () => {
    if (!isMounted.current) return;

    console.log("🔄 refreshInventories llamado");

    try {
      const [userInv, allInv] = await Promise.all([
        fetchUserInventories(),
        fetchAllInventories(),
      ]);

      if (isMounted.current) {
        setUserInventories(userInv);
        setAllInventories(allInv);
        setLastRefresh(new Date());
        console.log("✅ Inventarios actualizados");
      }

      return {
        success: true,
        userCount: userInv.length,
        allCount: allInv.length,
      };
    } catch (error) {
      console.error("❌ Error en refreshInventories:", error);
      return { success: false, error: error.message };
    }
  };

  // 📥 CARGA INICIAL (UNA SOLA VEZ)
  useEffect(() => {
    console.log("⚡ InventoryProvider montado");

    const loadInitialData = async () => {
      if (!isMounted.current) return;

      try {
        const [userInv, allInv] = await Promise.all([
          fetchUserInventories(),
          fetchAllInventories(),
        ]);

        if (isMounted.current) {
          setUserInventories(userInv);
          setAllInventories(allInv);
          setLastRefresh(new Date());
          setLoading(false);
          console.log("✅ Carga inicial completada");
        }
      } catch (error) {
        console.error("❌ Error en carga inicial:", error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    // 🔄 ESCUCHAR CAMBIOS DE AUTH (PERO SIN LLAMAR refreshInventories DIRECTAMENTE)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("👤 Auth changed:", user?.email || "No user");

      if (user && isMounted.current) {
        // En lugar de llamar refreshInventories, recargamos datos directamente
        loadInitialData();
      } else if (isMounted.current) {
        setUserInventories([]);
        setAllInventories([]);
        setLoading(false);
      }
    });

    return () => {
      console.log("🧹 InventoryProvider desmontado");
      isMounted.current = false;
      unsubscribe();
    };
  }, []); // ✅ Array vacío - se ejecuta solo una vez

  // ➕ CREAR INVENTARIO
  const createInventory = async (inventoryData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado" };
    }

    try {
      const inventoryWithMeta = {
        mes: inventoryData.mes,
        anio: parseInt(inventoryData.anio),
        estado: inventoryData.estado,
        localidad: inventoryData.localidad,
        createdBy: currentUser.uid,
        createdByName:
          currentUser.displayName || currentUser.email?.split("@")[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalEquipos: 0,
        isActive: true,
      };

      const docRef = await addDoc(
        collection(db, "inventarios"),
        inventoryWithMeta,
      );

      // Actualizar estados locales
      const newInventory = {
        id: docRef.id,
        ...inventoryWithMeta,
      };

      if (isMounted.current) {
        setUserInventories((prev) => [...prev, newInventory]);
        setAllInventories((prev) => [...prev, newInventory]);
      }

      return {
        success: true,
        id: docRef.id,
        message: "Inventario creado exitosamente",
      };
    } catch (error) {
      console.error("❌ Error createInventory:", error);
      return { success: false, error: error.message };
    }
  };

  // 🎯 VALOR DEL CONTEXTO
  const value = {
    // Estados
    loading,
    userInventories,
    allInventories,
    lastRefresh,

    // Funciones
    createInventory,
    refreshInventories,
    fetchUserInventories,
    fetchAllInventories,
  };

  console.log("🎨 InventoryProvider render - loading:", loading);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export default InventoryProvider;
