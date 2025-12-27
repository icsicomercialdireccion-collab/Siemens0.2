// app/components/EquipmentList.jsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { ListStyle } from '../../assets/styles/list.style';
import { COLORS } from '../../constants/colors';


export default function EquipmentList({ 
  equipments, 
  loading, 
  inventoryId,
  onRefresh,
  onPressEquipment,
  onDeleteEquipment 
}) {
  // Función para renderizar cada equipo
  const renderEquipmentItem = ({ item }) => (
    <TouchableOpacity
      style={ListStyle.equipmentCard}
      onPress={() => {
        console.log('📱 Presionando equipo:', {
          equipmentId: item.id,
          inventoryId: inventoryId
        });
        
        if (onPressEquipment) {
          // PASA AMBOS PARÁMETROS
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
        <View style={[
          ListStyle.statusBadge,
          { backgroundColor: getStatusColor(item.estado) }
        ]}>
          <Text style={ListStyle.statusText}>
            {getStatusLabel(item.estado)}
          </Text>
        </View>
      </View>

      {/* Información del equipo */}
      <View style={ListStyle.cardBody}>
        <View style={ListStyle.infoRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={ListStyle.typeText}>{item.tipo || 'computadora'}</Text>
        </View>
        
        {item.observaciones ? (
          <View style={ListStyle.observationsContainer}>
            <Ionicons name="document-text-outline" size={14} color="#888" />
            <Text style={ListStyle.observationsText} numberOfLines={2}>
              {item.observaciones}
            </Text>
          </View>
        ) : null}
        
        {/* Imagen del equipo (si existe) */}
        {item.imagenUrl ? (
          <View style={ListStyle.imageContainer}>
            <Image
              source={{ uri: item.imagenUrl }}
              style={ListStyle.equipmentImage}
              resizeMode="cover"
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
          <Text style={ListStyle.dateText}>
            {formatDate(item.createdAt?.toDate?.() || new Date())}
          </Text>
        </View>
        
        {/* Botones de acción */}
        <View style={ListStyle.actionsContainer}>
          <TouchableOpacity
            style={ListStyle.actionButton}
            onPress={() => onPressEquipment && onPressEquipment(item)}
          >
            <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[ListStyle.actionButton, ListStyle.deleteButton]}
            onPress={() => handleDeleteEquipment(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Función para manejar la eliminación
  const handleDeleteEquipment = (equipment) => {
    Alert.alert(
      "Eliminar equipo",
      `¿Estás seguro de eliminar el equipo ${equipment.serial}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            if (onDeleteEquipment) {
              onDeleteEquipment(inventoryId, equipment.id);
            }
          }
        }
      ]
    );
  };

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
    />
  );
}

// Funciones auxiliares
const getStatusColor = (status) => {
  switch(status) {
    case 'nuevo': return '#d4edda';
    case 'usado': return '#fff3cd';
    case 'reparacion': return '#cce5ff';
    case 'danado': return '#f8d7da';
    default: return '#e9ecef';
  }
};

const getStatusLabel = (status) => {
  switch(status) {
    case 'nuevo': return 'Nuevo';
    case 'usado': return 'Usado';
    case 'reparacion': return 'En reparación';
    case 'danado': return 'Dañado';
    default: return status;
  }
};

const formatDate = (date) => {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

