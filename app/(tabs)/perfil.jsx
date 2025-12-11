/*import React from 'react'
import { Text, View } from 'react-native'

const indexScreen = () => {
  return (
    <View>
      <Text>Perfil usuario</Text>
    </View>
  )
}

export default indexScreen*/

import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AutContext';

export default function PerfilAdminScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              router.replace("/(auth)/login");
            } else {
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        backgroundColor: '#FF3B30',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16
      }}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
        Cerrar Sesión
      </Text>
    </TouchableOpacity>
  );
}