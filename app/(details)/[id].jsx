// app/(details)/[id].jsx - VERSIÓN LIMPIA
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

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
      // Pasar toda la data necesaria
      equipmentData: JSON.stringify(equipment),
        inventoryId: id,
        
      },
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={detailStyle.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={detailStyle.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

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

  return (
    <View style={detailStyle.container}>
      <Text style={detailStyle.title}>
        {inventory.mes} {inventory.anio}
      </Text>
      <Text style={detailStyle.info}>Localidad: {inventory.localidad}</Text>
      <Text style={detailStyle.info}>Estado: {inventory.estado}</Text>
      <Text style={detailStyle.info}>
        Total equipos: {inventory.totalEquipos || 0}
      </Text>

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

      <TouchableOpacity
        style={detailStyle.fab}
        onPress={() => router.push(`/(forms)/pcForm?inventoryId=${id}`)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
