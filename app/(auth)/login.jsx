import { Ionicons } from "@expo/vector-icons"
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { authStyles } from '../../assets/styles/auth.styles'
import { COLORS } from '../../constants/colors'
import { useAuth } from '../contexts/AutContext'; // Cambiamos de Clerk a nuestro AuthContext

const SignInScreen = () => {
  const router = useRouter()
  
  // Cambiamos de Clerk a Firebase Auth
  const { login, loading: authLoading, userData } = useAuth() // loading del contexto
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("") // Cambié el nombre de setpassword a setPassword
  const [showPassword, setShowPassword] = useState(false) // Cambié a boolean
  const [isSubmitting, setIsSubmitting] = useState(false) // Loading local para el submit

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa email y contraseña")
      return
    }
    
    setIsSubmitting(true)

    setTimeout(() => {
        if (userData?.role === 'admin') {
          router.replace("/(tabs-admin)/home");
        } else {
          router.replace("/(tabs)/home");
        }
      }, 100);
    
    try {
      const result = await login(email, password)
      
      if (result.success) {
        // El usuario será redirigido automáticamente por el AuthContext
        // No necesitamos hacer router.replace aquí
        Alert.alert("Éxito", "Inicio de sesión exitoso")
      } 
      
      else {
        Alert.alert("Error", result.error || "Error al iniciar sesión")
      }
    } catch (error) {
      Alert.alert("Error", "Error inesperado: " + error.message)
      console.error("Sign in error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading combinado
  const isLoading = authLoading || isSubmitting

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        style={authStyles.keyboardView}
        behavior={Platform.OS === 'android' ? 'padding' : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.imageContainer}>
            <Image 
              source={require("../../assets/images/icsiLogo.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>

          <Text style={authStyles.title}>Inventario Siemens</Text>

          {/* FORMULARIO */}
          <View style={authStyles.formContainer}>
            {/* EMAIL INPUT */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Ingresa tu correo"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* PASSWORD INPUT */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword} // Cambié aquí
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
            
            {/* BOTON INICIAR SESION */}
            <TouchableOpacity
              style={[
                authStyles.authButton, 
                isLoading && authStyles.buttonDisabled
              ]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
              
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={authStyles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* BOTON REGISTRARSE */}
            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
              disabled={isLoading}
            > 
              <Text style={authStyles.link}>Regístrate</Text> 
            </TouchableOpacity>

            {/* BOTON RECUPERAR CONTRASEÑA (OPCIONAL) */}
            <TouchableOpacity
              style={[authStyles.linkContainer, { marginTop: 10 }]}
              onPress={() => router.push("/(auth)/forgot-password")}
              disabled={isLoading}
            >
              <Text style={[authStyles.link, { fontSize: 14}]}>
                ¿Olvidaste tu contraseña?</Text> 
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default SignInScreen