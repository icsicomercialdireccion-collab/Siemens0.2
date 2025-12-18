// app/(details)/[id].jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/FirebaseConfig";
import { useEquipment } from "../contexts/EquipmentContext";

import { Ionicons } from "@expo/vector-icons";
import { detailStyle } from "../../assets/styles/details.style";
import { COLORS } from "../../constants/colors";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams(); // ← Recibe el ID dinámico
  const {
    equipments,
    getEquipmentsByInventory,
    loading: equipmentsLoading,
  } = useEquipment();

  const router = useRouter();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("📱 DetailsScreen - ID recibido:", id);

  useEffect(() => {
    if (id) {
      loadInventory();
      getEquipmentsByInventory(id)
    }
  }, [id]);

  const loadInventory = async () => {
    try {
      console.log("🔍 Cargando inventario ID:", id);
      const inventoryRef = doc(db, "inventarios", id);
      const inventorySnap = await getDoc(inventoryRef);

      if (inventorySnap.exists()) {
        const data = inventorySnap.data();
        console.log("✅ Inventario encontrado:", data.mes, data.anio);
        setInventory({
          id: inventorySnap.id,
          ...data,
        });
      } else {
        console.log("❌ Inventario no encontrado");
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      <TouchableOpacity
        style={detailStyle.fab}
        onPress={() => router.push(`/(forms)/pcForm?inventoryId=${id}`)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
