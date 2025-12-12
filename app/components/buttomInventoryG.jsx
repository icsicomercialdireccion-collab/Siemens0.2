import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { buttomAddInventory } from '../../assets/styles/buttoms.style';

export default function ButtomInventoryG({ onPress, label = "Agregar Inventario" }){
  return (
    <TouchableOpacity style={buttomAddInventory.floatingButton}   onPress={onPress}
      activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="white" />
        <Text style={buttomAddInventory.floatingButtonText}>Nuevo Inventario</Text>
      </TouchableOpacity>
  )
}
