import { homeStyles } from "@/assets/styles/home.style";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

import ButtomInventoryG from "../components/buttomInventoryG";
import InventoryCard from "../components/cardInventory";
import InventoryTitle from "../components/inventoryTitle";
import { useAuth } from "../contexts/AutContext";
import { useInventory } from "../contexts/InventoryContext";

const HomeScreen = () => {
  const router = useRouter();
  const { userInventories, loading, refreshInventories, initialized } =
    useInventory();
  const { userData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  if (userInventories.length > 0) {
    console.log(
      "  - Inventarios:",
      userInventories.map((i) => `${i.mes} ${i.anio}`).join(", "),
    );
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshInventories(); // Asegúrate de tener esta función en tu contexto
    } catch (error) {
      console.error("Error refrescando inventarios:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshInventories]);

  // 🔄 Actualizar automáticamente cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 HomeScreenAdmin: Pantalla enfocada, actualizando...");
      if (refreshInventories) {
        refreshInventories();
      }
    }, [refreshInventories]),
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando inventarios...</Text>
      </View>
    );
  }

  if (!loading && initialized && userInventories.length === 0) {
    return (
      <View style={homeStyles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="folder-open-outline" size={60} color="#ccc" />
          <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 10 }}>
            No has creado inventarios aún
          </Text>
          <Text
            style={{
              color: "#666",
              textAlign: "center",
              paddingHorizontal: 40,
            }}
          >
            Hola {userData?.displayName || "Administrador"}, comienza creando tu
            primer inventario
          </Text>
        </View>
        <ButtomInventoryG
          onPress={() => router.push("/(forms)/formInventory")}
          label="Crear Inventario"
        />
      </View>
    );
  }

  const handleDetailsPress = (inventory) => {
    console.log("Ver detalles del inventario:", inventory.id);
    // Navegar a la pantalla de detalles
    router.push({
      pathname: "/(details)/[id]",
      params: { id: inventory.id },
    });
  };

  return (
    <View style={homeStyles.container}>
      <InventoryTitle onRefresh={onRefresh} refreshing={refreshing} />

      <FlatList
        data={userInventories}
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
            colors={["#007AFF"]} // Color azul
            tintColor="#007AFF"
            title="Actualizando inventarios..."
            titleColor="#007AFF"
          />
        }
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#666" }}>
              No hay inventarios
            </Text>
          </View>
        }
      />

      <ButtomInventoryG
        onPress={() => router.push("/(forms)/formInventory")}
        label="Agregar Inventario"
      />
    </View>
  );
};

export default HomeScreen;
