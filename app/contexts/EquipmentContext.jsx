// app/contexts/EquipmentContext.jsx - VERSIÓN CON VALIDACIÓN Y ORDEN
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
import { createContext, useContext, useState } from "react";
import { Alert } from "react-native";
import { db, storage } from "../../firebase/FirebaseConfig";

const EquipmentContext = createContext({});

export const useEquipment = () => useContext(EquipmentContext);

export const EquipmentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 🔥 NUEVA FUNCIÓN: Verificar si el serial ya existe en el inventario
  const checkSerialExists = async (inventoryId, serial) => {
    try {
      console.log("🔍 Verificando serial duplicado:", serial);

      const q = query(
        collection(db, "inventarios", inventoryId, "equipos"),
        where("serial", "==", serial.toUpperCase()),
      );

      const snapshot = await getDocs(q);
      const exists = !snapshot.empty;

      if (exists) {
        console.log("⚠️ Serial ya existe:", serial);
      } else {
        console.log("✅ Serial disponible:", serial);
      }

      return exists;
    } catch (error) {
      console.error("❌ Error verificando serial:", error);
      return false;
    }
  };

  // 1. OBTENER EQUIPOS DE UN INVENTARIO (CON ORDEN)
  const getEquipmentsByInventory = async (inventoryId) => {
    try {
      setLoading(true);
      console.log("📋 Obteniendo equipos para inventario:", inventoryId);

      // 👈 AGREGAR orderBy para ordenar por fecha de creación (más reciente primero)
      const q = query(
        collection(db, "inventarios", inventoryId, "equipos"),
        orderBy("createdAt", "desc"), // 👈 DESC = más reciente primero
      );

      const querySnapshot = await getDocs(q);
      console.log(`📊 ${querySnapshot.docs.length} equipos encontrados`);

      const equipmentsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        let createdAt = new Date();
        let updatedAt = new Date();

        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt);
        }

        if (data.updatedAt?.toDate) {
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt) {
          updatedAt = new Date(data.updatedAt);
        }

        return {
          id: doc.id,
          serial: data.serial || "Sin serial",
          estado: data.estado || "nuevo",
          observaciones: data.observaciones || "",
          tipo: data.tipo || "computadora",
          imagenUrl: data.imagenUrl || null,
          imagenFileName: data.imagenFileName || null,
          createdAt: data.createdAt?.toDate?.() || new Date(),
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
  };

  // 2. CREAR NUEVO EQUIPO (CON VALIDACIÓN DE SERIAL DUPLICADO)
  const createEquipment = async (inventoryId, equipmentData) => {
    try {
      setLoading(true);

      // Validación básica
      if (!equipmentData.serial || !equipmentData.serial.trim()) {
        throw new Error("El número de serie es requerido");
      }

      const serial = equipmentData.serial.trim().toUpperCase();

      // 🔥 VALIDAR SERIAL DUPLICADO
      const serialExists = await checkSerialExists(inventoryId, serial);

      if (serialExists) {
        Alert.alert(
          "⚠️ Serial Duplicado",
          `El equipo con serial ${serial} ya existe en este inventario.\n\n¿Deseas registrar otro equipo?`,
          [{ text: "OK" }],
        );
        return {
          success: false,
          error: `El serial ${serial} ya está registrado en este inventario`,
          code: "DUPLICATE_SERIAL",
        };
      }

      let finalImageUrl = null;
      let imageFileName = null;

      // Subir imagen si es URI local
      if (
        equipmentData.imagenUrl &&
        equipmentData.imagenUrl.startsWith("file://")
      ) {
        try {
          const imageResult = await uploadImageToStorage(
            equipmentData.imagenUrl,
            inventoryId,
            serial,
          );
          finalImageUrl = imageResult.url;
          imageFileName = imageResult.fileName;
        } catch (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          Alert.alert(
            "Aviso",
            "Equipo creado pero no se pudo subir la imagen",
            [{ text: "OK" }],
          );
        }
      } else if (
        equipmentData.imagenUrl &&
        equipmentData.imagenUrl.includes("firebasestorage.googleapis.com")
      ) {
        finalImageUrl = equipmentData.imagenUrl;
      }

      // Preparar datos para Firestore
      const now = new Date();
      const equipmentWithMeta = {
        serial: serial,
        estado: equipmentData.estado || equipmentData.notas || "nuevo",
        observaciones: equipmentData.observaciones || "",
        tipo: equipmentData.tipo || "computadora",
        imagenUrl: finalImageUrl,
        imagenFileName: imageFileName,
        inventoryId: inventoryId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        lastImageUpdate: finalImageUrl ? serverTimestamp() : null,
        // 👈 AGREGAR timestamp numérico para ordenar más fácil
        createdAtTimestamp: Date.now(),
      };

      // Guardar en Firestore
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

      // Preparar respuesta con fecha actual
      const newEquipment = {
        id: equipmentRef.id,
        ...equipmentWithMeta,
        createdAt: now,
        updatedAt: now,
        createdAtTimestamp: now.getTime(),
      };

      // 👈 AGREGAR AL INICIO DEL ARRAY (más reciente primero)
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
      if (error.message.includes("serial")) {
        errorMessage = "El número de serie es requerido";
      } else if (error.code === "permission-denied") {
        errorMessage = "No tienes permisos para crear equipos";
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // 3. ACTUALIZAR EQUIPO (CON VALIDACIÓN DE SERIAL DUPLICADO)
  const updateEquipment = async (inventoryId, equipmentId, updates) => {
    try {
      setLoading(true);

      // Si se está actualizando el serial, verificar que no exista otro
      if (updates.serial) {
        const newSerial = updates.serial.trim().toUpperCase();

        // Obtener el equipo actual para comparar
        const currentEquipment = await getEquipment(inventoryId, equipmentId);

        // Solo verificar si el serial es diferente al actual
        if (
          currentEquipment.success &&
          currentEquipment.data.serial !== newSerial
        ) {
          const serialExists = await checkSerialExists(inventoryId, newSerial);

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

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(), // 👈 Esto debe estar
      };

      await updateDoc(equipmentRef, updateData);

      // Actualizar estado local manteniendo el orden
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === equipmentId
            ? { ...eq, ...updates, updatedAt: new Date() }
            : eq,
        ),
      );

      return {
        success: true,
        message: "Equipo actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error actualizando equipo:", error);
      return {
        success: false,
        error: "Error al actualizar equipo",
      };
    } finally {
      setLoading(false);
    }
  };

  // 4. ELIMINAR EQUIPO
  const deleteEquipment = async (inventoryId, equipmentId) => {
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

      return {
        success: true,
        message: "Equipo eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error eliminando equipo:", error);
      return {
        success: false,
        error: "Error al eliminar equipo",
      };
    } finally {
      setLoading(false);
    }
  };

  // 5. OBTENER UN EQUIPO ESPECÍFICO
  const getEquipment = async (inventoryId, equipmentId) => {
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
          estado: data.estado || "nuevo",
          observaciones: data.observaciones || "",
          tipo: data.tipo || "computadora",
          imagenUrl: data.imagenUrl || null,
          imagenFileName: data.imagenFileName || null,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          ...Object.keys(data).reduce((acc, key) => {
            if (!["createdAt", "updatedAt"].includes(key)) {
              acc[key] = data[key];
            }
            return acc;
          }, {}),
        };

        return { success: true, data: processedData };
      }

      return { success: false, error: "Equipo no encontrado" };
    } catch (error) {
      console.error("Error en getEquipment:", error);
      return { success: false, error: "Error al cargar equipo" };
    }
  };

  // FUNCIÓN PARA SUBIR IMAGEN A STORAGE
  const uploadImageToStorage = async (imageUri, inventoryId, serial) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const cleanSerial = serial
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")
        .substring(0, 50);

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 6);
      const fileName = `equipos/${inventoryId}/${cleanSerial}_${timestamp}_${randomString}.jpg`;

      if (!blob.type.startsWith("image/")) {
        throw new Error("El archivo no es una imagen válida");
      }

      if (blob.size > 5 * 1024 * 1024) {
        throw new Error("La imagen es muy grande (máximo 5MB)");
      }

      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob, {
        contentType: blob.type,
        customMetadata: {
          serial: serial,
          inventoryId: inventoryId,
          uploadedAt: new Date().toISOString(),
        },
      });

      const downloadURL = await getDownloadURL(storageRef);

      return {
        url: downloadURL,
        fileName: fileName,
        serial: serial,
      };
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      throw new Error(`No se pudo subir la imagen: ${error.message}`);
    }
  };

  // VALOR DEL CONTEXTO
  const value = {
    loading,
    equipments,
    uploadProgress,
    getEquipmentsByInventory,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipment,
    uploadImageToStorage,
    checkSerialExists, // 👈 EXPORTAR para uso externo
    refreshEquipments: (inventoryId) => getEquipmentsByInventory(inventoryId),
    clearEquipments: () => setEquipments([]),
  };

  return (
    <EquipmentContext.Provider value={value}>
      {children}
    </EquipmentContext.Provider>
  );
};

export default EquipmentProvider;
