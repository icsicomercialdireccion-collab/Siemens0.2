import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

const buttomInventoryG = () => {
  return (
    <TouchableOpacity style={styles.floatingButton}>
        <Ionicons name="add" size={28} color="white" />
        <Text style={styles.floatingButtonText}>Agregar Inventario</Text>
      </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    floatingButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})

export default buttomInventoryG