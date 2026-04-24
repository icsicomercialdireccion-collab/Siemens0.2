// app/(auth)/login.jsx - VERSIÓN CORREGIDA

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";
import ErrorModal from "../components/ErrorModal";
import { useAuth } from "../contexts/AutContext";

const SignInScreen = () => {
  const router = useRouter();
  const { login, loading: authLoading, user, userData } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Estados para el modal de error
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (user && userData && !redirecting) {
      setRedirecting(true);

      setTimeout(() => {
        if (userData.role === "admin") {
          router.replace("/(tabs-admin)/home");
        } else {
          router.replace("/(tabs)/home");
        }
      }, 500);
    }
  }, [user, userData, router, redirecting]);

  const showErrorModal = (title, message, retry = false) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowRetry(retry);
    setErrorModalVisible(true);
  };

  const closeErrorModal = () => {
    setErrorModalVisible(false);
    setShowRetry(false);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showErrorModal(
        "Campos incompletos",
        "Por favor ingresa tu correo electrónico y contraseña para continuar.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success) {
      } else {
        // 👈 MANEJO DEL NUEVO ERROR auth/invalid-credential
        let title = "Error de autenticación";
        let message = "";
        let retry = true;

        switch (result.code) {
          case "auth/invalid-email":
            title = "Correo inválido";
            message =
              "El formato del correo electrónico no es válido. Por favor verifica e intenta nuevamente.";
            retry = false;
            break;

          case "auth/invalid-credential":
            // 👈 Firebase unificó los errores de credenciales en este código
            title = "Credenciales incorrectas";
            message =
              "El correo electrónico o la contraseña son incorrectos. Por favor verifica tus datos e intenta nuevamente.";
            retry = true;
            break;

          case "auth/too-many-requests":
            title = "Demasiados intentos";
            message =
              "Se han realizado demasiados intentos fallidos. Por favor espera unos minutos antes de volver a intentar.";
            retry = false;
            break;

          case "auth/network-request-failed":
            title = "Error de conexión";
            message =
              "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.";
            retry = true;
            break;

          case "auth/user-disabled":
            title = "Cuenta deshabilitada";
            message =
              "Esta cuenta ha sido deshabilitada. Contacta al administrador para más información.";
            retry = false;
            break;

          default:
            message =
              result.error ||
              "Error al iniciar sesión. Por favor intenta nuevamente.";
            retry = true;
        }

        showErrorModal(title, message, retry);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      showErrorModal(
        "Error inesperado",
        "Ocurrió un error inesperado. Por favor intenta nuevamente más tarde.",
        true,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

  if (redirecting) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10 }}>Redirigiendo...</Text>
      </View>
    );
  }

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        style={authStyles.keyboardView}
        behavior={Platform.OS === "android" ? "padding" : "height"}
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

          <View style={authStyles.formContainer}>
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

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Ingresa tu contraseña"
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

            <TouchableOpacity
              style={[
                authStyles.authButton,
                isLoading && authStyles.buttonDisabled,
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

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
              disabled={isLoading}
            >
              <Text style={authStyles.link}>Regístrate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[authStyles.linkContainer, { marginTop: 10 }]}
              onPress={() => router.push("/(auth)/forgot-password")}
              disabled={isLoading}
            >
              <Text style={[authStyles.link, { fontSize: 14 }]}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ErrorModal
        visible={errorModalVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={closeErrorModal}
        onRetry={handleSignIn}
        showRetry={showRetry}
      />
    </View>
  );
};

export default SignInScreen;
