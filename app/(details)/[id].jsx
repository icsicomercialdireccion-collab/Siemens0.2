// app/(details)/[id].jsx - VERSIÓN CON DOS FABS Y EXPORTACIÓN
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/FirebaseConfig";
import { useEquipment } from "../contexts/EquipmentContext";

import { Ionicons } from "@expo/vector-icons";
import { detailStyle } from "../../assets/styles/details.style";
import { COLORS } from "../../constants/colors";
import EquipmentList from "../components/EquipmentList";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const {
    equipments,
    getEquipmentsByInventory,
    deleteEquipment,
    loading: equipmentsLoading,
  } = useEquipment();

  const router = useRouter();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para exportación
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState(null);

  useEffect(() => {
    if (id) {
      loadInventory();
      getEquipmentsByInventory(id);
    }
  }, [id]);

  const loadInventory = async () => {
    try {
      const inventoryRef = doc(db, "inventarios", id);
      const inventorySnap = await getDoc(inventoryRef);

      if (inventorySnap.exists()) {
        const data = inventorySnap.data();
        setInventory({
          id: inventorySnap.id,
          ...data,
        });
      }
    } catch (error) {
      // Error silencioso, se maneja en la UI
    } finally {
      setLoading(false);
    }
  };

  const loadEquipments = () => {
    if (id) {
      getEquipmentsByInventory(id);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadInventory(), loadEquipments()]);
    setRefreshing(false);
  }, [id]);

  const handleDeleteEquipment = async (inventoryId, equipmentId) => {
    try {
      const result = await deleteEquipment(inventoryId, equipmentId);
      if (!result.success) {
        // Manejar error si es necesario
      }
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };

  const handleViewEquipment = (equipment) => {
    router.push({
      pathname: "/(equipment-detail)/[id]",
      params: {
        id: equipment.id,
        inventoryId: id,
        equipmentData: JSON.stringify(equipment),
      },
    });
  };

  // ================== FUNCIÓN DE EXPORTACIÓN ==================
  const exportInventory = async () => {
    if (!id || equipments.length === 0) {
      Alert.alert("Error", "No hay equipos para exportar");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setShowExportModal(true);

    try {
      // Simular progreso inicial
      setExportProgress(10);

      // 1. Llamar a la función de Firebase
      const functionUrl = `https://us-central1-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/exportInventory`;

      setExportProgress(30);

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryId: id,
          totalEquipos: equipments.length,
        }),
      });

      setExportProgress(60);

      const data = await response.json();

      if (data.success) {
        setExportProgress(90);

        const downloadUrl = data.data?.exportacion?.downloadUrl;

        if (!downloadUrl) {
          return;
        }

        // VALIDAR QUE SEA UNA URL VÁLIDA
        if (
          typeof downloadUrl !== "string" ||
          !downloadUrl.startsWith("http")
        ) {
          console.error("URL inválida recibida:", downloadUrl);
          Alert.alert(
            "Error",
            "La URL de descarga no es válida. Verifica en Firebase Storage.",
            [{ text: "OK" }]
          );
          return;
        }

        setLastExportUrl(downloadUrl);
      } else {
        Alert.alert("Error", data.error || "Error al exportar");
        setShowExportModal(false);
      }
    } catch (error) {
      setShowExportModal(false);
    } finally {
      setExportProgress(100);
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  // ================== MODAL DE EXPORTACIÓN ==================
  const ExportModal = () => (
    <Modal
      transparent={true}
      visible={showExportModal}
      animationType="fade"
      onRequestClose={() => !exporting && setShowExportModal(false)}
    >
      <View style={detailStyle.modalOverlay}>
        <View style={detailStyle.modalContainer}>
          <Text style={detailStyle.modalTitle}>
            {exporting ? "Exportando Inventario" : "Exportación Completada"}
          </Text>

          {exporting ? (
            <>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={detailStyle.modalText}>
                Procesando {equipments.length} equipos...
              </Text>
              <View style={detailStyle.progressBar}>
                <View
                  style={[
                    detailStyle.progressFill,
                    { width: `${exportProgress}%` },
                  ]}
                />
              </View>
              <Text style={detailStyle.progressText}>{exportProgress}%</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              <Text style={detailStyle.modalText}>
                ¡Inventario exportado exitosamente!
              </Text>
              <TouchableOpacity
                style={detailStyle.modalButton}
                onPress={() => {
                  if (lastExportUrl) {
                    Linking.openURL(lastExportUrl);
                  }
                  setShowExportModal(false);
                }}
              >
                <Text style={detailStyle.modalButtonText}>Descargar Excel</Text>
              </TouchableOpacity>
            </>
          )}

          {!exporting && (
            <TouchableOpacity
              style={[
                detailStyle.modalButton,
                detailStyle.modalButtonSecondary,
              ]}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={detailStyle.modalButtonTextSecondary}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  // ================== RENDER LOADING ==================
  if (loading && !refreshing) {
    return (
      <View style={detailStyle.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={detailStyle.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  // ================== RENDER ERROR ==================
  if (!inventory) {
    return (
      <View style={detailStyle.centered}>
        <Text style={detailStyle.errorText}>Inventario no encontrado</Text>
        <TouchableOpacity
          style={detailStyle.button}
          onPress={() => router.back()}
        >
          <Text style={detailStyle.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ================== RENDER PRINCIPAL ==================
  return (
    <View style={detailStyle.container}>
      {/* Header del inventario */}
      <Text style={detailStyle.title}>
        {inventory.mes} {inventory.anio}
      </Text>
      <Text style={detailStyle.info}>Localidad: {inventory.localidad}</Text>
      <Text style={detailStyle.info}>Estado: {inventory.estado}</Text>
      <Text style={detailStyle.info}>
        Total equipos: {inventory.totalEquipos || equipments.length}
      </Text>

      {/* Sección de equipos */}
      <View style={detailStyle.equipmentSection}>
        <View style={detailStyle.sectionHeader}>
          <Text style={detailStyle.sectionTitle}>Equipos registrados</Text>
          <TouchableOpacity
            style={detailStyle.filterButton}
            onPress={() => {
              /* Implementar filtros */
            }}
          >
            <Ionicons name="filter-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <EquipmentList
          equipments={equipments}
          loading={equipmentsLoading}
          inventoryId={id}
          onRefresh={onRefresh}
          onPressEquipment={handleViewEquipment}
          onDeleteEquipment={handleDeleteEquipment}
        />
      </View>

      {/* ============== BOTONES FLOTANTES ============== */}
      <View style={detailStyle.fabContainer}>
        {/* Botón flotante para EXPORTAR (ARRIBA) */}
        <TouchableOpacity
          style={[detailStyle.fab, detailStyle.fabTop]}
          onPress={exportInventory}
          disabled={exporting || equipments.length === 0}
          activeOpacity={0.8}
        >
          <Ionicons
            name={exporting ? "refresh" : "download"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Botón flotante para AGREGAR equipo (ABAJO) */}
        <TouchableOpacity
          style={[detailStyle.fab, detailStyle.fabBottom]}
          onPress={() => router.push(`/(forms)/pcForm?inventoryId=${id}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de exportación */}
      <ExportModal />
    </View>
  );
}
