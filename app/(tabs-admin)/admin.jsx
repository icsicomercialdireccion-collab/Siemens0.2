import { homeStyles } from '@/assets/styles/home.style';
import React from 'react';
import { FlatList, Text, View } from 'react-native';

import { authStyles } from '../../assets/styles/auth.styles';
import InventoryCard from '../components/cardInventory';


import { useInventory } from '../contexts/InventoryContext';


const AdminScreen = () => {
  const { allInventories, loading } = useInventory();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando todos los inventarios...</Text>
      </View>
    );
  }

  if (allInventories.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No hay inventarios registrados en el sistema</Text>
        <Text>Los usuarios aún no han creado inventarios</Text>
      </View>
    );
  }

  const handleDetailsPress = (inventories) => {
    console.log('Ver detalles del inventario:', inventories.id);
    // Navegar a detalles
  };
  
  return (
    <View style={homeStyles.container}>
      <Text style={authStyles.title}>
        GESTION DE INVENTARIOS
      </Text>
      
      <FlatList
        data={allInventories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryCard
            inventory={item}
            onPressDetails={() => handleDetailsPress(item)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10} // Solo renderiza 10 al inicio
        maxToRenderPerBatch={10} // Renderiza en lotes de 10
        windowSize={5} // Mantiene 5 "pantallas" en memoria
        removeClippedSubviews={true} // Elimina componentes no visibles
      />
    </View>
  )
}

export default AdminScreen