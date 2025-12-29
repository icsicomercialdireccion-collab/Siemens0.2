// app/(profile)/changePassword.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../contexts/AutContext';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Tu contraseña ha sido cambiada exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Limpiar formulario
                setFormData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Ocurrió un error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
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

  const isSubmitDisabled = loading || 
    !formData.currentPassword || 
    !formData.newPassword || 
    !formData.confirmPassword;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Ionicons name="lock-closed" size={40} color="#fff" />
            <Text style={styles.title}>Cambiar Contraseña</Text>
            <Text style={styles.subtitle}>Actualiza tu contraseña de acceso</Text>
          </View>
        </View>

        {/* Información de seguridad */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Requisitos de seguridad</Text>
          </View>
          <Text style={styles.infoText}>
            • Mínimo 6 caracteres
          </Text>
          <Text style={styles.infoText}>
            • Diferente a tu contraseña actual
          </Text>
          <Text style={styles.infoText}>
            • Recuerda guardarla en un lugar seguro
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Contraseña actual */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Contraseña actual <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.currentPassword && styles.inputError
                ]}
                value={formData.currentPassword}
                onChangeText={(text) => handleInputChange('currentPassword', text)}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#999"
                secureTextEntry={!showPasswords.current}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
                disabled={loading}
              >
                <Ionicons 
                  name={showPasswords.current ? "eye-off" : "eye"} 
                  size={22} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              </View>
            )}
          </View>

          {/* Nueva contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nueva contraseña <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.newPassword && styles.inputError
                ]}
                value={formData.newPassword}
                onChangeText={(text) => handleInputChange('newPassword', text)}
                placeholder="Ingresa tu nueva contraseña"
                placeholderTextColor="#999"
                secureTextEntry={!showPasswords.new}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                <Ionicons 
                  name={showPasswords.new ? "eye-off" : "eye"} 
                  size={22} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                Mínimo 6 caracteres, diferente a la actual
              </Text>
            )}
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Confirmar contraseña <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.confirmPassword && styles.inputError
                ]}
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                placeholder="Repite tu nueva contraseña"
                placeholderTextColor="#999"
                secureTextEntry={!showPasswords.confirm}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                <Ionicons 
                  name={showPasswords.confirm ? "eye-off" : "eye"} 
                  size={22} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            )}
          </View>

          {/* Botones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Ionicons name="close-outline" size={20} color={COLORS.text} />
              <Text style={styles.cancelButtonText}> Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (isSubmitDisabled || Object.keys(errors).length > 0) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled || Object.keys(errors).length > 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}> Cambiar contraseña</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 25,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 25,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 25,
    zIndex: 1,
    padding: 5,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: COLORS.text,
  },
  passwordInput: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    flex: 1,
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    marginTop: 6,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});