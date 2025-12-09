import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { authStyles } from "../../assets/styles/auth.styles"
import { COLORS } from '../../constants/colors'
import { useAuth } from "../contexts/AutContext.jsx"; // Cambiamos a nuestro AuthContext

const SignUpScreen = () => {
  const router = useRouter()
  
  // Usamos nuestro AuthContext en lugar de Clerk
  const { register, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("") // Agregamos confirmación
  const [userName, setUserName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignUp = async () => {
  console.log("Iniciando registro...");
  console.log("Email:", email);
  console.log("🔑 Password:", password);
    // Validaciones
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register(email, password, userName);
      
      console.log("✅ Resultado del registro:", result); // Agrega esto
      
      if (result.success) {
        Alert.alert(
          "¡Éxito!", 
          "Cuenta creada correctamente. Puedes iniciar sesión ahora.",
          [
            { 
              text: "OK", 
              onPress: () => router.replace("/(auth)/login") 
            }
          ]
        );
      } else {
        // Muestra el error específico
        console.log(" Error del registro:", result.error, result.code);
        Alert.alert(
          "Error", 
          result.error || "Error al crear la cuenta"
        );
      }
    } catch (error) {
      console.error(" Error catch:", error);
      Alert.alert("Error", "Error inesperado: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para validar email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const isLoading = authLoading || isSubmitting

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        style={authStyles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.imageContainer}>
            <Image 
              source={require("../../assets/images/icsiLogo.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>
          
          <Text style={authStyles.title}>Crear Cuenta</Text>
          
          <View style={authStyles.formContainer}>

            {/* NOMBRE DE USUARIO (OPCIONAL) */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Nombre de usuario (opcional)"
                placeholderTextColor={COLORS.textLight}
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* CORREO ELECTRÓNICO */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Ingresa tu Correo"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* CONTRASEÑA */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Contraseña (mínimo 6 caracteres)"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
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

            {/* CONFIRMAR CONTRASEÑA */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Confirmar contraseña"
                placeholderTextColor={COLORS.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            {/* INDICADOR DE FUERZA DE CONTRASEÑA (OPCIONAL) */}
            {password.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ 
                  fontSize: 12, 
                  color: password.length >= 6 ? COLORS.success : COLORS.error,
                  marginBottom: 5
                }}>
                  {password.length >= 6 ? '✓ Contraseña segura' : '⚠ Mínimo 6 caracteres'}
                </Text>
                <View style={{ 
                  height: 4, 
                  backgroundColor: COLORS.border,
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <View style={{
                    width: `${Math.min(password.length * 10, 100)}%`,
                    height: '100%',
                    backgroundColor: password.length >= 6 ? COLORS.success : COLORS.error,
                    borderRadius: 2
                  }} />
                </View>
              </View>
            )}

            {/* BOTÓN REGISTRARSE */}
            <TouchableOpacity
              style={[
                authStyles.authButton, 
                isLoading && authStyles.buttonDisabled
                
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={authStyles.buttonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            {/* ENLACE PARA INICIAR SESIÓN */}
            <TouchableOpacity 
              style={authStyles.linkContainer} 
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={authStyles.linkText}>
                ¿Ya tienes cuenta? <Text style={authStyles.link}>Inicia Sesión</Text>
              </Text>
            </TouchableOpacity>

            {/* TÉRMINOS Y CONDICIONES (OPCIONAL) */}
            <View style={{ 
              marginTop: 20, 
              paddingHorizontal: 20 
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: COLORS.textLight,
                textAlign: 'center'
              }}>
                Al crear una cuenta, aceptas nuestros {' '}
                <Text style={{ color: COLORS.primary }}>Términos de Servicio</Text>{' '}
                y <Text style={{ color: COLORS.primary }}>Política de Privacidad</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default SignUpScreen