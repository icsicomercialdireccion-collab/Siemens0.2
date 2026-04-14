// app/components/ErrorBoundary.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Guardar error para debugging
    console.log("❌ ErrorBoundary capturó:", error);
    console.log("📍 Componente:", errorInfo.componentStack);

    this.setState({ errorInfo });

    // Aquí puedes enviar el error a un servicio como Sentry
    // o guardarlo en AsyncStorage para revisarlo después
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="camera-outline" size={80} color={COLORS.primary} />
          <Text style={styles.title}>Oops, algo salió mal</Text>
          <Text style={styles.message}>
            La cámara tuvo un problema. Esto puede deberse a falta de memoria o
            un error temporal.
          </Text>

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => this.props.navigation?.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Volver atrás</Text>
          </TouchableOpacity>

          {/* Solo mostrar detalles en desarrollo */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>
                Detalles del error (solo desarrollo):
              </Text>
              <Text style={styles.debugText}>
                {this.state.error?.message || "Error desconocido"}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: "#999",
  },
});
