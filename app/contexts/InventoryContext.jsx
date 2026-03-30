// contexts/InventoryContext.jsx - VERSIÓN CORREGIDA Y OPTIMIZADA

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
import { useAuth } from "./AutContext";

const InventoryContext = createContext({});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [userInventories, setUserInventories] = useState([]);
  const [allInventories, setAllInventories] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const isMounted = useRef(true);
  const { user, userData } = useAuth();

  // ==================== FUNCIONES BÁSICAS ====================

  const fetchUserInventories = async (userId) => {
    if (!userId) return [];

    try {
      // 👇 QUITAR orderBy TEMPORALMENTE
      const q = query(
        collection(db, "inventarios"),
        where("createdBy", "==", userId),
        // orderBy("updatedAt", "desc")  // 👈 COMENTAR ESTA LÍNEA
      );

      const snapshot = await getDocs(q);

      // Ordenar manualmente en el cliente
      const inventories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));

      // 👈 ORDENAR MANUALMENTE (más reciente primero)
      return inventories.sort((a, b) => {
        const dateA =
          a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB =
          b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB - dateA; // Descendente
      });
    } catch (error) {
      console.error("❌ Error fetchUserInventories:", error);
      return [];
    }
  };

  const fetchAllInventories = async () => {
    try {
      console.log("🔍 Buscando TODOS los inventarios (admin)");

      // 👈 SIN orderBy en la consulta (para evitar crear otro índice)
      const q = query(collection(db, "inventarios"));

      const snapshot = await getDocs(q);

      console.log(`📊 Encontrados ${snapshot.docs.length} documentos en total`);

      const inventories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));

      // 👈 ORDENAR MANUALMENTE EN EL CLIENTE (más reciente primero)
      const sortedInventories = inventories.sort((a, b) => {
        const dateA =
          a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB =
          b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB - dateA; // Descendente
      });

      console.log(`📊 Inventarios ordenados: ${sortedInventories.length}`);

      return sortedInventories;
    } catch (error) {
      console.error("Error fetchAllInventories:", error);
      return [];
    }
  };

  // ==================== FUNCIÓN PRINCIPAL DE CARGA ====================

  const loadInventories = async () => {
    console.log("📥 [INVENTORY] loadInventories INICIADO");
    console.log("  - user?.uid:", user?.uid);
    console.log("  - userData?.role:", userData?.role);

    // Caso 1: No hay usuario
    if (!user) {
      console.log("❌ No hay usuario, limpiando inventarios");
      setUserInventories([]);
      setAllInventories([]);
      setInitialized(true);
      setLoading(false);
      return;
    }

    // Caso 2: Hay usuario pero no userData - esperar
    if (user && !userData) {
      console.log("⏳ Esperando userData...");
      setLoading(true);
      setInitialized(false);
      return;
    }

    // Caso 3: Hay usuario y userData - cargar inventarios
    try {
      setLoading(true);
      console.log("📥 Cargando inventarios para:", user.uid);

      const userInv = await fetchUserInventories(user.uid);
      const isAdmin = userData?.role === "admin";
      const allInv = isAdmin ? await fetchAllInventories() : [];

      if (isMounted.current) {
        console.log("✅ [INVENTORY] Inventarios cargados:", {
          user: userInv.length,
          all: allInv.length,
          role: userData?.role,
        });

        setUserInventories(userInv);
        setAllInventories(allInv);
        setLastRefresh(new Date());
        setInitialized(true);
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error en loadInventories:", error);
      if (isMounted.current) {
        setInitialized(true);
        setLoading(false);
      }
    }
  };

  // ==================== EFECTO PRINCIPAL ====================
  // Se ejecuta cuando cambia el usuario o su rol
  useEffect(() => {
    console.log("📦 [INVENTORY] Efecto principal disparado:", {
      hasUser: !!user,
      hasUserData: !!userData,
      userId: user?.uid,
    });

    loadInventories();
  }, [user?.uid, userData?.role]);

  // ==================== EFECTO DE INICIALIZACIÓN ====================
  // Solo se ejecuta UNA VEZ al montar el componente
  useEffect(() => {
    console.log("⚡ InventoryProvider montado");

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log("👤 Auth changed:", authUser?.email || "No user");

      if (authUser && isMounted.current) {
        // Si hay usuario autenticado, cargar inventarios
        loadInventories();
      } else if (!authUser && isMounted.current) {
        // Sin usuario, limpiar todo
        setUserInventories([]);
        setAllInventories([]);
        setInitialized(true);
        setLoading(false);
      }
    });

    return () => {
      console.log("🧹 InventoryProvider desmontado");
      isMounted.current = false;
      unsubscribe();
    };
  }, []); // Array vacío = solo una vez

  // ==================== REFRESH INVENTARIOS ====================

  const refreshInventories = async () => {
    console.log("🔄 refreshInventories llamado");

    if (!isMounted.current) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("⚠️ No hay usuario autenticado para refrescar");
      return { success: false, error: "No hay usuario autenticado" };
    }

    try {
      const userId = currentUser.uid;
      console.log("🔄 Refrescando inventarios para:", userId);

      const userInv = await fetchUserInventories(userId);
      const isAdmin = userData?.role === "admin";
      const allInv = isAdmin ? await fetchAllInventories() : [];

      if (isMounted.current) {
        setUserInventories(userInv);
        setAllInventories(allInv);
        setLastRefresh(new Date());
        console.log("✅ Inventarios actualizados:", {
          user: userInv.length,
          all: allInv.length,
          isAdmin,
        });
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

  // ==================== CREAR INVENTARIO ====================

  const createInventory = async (inventoryData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado" };
    }

    try {
      console.log("📝 Creando inventario para usuario:", currentUser.uid);

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

      console.log("✅ Inventario creado en Firebase, ID:", docRef.id);

      const newInventory = {
        id: docRef.id,
        mes: inventoryData.mes,
        anio: parseInt(inventoryData.anio),
        estado: inventoryData.estado,
        localidad: inventoryData.localidad,
        createdBy: currentUser.uid,
        createdByName:
          currentUser.displayName || currentUser.email?.split("@")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalEquipos: 0,
        isActive: true,
      };

      if (isMounted.current) {
        // Actualizar inventarios del usuario
        setUserInventories((prev) => {
          const updated = [newInventory, ...prev];
          console.log("📊 userInventories actualizado:", updated.length);
          return updated;
        });

        // Si es admin, actualizar todos los inventarios
        if (userData?.role === "admin") {
          setAllInventories((prev) => {
            const updated = [newInventory, ...prev];
            console.log("📊 allInventories actualizado:", updated.length);
            return updated;
          });
        }

        setLastRefresh(new Date());
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

  // ==================== VALOR DEL CONTEXTO ====================

  const value = {
    // Estados
    loading,
    userInventories,
    allInventories,
    lastRefresh,
    initialized,

    // Funciones
    createInventory,
    refreshInventories,
    fetchUserInventories,
    fetchAllInventories,
  };

  console.log(
    "🎨 InventoryProvider render - loading:",
    loading,
    "init:",
    initialized,
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export default InventoryProvider;
