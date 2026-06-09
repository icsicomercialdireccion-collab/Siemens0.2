import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const detailStyle = StyleSheet.create({
  // ==================== LAYOUT PRINCIPAL ====================
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Cambiado de COLORS.background
  },

  // ==================== ESTADOS DE CARGA/ERROR ====================
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444", // Rojo más profesional
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // ==================== HEADER PROFESIONAL ====================
  headerContainer: {
    marginBottom: 20,
    width: SCREEN_WIDTH,
  },
  gradientCard: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    padding: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  inventoryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  exportButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    width: 65,
  },
  exportButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 16,
  },

  // ==================== INFORMACIÓN DEL INVENTARIO ====================
  infoContainer: {
    gap: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#FFD6D6",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // ==================== ESTADO ====================
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ==================== SECCIÓN DE EQUIPOS ====================
  equipmentSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
    paddingTop: 24,
    minHeight: 400,
    flex: 1, // Añadido para que ocupe espacio restante
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  // ==================== BOTONES FLOTANTES ====================
  // BOTONES FLOTANTES EN ESQUINAS
  fabContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLeft: {
    // No necesita estilo adicional, ya está a la izquierda
  },
  fabRight: {
    // No necesita estilo adicional, ya está a la derecha
  },
  fabAdd: {
    backgroundColor: COLORS.primary,
  },
  fabExport: {
    backgroundColor: "#10B981",
  },
  fabDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },

  // ==================== MODAL DE EXPORTACIÓN ====================
  // AGREGAR DESDE AQUÍ:
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,

    // Posición centrada (ajustable)
    position: "absolute",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 20,
  },
  modalButton: {
    // ESTE YA LO TIENES
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    display: "flex",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  modalButtonShare: {
    backgroundColor: "#2196F3", // Azul para compartir
    display: "flex",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  modalButtonText: {
    // ESTE YA LO TIENES
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonSecondary: {
    // ESTE YA LO TIENES
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },
  modalButtonTextSecondary: {
    // ESTE YA LO TIENES
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  // ==================== ESTILOS LEGACY (mantener si los usas en otros lugares) ====================
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 10,
  },

  fabBottom: {
    backgroundColor: COLORS.primary,
  },

  fabTop: {
    bottom: 80,
    right: 20,
    backgroundColor: COLORS.primary,
    position: "absolute",
  },
});
