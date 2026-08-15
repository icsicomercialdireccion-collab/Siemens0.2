// app/contexts/EquipmentContext.jsx - VERSIÓN CON NUEVOS CAMPOS
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { db, storage } from "../../firebase/FirebaseConfig";

const EquipmentContext = createContext({});

export const useEquipment = () => useContext(EquipmentContext);

export const EquipmentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Verificar si el serial ya existe en el inventario
  const checkSerialExists = useCallback(async (inventoryId, serial) => {
    try {
      const q = query(
        collection(db, "inventarios", inventoryId, "equipos"),
        where("serial", "==", serial.toUpperCase()),
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("❌ Error verificando serial:", error);
      return false;
    }
  }, []);

  // 1. OBTENER EQUIPOS DE UN INVENTARIO (CON NUEVOS CAMPOS)
  const getEquipmentsByInventory = useCallback(async (inventoryId) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "inventarios", inventoryId, "equipos"),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);

      const equipmentsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        let createdAt = new Date();
        let updatedAt = new Date();

        if (data.createdAt?.toDate) createdAt = data.createdAt.toDate();
        else if (data.createdAt) createdAt = new Date(data.createdAt);

        if (data.updatedAt?.toDate) updatedAt = data.updatedAt.toDate();
        else if (data.updatedAt) updatedAt = new Date(data.updatedAt);

        return {
          id: doc.id,
          serial: data.serial || "Sin serial",
          perfil: data.perfil || "Standard",
          ubicacion: data.ubicacion || "",
          estado: data.estado || "nuevo",
          esquema: data.esquema || "Activo Fijo",
          observaciones: data.observaciones || "",
          nota: data.nota || "",
          tipo: data.tipo || "computadora",
          imagenUrl: data.imagenUrl || null,
          imagenFileName: data.imagenFileName || null,
          createdAt: createdAt,
          updatedAt: updatedAt,
        };
      });

      setEquipments(equipmentsList);
      return equipmentsList;
    } catch (error) {
      console.error("❌ Error obteniendo equipos:", error);
      Alert.alert("Error", "No se pudieron cargar los equipos");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  //COMPRESION DE IMAGENES
  const uploadImageToStorage = useCallback(
    async (imageUri, inventoryId, serial) => {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();

        if (blob.size > 5 * 1024 * 1024) {
          throw new Error(
            "La imagen es demasiado grande. Por favor, toma otra foto.",
          );
        }

        const cleanSerial = serial
          .toString()
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "_")
          .substring(0, 50);

        const fileName = `equipos/${inventoryId}/${cleanSerial}_${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob, {
          contentType: "image/jpeg",
          customMetadata: { serial, inventoryId, compressed: "true" },
        });

        const downloadURL = await getDownloadURL(storageRef);
        return { url: downloadURL, fileName };
      } catch (error) {
        console.error("❌ Error subiendo imagen:", error.message);
        return null;
      }
    },
    [],
  );

  // 2. CREAR NUEVO EQUIPO (CON NUEVOS CAMPOS)
  const createEquipment = useCallback(
    async (inventoryId, equipmentData) => {
      try {
        setLoading(true);

        if (!equipmentData.serial || !equipmentData.serial.trim()) {
          throw new Error("El número de serie es requerido");
        }

        const serial = equipmentData.serial.trim().toUpperCase();

        // Validar serial duplicado
        const serialExists = await checkSerialExists(inventoryId, serial);
        if (serialExists) {
          Alert.alert(
            "⚠️ Serial Duplicado",
            `El equipo con serial ${serial} ya existe en este inventario.`,
            [{ text: "OK" }],
          );
          return {
            success: false,
            error: `El serial ${serial} ya está registrado`,
            code: "DUPLICATE_SERIAL",
          };
        }

        let finalImageUrl = null;
        let imageFileName = null;

        if (equipmentData.imagenUrl) {
          try {
            const imageResult = await uploadImageToStorage(
              equipmentData.imagenUrl,
              inventoryId,
              serial,
            );
            if (imageResult) {
              finalImageUrl = imageResult.url;
              imageFileName = imageResult.fileName;
            }
          } catch (error) {
            console.log("⚠️ Error en imagen, continuando con registro...");
          }
        }

        const now = new Date();
        const equipmentWithMeta = {
          serial: serial,
          perfil: equipmentData.perfil || "Standard",
          ubicacion: equipmentData.ubicacion || "",
          estado: equipmentData.estado || "nuevo",
          esquema: equipmentData.esquema || "Activo Fijo",
          observaciones: equipmentData.observaciones || "",
          nota: equipmentData.nota || "",
          tipo: equipmentData.tipo || "computadora",
          imagenUrl: finalImageUrl,
          imagenFileName: imageFileName,
          inventoryId: inventoryId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: "active",
          lastImageUpdate: finalImageUrl ? serverTimestamp() : null,
          createdAtTimestamp: Date.now(),
        };

        const equipmentRef = await addDoc(
          collection(db, "inventarios", inventoryId, "equipos"),
          equipmentWithMeta,
        );

        // Actualizar contador del inventario
        try {
          const inventoryRef = doc(db, "inventarios", inventoryId);
          await updateDoc(inventoryRef, {
            totalEquipos: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch (counterError) {
          console.warn("Error actualizando contador:", counterError);
        }

        const newEquipment = {
          id: equipmentRef.id,
          ...equipmentWithMeta,
          createdAt: now,
          updatedAt: now,
          createdAtTimestamp: now.getTime(),
        };

        setEquipments((prev) => [newEquipment, ...prev]);

        return {
          success: true,
          id: equipmentRef.id,
          message: finalImageUrl
            ? "Equipo creado con imagen"
            : "Equipo creado sin imagen",
          data: newEquipment,
          hasImage: !!finalImageUrl,
        };
      } catch (error) {
        console.error("Error creando equipo:", error);
        let errorMessage = "Error al crear equipo";
        if (error.message.includes("serial"))
          errorMessage = "El número de serie es requerido";
        else if (error.code === "permission-denied")
          errorMessage = "No tienes permisos para crear equipos";
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [checkSerialExists, uploadImageToStorage],
  );

  // 5. OBTENER UN EQUIPO ESPECÍFICO (CON NUEVOS CAMPOS)
  const getEquipment = useCallback(async (inventoryId, equipmentId) => {
    try {
      if (!inventoryId || !equipmentId) {
        return { success: false, error: "IDs inválidos" };
      }

      const equipmentRef = doc(
        db,
        "inventarios",
        inventoryId,
        "equipos",
        equipmentId,
      );
      const equipmentSnap = await getDoc(equipmentRef);

      if (equipmentSnap.exists()) {
        const data = equipmentSnap.data();
        const processedData = {
          id: equipmentSnap.id,
          serial: data.serial || "Sin serial",
          perfil: data.perfil || "Standard",
          ubicacion: data.ubicacion || "",
          estado: data.estado || "nuevo",
          esquema: data.esquema || "Activo Fijo",
          observaciones: data.observaciones || "",
          nota: data.nota || "",
          tipo: data.tipo || "computadora",
          imagenUrl: data.imagenUrl || null,
          imagenFileName: data.imagenFileName || null,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
        return { success: true, data: processedData };
      }
      return { success: false, error: "Equipo no encontrado" };
    } catch (error) {
      console.error("Error en getEquipment:", error);
      return { success: false, error: "Error al cargar equipo" };
    }
  }, []);

  // 3. ACTUALIZAR EQUIPO (CON NUEVOS CAMPOS)
  const updateEquipment = useCallback(
    async (inventoryId, equipmentId, updates) => {
      try {
        setLoading(true);

        console.log("📥 updateEquipment recibió:", {
          inventoryId,
          equipmentId,
          updates,
        });

        if (updates.serial) {
          const newSerial = updates.serial.trim().toUpperCase();
          const currentEquipment = await getEquipment(inventoryId, equipmentId);
          if (
            currentEquipment.success &&
            currentEquipment.data.serial !== newSerial
          ) {
            const serialExists = await checkSerialExists(
              inventoryId,
              newSerial,
            );
            if (serialExists) {
              Alert.alert(
                "⚠️ Serial Duplicado",
                `El serial ${newSerial} ya está en uso por otro equipo`,
                [{ text: "OK" }],
              );
              return {
                success: false,
                error: `El serial ${newSerial} ya está registrado`,
                code: "DUPLICATE_SERIAL",
              };
            }
          }
          updates.serial = newSerial;
        }

        const equipmentRef = doc(
          db,
          "inventarios",
          inventoryId,
          "equipos",
          equipmentId,
        );
        const updateData = { ...updates, updatedAt: serverTimestamp() };
        await updateDoc(equipmentRef, updateData);

        setEquipments((prev) =>
          prev.map((eq) =>
            eq.id === equipmentId
              ? { ...eq, ...updates, updatedAt: new Date() }
              : eq,
          ),
        );

        return { success: true, message: "Equipo actualizado exitosamente" };
      } catch (error) {
        console.error("Error actualizando equipo:", error);
        return { success: false, error: "Error al actualizar equipo" };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 4. ELIMINAR EQUIPO
  const deleteEquipment = useCallback(async (inventoryId, equipmentId) => {
    try {
      setLoading(true);
      const equipmentRef = doc(
        db,
        "inventarios",
        inventoryId,
        "equipos",
        equipmentId,
      );
      await deleteDoc(equipmentRef);

      const inventoryRef = doc(db, "inventarios", inventoryId);
      await updateDoc(inventoryRef, {
        totalEquipos: increment(-1),
        updatedAt: serverTimestamp(),
      });

      setEquipments((prev) => prev.filter((eq) => eq.id !== equipmentId));
      return { success: true, message: "Equipo eliminado exitosamente" };
    } catch (error) {
      console.error("Error eliminando equipo:", error);
      return { success: false, error: "Error al eliminar equipo" };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearEquipments = useCallback(() => setEquipments([]), []);

  const refreshEquipments = useCallback(
    (inventoryId) => getEquipmentsByInventory(inventoryId),
    [getEquipmentsByInventory],
  );

  const value = useMemo(
    () => ({
      loading,
      equipments,
      uploadProgress,
      getEquipmentsByInventory,
      createEquipment,
      updateEquipment,
      deleteEquipment,
      getEquipment,
      uploadImageToStorage,
      checkSerialExists,
      refreshEquipments,
      clearEquipments,
    }),
    [
      loading,
      equipments,
      uploadProgress,
      getEquipmentsByInventory,
      createEquipment,
      updateEquipment,
      deleteEquipment,
      getEquipment,
      uploadImageToStorage,
      checkSerialExists,
      refreshEquipments,
      clearEquipments,
    ],
  );

  return (
    <EquipmentContext.Provider value={value}>
      {children}
    </EquipmentContext.Provider>
  );
};

export default EquipmentProvider;
