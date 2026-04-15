// app/components/LogoutModal.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../constants/colors";

const LogoutModal = ({ visible, onConfirm, onCancel, loading = false }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="log-out-outline"
                size={50}
                color={COLORS.primary}
              />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>Cerrar sesión</Text>

          {/* Mensaje */}
          <Text style={styles.message}>
            ¿Estás seguro de que deseas cerrar sesión?
          </Text>
          <Text style={styles.subMessage}>
            Deberás volver a iniciar sesión para acceder a tu cuenta.
          </Text>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color="#fff" />
                  <Text style={styles.confirmButtonText}>Cerrar sesión</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(217, 26, 42, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default LogoutModal;
