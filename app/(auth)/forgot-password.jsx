// app/(auth)/forgot-password.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { auth } from "../../firebase/FirebaseConfig";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleResetPassword = async () => {
    // Validaciones
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());

      // Éxito
      setEmailSent(true);
      Alert.alert(
        "Correo enviado",
        `Se ha enviado un enlace de recuperación a ${email}. Por favor revisa tu bandeja de entrada y carpeta de spam.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Error resetting password:", error);

      let errorMessage =
        "Ocurrió un error al enviar el correo. Intenta nuevamente.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este correo electrónico.";
          break;
        case "auth/invalid-email":
          errorMessage = "El correo electrónico no tiene un formato válido.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos. Por favor espera unos minutos.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Verifica tu internet.";
          break;
        default:
          errorMessage = error.message || "Error desconocido";
      }

      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña
            </Text>
          </View>

          {/* Ilustración/Icono */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={60} color={COLORS.primary} />
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Campo de email */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.text}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading && !emailSent}
              />
            </View>

            {/* Mensaje de error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Mensaje de éxito */}
            {emailSent ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.successText}>
                  Correo enviado exitosamente. Revisa tu bandeja de entrada.
                </Text>
              </View>
            ) : null}

            {/* Botón de enviar */}
            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
                emailSent && styles.buttonSuccess,
              ]}
              onPress={handleResetPassword}
              disabled={loading || emailSent}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : emailSent ? (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Correo Enviado</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Enviar Enlace</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Instrucciones */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Importante:</Text>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.instructionText}>
                  El enlace expira en 1 hora
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.instructionText}>
                  Revisa la carpeta de spam si no ves el correo
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.instructionText}>
                  El enlace solo puede usarse una vez
                </Text>
              </View>
            </View>

            {/* Enlace para volver al login */}
            <TouchableOpacity
              style={styles.backToLoginLink}
              onPress={handleBackToLogin}
            >
              <Ionicons
                name="log-in-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.backToLoginText}>
                Volver al inicio de sesión
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Problemas para recuperar tu cuenta?{"\n"}
              <Text style={styles.footerLink}>Contacta al soporte técnico</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos
const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(217, 26, 42, 0.1)", // Color primario con opacidad
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  successText: {
    color: "#10B981",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonSuccess: {
    backgroundColor: "#10B981",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  instructionText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  backToLoginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  backToLoginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
};
