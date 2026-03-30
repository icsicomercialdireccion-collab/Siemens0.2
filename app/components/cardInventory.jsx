// components/InventoryCard.jsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { cardStyle } from "../../assets/styles/card.inventory";

const InventoryCard = ({ inventory, onPressDetails }) => {
  //Router
  const router = useRouter();

  const handleDetailsPress = () => {
    // Navegar a DetailsScreen con el ID
    router.push(`/(details)/${inventory.id}`);
  };

  // Formatear fecha de actualización
  const formatDate = (timestamp) => {
    // Si no hay fecha
    if (!timestamp) return "Sin fecha";

    try {
      let date;

      // Si es Firebase Timestamp (tiene método toDate)
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      }
      // Si ya es un objeto Date
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Si es string (ISO string)
      else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      }
      // Si es un número (timestamp UNIX)
      else if (typeof timestamp === "number") {
        date = new Date(timestamp);
      } else {
        return "Fecha inválida";
      }

      // Validar que la fecha es válida
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }

      // Formatear fecha: DD/MM/AA
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear().toString().slice(-2);

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Fecha inválida";
    }
  };

  return (
    <View style={cardStyle.card}>
      {/* TÍTULO: MES Y AÑO */}
      <Text style={cardStyle.title}>
        {inventory.mes?.toUpperCase() || "SIN MES"} {inventory.anio || ""}
      </Text>

      {/* CREADOR */}
      <Text style={cardStyle.creator}>
        <Ionicons name="person" size={18} style={cardStyle.icon} />{" "}
        {inventory.createdByName || "Usuario"}
      </Text>

      {/* UBICACIÓN Y LOCALIDAD (misma línea) */}
      <Text style={cardStyle.location}>
        <Ionicons name="location" size={18} style={cardStyle.icon} />{" "}
        {inventory.estado || "Sin estado"} •{" "}
        {inventory.localidad || "Sin localidad"}
      </Text>

      {/* CONTADOR DE EQUIPOS */}
      <Text style={cardStyle.equipmentCount}>
        <Ionicons name="laptop-outline" size={18} style={cardStyle.icon} />{" "}
        {inventory.totalEquipos || 0} equipos registrados
      </Text>

      {/* BOTÓN DETALLES */}
      <TouchableOpacity
        style={cardStyle.detailsButton}
        onPress={handleDetailsPress}
      >
        <Text style={cardStyle.detailsButtonText}>DETALLES</Text>
      </TouchableOpacity>

      {/* FECHA DE ACTUALIZACIÓN (derecha) */}
      <Text style={cardStyle.updatedAt}>
        Actualizado: {formatDate(inventory.updatedAt || inventory.createdAt)}
      </Text>
    </View>
  );
};

export default InventoryCard;
