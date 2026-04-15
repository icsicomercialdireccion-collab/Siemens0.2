// app/components/DeleteConfirmationModal.jsx - VERSIÓN CORREGIDA

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

const DeleteConfirmationModal = ({
  visible,
  equipmentSerial,
  onConfirm,
  onCancel,
  loading = false,
}) => {
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
              <Ionicons name="trash-outline" size={45} color={COLORS.error} />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>Eliminar equipo</Text>

          {/* Mensaje */}
          <Text style={styles.message}>
            ¿Estás seguro de que deseas eliminar este equipo?
          </Text>

          <View style={styles.equipmentContainer}>
            <Ionicons name="barcode-outline" size={16} color={COLORS.primary} />
            <Text style={styles.equipmentSerial} numberOfLines={1}>
              {equipmentSerial}
            </Text>
          </View>

          <Text style={styles.warningText}>
            Esta acción no se puede deshacer.
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
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.confirmButtonText}>Eliminar</Text>
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
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(217, 26, 42, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  equipmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    width: "100%",
  },
  equipmentSerial: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DeleteConfirmationModal;
