// app/components/EquipmentList.jsx - VERSIÓN CON MODAL

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ListStyle } from "../../assets/styles/list.style";
import { COLORS } from "../../constants/colors";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const BLURHASH_PLACEHOLDER = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export default function EquipmentList({
  equipments,
  loading,
  inventoryId,
  onRefresh,
  onPressEquipment,
  onDeleteEquipment,
}) {
  // 👈 Estado para el modal de eliminación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 👈 Función para abrir el modal de eliminación
  const openDeleteModal = (equipment) => {
    setSelectedEquipment(equipment);
    setDeleteModalVisible(true);
  };

  // 👈 Función para cerrar el modal
  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setSelectedEquipment(null);
  };

  // 👈 Función para confirmar la eliminación
  const confirmDelete = async () => {
    if (!selectedEquipment) return;

    setIsDeleting(true);

    try {
      if (onDeleteEquipment) {
        await onDeleteEquipment(inventoryId, selectedEquipment.id);
      }
      closeDeleteModal();
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para renderizar cada equipo
  const renderEquipmentItem = ({ item }) => (
    <TouchableOpacity
      style={ListStyle.equipmentCard}
      onPress={() => {
        if (onPressEquipment) {
          onPressEquipment(item, inventoryId);
        }
      }}
      activeOpacity={0.7}
    >
      {/* Encabezado de la tarjeta */}
      <View style={ListStyle.cardHeader}>
        <View style={ListStyle.serialContainer}>
          <Ionicons name="barcode-outline" size={20} color={COLORS.primary} />
          <Text style={ListStyle.serialText}>{item.serial}</Text>
        </View>

        {/* Estado del equipo */}
        <View
          style={[
            ListStyle.statusBadge,
            { backgroundColor: getStatusColor(item.estado) },
          ]}
        >
          <Text style={ListStyle.statusText}>
            {getStatusLabel(item.estado)}
          </Text>
        </View>
      </View>

      {/* Información del equipo */}
      <View style={ListStyle.cardBody}>
        <View style={ListStyle.infoRow}>
          <Ionicons name="options-outline" size={16} color="#666" />
          <Text style={ListStyle.typeText}>{item.perfil || "Standard"}</Text>
        </View>

        {/* Mostrar ubicación si existe */}
        {item.ubicacion ? (
          <View style={ListStyle.infoRow}>
            <Ionicons name="location-sharp" size={14} color="#888" />
            <Text style={ListStyle.ubicacionText} numberOfLines={1}>
              {item.ubicacion}
            </Text>
          </View>
        ) : null}

        {item.esquema ? (
          <View style={ListStyle.observationsContainer}>
            <Ionicons name="document-text-outline" size={14} color="#888" />
            <Text style={ListStyle.observationsText} numberOfLines={2}>
              {item.esquema}
            </Text>
          </View>
        ) : null}

        {/* Imagen del equipo (si existe) */}
        {item.imagenUrl ? (
          <View style={ListStyle.imageContainer}>
            <Image
              source={{ uri: item.imagenUrl }}
              style={ListStyle.equipmentImage}
              contentFit="cover"
              cachePolicy="disk"
              placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
              transition={150}
              recyclingKey={item.id}
            />
            <View style={ListStyle.imageBadge}>
              <Ionicons name="image" size={12} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={ListStyle.noImageContainer}>
            <Ionicons name="image-outline" size={30} color="#ddd" />
            <Text style={ListStyle.noImageText}>Sin imagen</Text>
          </View>
        )}
      </View>

      {/* Pie de tarjeta con fecha y acciones */}
      <View style={ListStyle.cardFooter}>
        <View style={ListStyle.dateContainer}>
          <Ionicons name="calendar-outline" size={12} color="#999" />
          <Text style={ListStyle.dateText}>{formatDate(item.updatedAt)}</Text>
        </View>

        {/* Botones de acción */}
        <View style={ListStyle.actionsContainer}>
          <TouchableOpacity
            style={[ListStyle.actionButton, ListStyle.deleteButton]}
            onPress={() => openDeleteModal(item)} // 👈 MODIFICADO
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Función para renderizar el separador
  const renderSeparator = () => <View style={ListStyle.separator} />;

  // Función para el footer (loading)
  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={ListStyle.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  // Función para lista vacía
  const renderEmptyList = () => (
    <View style={ListStyle.emptyContainer}>
      <Ionicons name="cube-outline" size={80} color="#ddd" />
      <Text style={ListStyle.emptyTitle}>No hay equipos registrados</Text>
      <Text style={ListStyle.emptySubtitle}>
        Toca el botón + para agregar tu primer equipo
      </Text>
    </View>
  );

  return (
    <>
      <FlatList
        data={equipments}
        renderItem={renderEquipmentItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ListStyle.listContainer}
        refreshing={loading}
        onRefresh={onRefresh}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10} // 👈 Renderiza de a 10
        updateCellsBatchingPeriod={50} // 👈 Controla frecuencia
        windowSize={5} // 👈 Solo mantiene 5 pantallas en memoria
        initialNumToRender={10} // 👈 Renderiza 10 al inicio
        onEndReachedThreshold={0.5}
      />

      {/* 👈 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        equipmentSerial={selectedEquipment?.serial || ""}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        loading={isDeleting}
      />
    </>
  );
}

// Funciones auxiliares (sin cambios)
const getStatusColor = (status) => {
  switch (status) {
    case "nuevo":
      return "#d4edda";
    case "usado":
      return "#fff3cd";
    case "reparacion":
      return "#cce5ff";
    case "danado":
      return "#f8d7da";
    default:
      return "#e9ecef";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "nuevo":
      return "Nuevo";
    case "usado":
      return "Usado";
    case "reparacion":
      return "En reparación";
    case "danado":
      return "Dañado";
    default:
      return status;
  }
};

const formatDate = (dateInput) => {
  if (!dateInput) return "Sin fecha";

  try {
    let date;

    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      date = new Date(dateInput);
    } else if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else {
      return "Fecha inválida";
    }

    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "Error";
  }
};
