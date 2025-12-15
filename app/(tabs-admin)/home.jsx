import { homeStyles } from '@/assets/styles/home.style';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import ButtomInventoryG from '../components/buttomInventoryG';
import InventoryCard from '../components/cardInventory';
import InventoryTitle from '../components/inventoryTitle';

import { useInventory } from '../contexts/InventoryContext';


const HomeScreenAdmin = () => {

  const router = useRouter()
  const { userInventories, loading } = useInventory();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando inventarios...</Text>
      </View>
    );
  }

  if (userInventories.length === 0) {
    return (
      <View style={homeStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>No has creado inventarios aún</Text>
          <Text style={{ color: '#666' }}>Crea tu primer inventario desde el botón +</Text>
        </View>
        <ButtomInventoryG
          onPress={() => router.push("/(forms)/formInventory")}
          label="Agregar Inventario"
        />
      </View>
    );
  }

    const handleDetailsPress = (inventory) => {
    console.log('Ver detalles del inventario:', inventory.id);
    // Navegar a detalles/equipos:
    // router.push(`/(inventory)/${inventory.id}`);
  };

  return (
    <View style={homeStyles.container}>

    <InventoryTitle/>
     <FlatList
        data={userInventories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryCard
            inventory={item}
            onPressDetails={() => handleDetailsPress(item)}
          />
        )}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10} // Solo renderiza 10 al inicio
  maxToRenderPerBatch={10} // Renderiza en lotes de 10
  windowSize={5} // Mantiene 5 "pantallas" en memoria
  removeClippedSubviews={true} // Elimina componentes no visibles
      />
      <ButtomInventoryG
        onPress={() => router.push("/(forms)/formInventory")}
        label="Agregar Inventario "
      />
    </View>
  )
}

export default HomeScreenAdmin