import { homeStyles } from '@/assets/styles/home.style';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View, } from 'react-native';
import ButtomInventoryG from '../components/buttomInventoryG';


const HomeScreenAdmin = () => {

  const router = useRouter()

  return (
    <View style={homeStyles.container}>
     <ScrollView
        showsVerticalScrollIndicator={false}
        ContainerStyle={homeStyles.scrollContent}
      >
      
      </ScrollView>
      <ButtomInventoryG
        onPress={() => router.push("/(forms)/formInventory")}
        label="Agregar Inventario "
      />
    </View>
  )
}

export default HomeScreenAdmin