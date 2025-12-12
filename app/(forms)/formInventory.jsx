import { Image } from 'expo-image';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';

import { authStyles } from '../../assets/styles/auth.styles';
import { formStyle } from '../../assets/styles/form.style';
import { COLORS } from '../../constants/colors';


const FormInventory = () => {
  
  const router = useRouter();
  const { createInventory, loading } = useInventory();
  
  const [formData, setFormData] = useState({
    mes: '',
    anio: '',
    estado: '',
    localidad: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validaciones
  const datosValidados = {
    mes: (formData.mes || '').trim(),
    anio: (formData.anio || '').trim(),
    estado: (formData.estado || '').trim(),
    localidad: (formData.localidad || '').trim()
  };
    
  if (!datosValidados.mes) {
    Alert.alert('Error', 'El mes es requerido');
    return;
  }
    
  if (!datosValidados.anio) {
    Alert.alert('Error', 'Ingresa un Año valido');
    return;
  }
  
  if (!datosValidados.estado) {
    Alert.alert('Error', 'La localidad es requerida');
    return;
  }

  if (!datosValidados.localidad) {
    Alert.alert('Error', 'La localidad es requerida');
    return;
  }

  const datosParaEnviar = {
    ...datosValidados,
    anio: parseInt(datosValidados.anio) // <-- Convierte a número para Firebase
  };

  const result = await createInventory(datosParaEnviar); // <-- Un solo punto y coma
    
    if (result.success) {
      Alert.alert('Éxito', result.message, [
        { 
          text: 'OK', 
          onPress: () => router.back() 
        }
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  

  return (
      <View style={authStyles.container}>
        <KeyboardAvoidingView
          style={authStyles.container}
          behavior={Platform.OS === 'android' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={authStyles.scrollContent}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
          
          <Text style={authStyles.title}>NUEVO INVENTARIO</Text>
          <View style={authStyles.imageContainer}>
            <Image 
              source={require("../../assets/images/inventario.png")}
              style={formStyle.image}
              contentFit="cover"
            />
          </View>

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
          
              <Text style={formStyle.campTitle}>Periodo</Text>
              <TextInput  
                style={formStyle.textInput}
                placeholder='Mes'
                placeholderTextColor={COLORS.text}
                value={formData.mes}
                onChangeText={(value) => handleChange('mes', value)}
                editable={!loading}
              >
              </TextInput>

              <Text style={formStyle.campTitle}>Año</Text>
              <TextInput  
                style={
                  formStyle.textInput
                }
                placeholder='Año'
                placeholderTextColor={COLORS.text}
                value={formData.anio}
                onChangeText={(value) => handleChange('anio', value)}
                keyboardType="numeric"
                maxLength={4}
                editable={!loading}
            >
              </TextInput>

              <Text style={formStyle.campTitle}>Ubicación</Text>
              <TextInput  
                style={
                  formStyle.textInput
                }
                placeholder='Estado'
                placeholderTextColor={COLORS.text}
                value={formData.estado}
                onChangeText={(value) => handleChange('estado', value)}
                editable={!loading}
              >
              </TextInput>

              <Text style={formStyle.campTitle}>Localidad</Text>
              <TextInput  
                style={
                  formStyle.textInput
                }
                placeholder='Localidad'
                placeholderTextColor={COLORS.text}
                value={formData.localidad}
                onChangeText={(value) => handleChange('localidad', value)}
                editable={!loading}
              >
              </TextInput>
              <TouchableOpacity
                  style={[
                  formStyle.newInventoryButton,
                  loading && { opacity: 0.5 }
                ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                <Text style={formStyle.buttonText}>
                  {loading ? 'Creando...' : 'Crear Inventario'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default FormInventory