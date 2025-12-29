// app/(profile)/editProfile.jsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { ProfileEditStyle } from '../../assets/styles/profileEdit.style';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../contexts/AutContext';
import { useProfile } from '../contexts/ProfileContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userData: userDataParam } = useLocalSearchParams();
  const { updateUserName, validateName, loading: profileLoading } = useProfile();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [originalName, setOriginalName] = useState('');

  useEffect(() => {
    // Inicializar datos desde params o desde el usuario actual
    let initialData = {
      name: '',
      email: '',
    };

    try {
      if (userDataParam) {
        const parsedData = JSON.parse(userDataParam);
        initialData = {
          name: parsedData.name || '',
          email: parsedData.email || '',
        };
        setOriginalName(parsedData.name || '');
      } else if (user) {
        initialData = {
          name: user.displayName || '',
          email: user.email || '',
        };
        setOriginalName(user.displayName || '');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    setFormData(initialData);
  }, [userDataParam, user]);

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre usando la función del ProfileContext
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    // El email es solo lectura, pero validamos por si acaso
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Correo electrónico inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    // Solo permitir cambios en el nombre, el email es solo lectura
    if (field === 'name') {
      setFormData(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
      
      // Limpiar error al empezar a escribir
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    // Verificar si hay cambios reales solo en el nombre
    if (formData.name.trim() === originalName) {
      Alert.alert('Sin cambios', 'No se detectaron cambios para guardar');
      return;
    }

    setLoading(true);

    try {
      // Usar la función del ProfileContext para actualizar el nombre
      const result = await updateUserName(formData.name.trim());
      
      if (result.success) {
        if (result.noChanges) {
          Alert.alert('Sin cambios', result.message);
        } else {
          Alert.alert(
            'Éxito', 
            result.message || 'Perfil actualizado correctamente',
            [{ 
              text: 'OK', 
              onPress: () => router.back() 
            }]
          );
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Estás seguro de salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Descartar', 
            style: 'destructive',
            onPress: () => router.back() 
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const getInitials = () => {
    if (!formData.name) return 'U';
    return formData.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isSaveDisabled = loading || !isDirty || Object.keys(errors).length > 0;
  const isLoading = loading || profileLoading;

  return (
    <KeyboardAvoidingView 
      style={ProfileEditStyle.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={ProfileEditStyle.contentContainer}>
        {/* Header */}
        <View style={ProfileEditStyle.header}>
          <TouchableOpacity 
            style={ProfileEditStyle.backButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={ProfileEditStyle.headerContent}>
            <Text style={ProfileEditStyle.title}>Editar Perfil</Text>
            <Text style={ProfileEditStyle.subtitle}>Actualiza tu información personal</Text>
          </View>
        </View>

        {/* Avatar/Iniciales */}
        <View style={ProfileEditStyle.avatarSection}>
          <View style={ProfileEditStyle.avatarContainer}>
            <View style={ProfileEditStyle.avatar}>
              <Text style={ProfileEditStyle.avatarText}>{getInitials()}</Text>
            </View>
          </View>
          <Text style={ProfileEditStyle.avatarHint}>
            Tu avatar se actualizará con tus iniciales
          </Text>
        </View>

        {/* Formulario */}
        <View style={ProfileEditStyle.form}>
          {/* Campo Nombre */}
          <View style={ProfileEditStyle.inputGroup}>
            <Text style={ProfileEditStyle.label}>
              Nombre completo <Text style={ProfileEditStyle.required}>*</Text>
            </Text>
            <TextInput
              style={[
                ProfileEditStyle.input, 
                errors.name && ProfileEditStyle.inputError
              ]}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor="#999"
              editable={!isLoading}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name ? (
              <View style={ProfileEditStyle.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                <Text style={ProfileEditStyle.errorText}>{errors.name}</Text>
              </View>
            ) : (
              <Text style={ProfileEditStyle.helperText}>
                Este nombre se mostrará en tu perfil (mínimo 2 caracteres)
              </Text>
            )}
          </View>

          {/* Campo Email (solo lectura) */}
          <View style={ProfileEditStyle.inputGroup}>
            <Text style={ProfileEditStyle.label}>
              Correo electrónico <Text style={ProfileEditStyle.required}>*</Text>
            </Text>
            <View style={ProfileEditStyle.emailContainer}>
              <TextInput
                style={[
                  ProfileEditStyle.input, 
                  ProfileEditStyle.emailInput,
                  errors.email && ProfileEditStyle.inputError
                ]}
                value={formData.email}
                editable={false} // Email no editable
                placeholder="tu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={ProfileEditStyle.emailLock}>
                <Ionicons name="lock-closed" size={16} color="#999" />
                <Text style={ProfileEditStyle.emailLockText}>Solo lectura</Text>
              </View>
            </View>
            {errors.email ? (
              <View style={ProfileEditStyle.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                <Text style={ProfileEditStyle.errorText}>{errors.email}</Text>
              </View>
            ) : (
              <Text style={ProfileEditStyle.helperText}>
                El correo electrónico no se puede modificar desde aquí
              </Text>
            )}
          </View>

          {/* Información adicional */}
          <View style={ProfileEditStyle.infoCard}>
            <View style={ProfileEditStyle.infoHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={ProfileEditStyle.infoTitle}>Información importante</Text>
            </View>
            <Text style={ProfileEditStyle.infoText}>
              • Solo puedes cambiar tu nombre en esta pantalla
            </Text>
            <Text style={ProfileEditStyle.infoText}>
              • El correo electrónico requiere verificación especial
            </Text>
            <Text style={ProfileEditStyle.infoText}>
              • Tu nombre se actualizará en todo el sistema
            </Text>
          </View>

          {/* Botones */}
          <View style={ProfileEditStyle.actions}>
            <TouchableOpacity
              style={[
                ProfileEditStyle.button, 
                ProfileEditStyle.cancelButton,
                isLoading && ProfileEditStyle.buttonDisabled
              ]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Ionicons name="close-outline" size={20} color={COLORS.text} />
              <Text style={ProfileEditStyle.cancelButtonText}> Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                ProfileEditStyle.button, 
                ProfileEditStyle.saveButton,
                (isSaveDisabled || isLoading) && ProfileEditStyle.buttonDisabled
              ]}
              onPress={handleSave}
              disabled={isSaveDisabled || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={20} color="#fff" />
                  <Text style={ProfileEditStyle.saveButtonText}> Guardar cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Estado de carga */}
        {isLoading && (
          <View style={ProfileEditStyle.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={ProfileEditStyle.loadingText}>Actualizando perfil...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

