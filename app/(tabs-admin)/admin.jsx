import { homeStyles } from "@/assets/styles/home.style";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { authStyles } from "../../assets/styles/auth.styles";
import InventoryCard from "../components/cardInventory";
import { useInventory } from "../contexts/InventoryContext";

const AdminScreen = () => {
  const router = useRouter();
  const { allInventories, loading, refreshInventories, lastRefresh } =
    useInventory();
  const [refreshing, setRefreshing] = useState(false);

  // 🔄 REFRESH MANUAL
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshInventories();
    } catch (error) {
      console.error("Error refrescando:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshInventories]);

  // 🔄 AUTO-REFRESH AL ENFOCAR
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 AdminScreen enfocada");
      if (!refreshing) {
        refreshInventories();
      }
    }, [refreshInventories, refreshing]),
  );

  // Mostrar loading solo en la carga inicial
  if (loading && !refreshing && allInventories.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando todos los inventarios...</Text>
      </View>
    );
  }

  // Vista vacía
  if (!loading && allInventories.length === 0) {
    return (
      <View style={homeStyles.container}>
        <View style={homeStyles.header}>
          <Text style={homeStyles.title}>GESTIÓN DE INVENTARIOS</Text>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="refresh-outline" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="folder-open-outline" size={60} color="#ccc" />
          <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 10 }}>
            No hay inventarios registrados
          </Text>
          <Text
            style={{
              color: "#666",
              textAlign: "center",
              paddingHorizontal: 40,
            }}
          >
            Los usuarios aún no han creado inventarios en el sistema
          </Text>
          <TouchableOpacity
            style={homeStyles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Text style={homeStyles.refreshButtonText}>
              {refreshing ? "Actualizando..." : "Intentar de nuevo"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleDetailsPress = (inventory) => {
    console.log("Ver detalles del inventario:", inventory.id);
    // Navegar a detalles
    router.push({
      pathname: "/(details)/[id]",
      params: { id: inventory.id },
    });
  };

  return (
    <View style={homeStyles.containerAdmin}>
      {/* HEADER CON REFRESH */}

      <View style={homeStyles.titleContainer}>
        <Text style={authStyles.title}>GESTIÓN DE INVENTARIOS</Text>
      </View>

      {/* LISTA */}
      <View style={homeStyles.flatList}>
        <FlatList
          data={allInventories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InventoryCard
              inventory={item}
              onPressDetails={() => handleDetailsPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
              progressViewOffset={40} // Ajusta según tu header
            />
          }
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={homeStyles.emptyList}>
              <Text style={homeStyles.emptyText}>
                No hay inventarios para mostrar
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

export default AdminScreen;
