// components/InventoryCard.jsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { cardStyle } from '../../assets/styles/card.inventory';

const InventoryCard = ({ inventory, onPressDetails }) => {

  //Router
  const router = useRouter();

  const handleDetailsPress = () => {
    // Navegar a DetailsScreen con el ID
    router.push(`/(details)/${inventory.id}`);
  };

  // Formatear fecha de actualización
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Sin fecha';
    
    try {
      const date = timestamp.toDate();
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <View style={cardStyle.card}>
      {/* TÍTULO: MES Y AÑO */}
      <Text style={cardStyle.title}>
        {inventory.mes?.toUpperCase() || 'SIN MES'} {inventory.anio || ''}
      </Text>
      
      {/* CREADOR */}
      <Text style={cardStyle.creator}>
        <Ionicons name="person" size={18} style={cardStyle.icon}/> {inventory.createdByName || 'Usuario'}
      </Text>
      
      {/* UBICACIÓN Y LOCALIDAD (misma línea) */}
      <Text style={cardStyle.location}>
        <Ionicons name="location" size={18} style={cardStyle.icon}/> {inventory.estado || 'Sin estado'} • {inventory.localidad || 'Sin localidad'}
      </Text>
      
      {/* CONTADOR DE EQUIPOS */}
      <Text style={cardStyle.equipmentCount}>
        <Ionicons name="laptop-outline" size={18} style={cardStyle.icon}/> {inventory.totalEquipos || 0} equipos registrados
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