// app/(details)/[id].jsx - VERSIÓN CON BOTÓN FLOTANTE
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/FirebaseConfig";
import { useEquipment } from "../contexts/EquipmentContext";

import { Ionicons } from "@expo/vector-icons";
import { detailStyle } from "../../assets/styles/details.style";
import { COLORS } from "../../constants/colors";
import EquipmentList from "../components/EquipmentList";

// app/(details)/[id].jsx - AGREGAR ESTA IMPORTACIÓN
import * as Sharing from "expo-sharing";

import { Directory, File, Paths } from "expo-file-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DetailsScreen() {
  const flatListRef = useRef(null);

  // Función para subir arriba
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const [searchText, setSearchText] = useState("");
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const { id } = useLocalSearchParams();
  const {
    equipments,
    getEquipmentsByInventory,
    deleteEquipment,
    loading: equipmentsLoading,
    clearEquipments,
  } = useEquipment();

  const router = useRouter();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para exportación
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState(null);

  useEffect(() => {
    if (id) {
      loadInventory();
      getEquipmentsByInventory(id);
    }
    return () => {
      clearEquipments();
    };
  }, [id]);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredEquipments(equipments);
    } else {
      const lowerText = searchText.toLowerCase();
      const filtered = equipments.filter((equipment) => {
        return (
          equipment.serial?.toLowerCase().includes(lowerText) ||
          equipment.perfil?.toLowerCase().includes(lowerText) ||
          equipment.ubicacion?.toLowerCase().includes(lowerText) ||
          equipment.esquema?.toLowerCase().includes(lowerText)
        );
      });
      setFilteredEquipments(filtered);
    }
  }, [searchText, equipments]);

  const loadInventory = async () => {
    try {
      const inventoryRef = doc(db, "inventarios", id);
      const inventorySnap = await getDoc(inventoryRef);

      if (inventorySnap.exists()) {
        const data = inventorySnap.data();
        setInventory({
          id: inventorySnap.id,
          ...data,
        });
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipments = () => {
    if (id) {
      getEquipmentsByInventory(id);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadInventory(), loadEquipments()]);
    setRefreshing(false);
  }, [id]);

  const handleDeleteEquipment = async (inventoryId, equipmentId) => {
    try {
      const result = await deleteEquipment(inventoryId, equipmentId);
      if (!result.success) {
        Alert.alert("Error", "No se pudo eliminar el equipo");
      }
    } catch (error) {
      Alert.alert("Error", "Error al eliminar equipo");
    }
  };

  const handleViewEquipment = (equipment) => {
    router.push({
      pathname: "/(equipment-detail)/[id]",
      params: {
        id: equipment.id,
        inventoryId: id,
        equipmentData: JSON.stringify(equipment),
      },
    });
  };

  // ================== FUNCIÓN DE EXPORTACIÓN ==================
  const exportInventory = async () => {
    if (!id || equipments.length === 0) {
      Alert.alert("Error", "No hay equipos para exportar");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setShowExportModal(true);

    try {
      setExportProgress(10);

      const functionUrl = `https://us-central1-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/exportInventory`;

      setExportProgress(30);

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryId: id,
          totalEquipos: equipments.length,
        }),
      });

      setExportProgress(60);

      const data = await response.json();

      if (data.success) {
        setExportProgress(90);

        const downloadUrl = data.data?.exportacion?.downloadUrl;

        if (!downloadUrl) {
          Alert.alert("Error", "No se recibió URL de descarga");
          return;
        }

        if (
          typeof downloadUrl !== "string" ||
          !downloadUrl.startsWith("http")
        ) {
          console.error("URL inválida recibida:", downloadUrl);
          Alert.alert(
            "Error",
            "La URL de descarga no es válida. Verifica en Firebase Storage.",
            [{ text: "OK" }],
          );
          return;
        }

        setLastExportUrl(downloadUrl);
      } else {
        Alert.alert("Error", data.error || "Error al exportar");
        setShowExportModal(false);
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión al exportar");
      setShowExportModal(false);
    } finally {
      setExportProgress(100);
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  // ================== COMPONENTE HEADER PROFESIONAL SIMPLIFICADO ==================
  const ProfessionalHeader = () => {
    if (!inventory) return null;

    const getStatusConfig = () => {
      const status = inventory.estado?.toLowerCase();
      switch (status) {
        case "completado":
          return {
            color: "#10B981",
            icon: "checkmark-circle",
            label: "Completado",
            bgColor: "rgba(16, 185, 129, 0.1)",
          };
        case "en_progreso":
        case "en progreso":
          return {
            color: "#F59E0B",
            icon: "sync-circle",
            label: "En Progreso",
            bgColor: "rgba(245, 158, 11, 0.1)",
          };
        case "pendiente":
          return {
            color: "#6B7280",
            icon: "time",
            label: "Pendiente",
            bgColor: "rgba(107, 114, 128, 0.1)",
          };
        default:
          return {
            color: "#6B7280",
            icon: "help-circle",
            label: "Desconocido",
            bgColor: "rgba(107, 114, 128, 0.1)",
          };
      }
    };

    const statusConfig = getStatusConfig();

    return (
      <View style={detailStyle.headerContainer}>
        <LinearGradient
          colors={[COLORS.primary, "#C8102E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={detailStyle.gradientCard}
        >
          <View style={detailStyle.headerContent}>
            <View style={detailStyle.headerTop}>
              <View style={detailStyle.titleWrapper}>
                <Ionicons name="cube-outline" size={28} color="#FFFFFF" />
                <Text style={detailStyle.inventoryTitle}>
                  {inventory.mes} {inventory.anio}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  detailStyle.exportButton,
                  (exporting || equipments.length === 0) &&
                    detailStyle.exportButtonDisabled,
                ]}
                onPress={exportInventory}
                disabled={exporting || equipments.length === 0}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={detailStyle.exportButtonText}>Exportar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={detailStyle.headerDivider} />

            <View style={detailStyle.infoContainer}>
              {inventory.ubicacion && (
                <View style={detailStyle.infoRow}>
                  <View style={detailStyle.infoItem}>
                    <Ionicons name="location-sharp" size={18} color="#FFD6D6" />
                    <View style={detailStyle.infoContent}>
                      <Text style={detailStyle.infoLabel}>Ubicación</Text>
                      <Text style={detailStyle.infoValue}>
                        {inventory.ubicacion}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={detailStyle.infoRow}>
                <View style={detailStyle.infoItem}>
                  <Ionicons name="location-outline" size={18} color="#FFD6D6" />
                  <View style={detailStyle.infoContent}>
                    <Text style={detailStyle.infoLabel}>Localidad</Text>
                    <Text style={detailStyle.infoValue}>
                      {inventory.localidad || "No especificada"}
                    </Text>
                  </View>
                </View>

                <View style={detailStyle.infoItem}>
                  <Ionicons
                    name={statusConfig.icon}
                    size={18}
                    color="#FFD6D6"
                  />
                  <View style={detailStyle.infoContent}>
                    <Text style={detailStyle.infoLabel}>Estado</Text>
                    <Text style={detailStyle.infoValue}>
                      {inventory.estado}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={detailStyle.infoRow}>
                <View style={detailStyle.infoItem}>
                  <Ionicons name="calendar-outline" size={18} color="#FFD6D6" />
                  <View style={detailStyle.infoContent}>
                    <Text style={detailStyle.infoLabel}>Creado</Text>
                    <Text style={detailStyle.infoValue}>
                      {inventory.createdAt
                        ?.toDate?.()
                        ?.toLocaleDateString("es-ES") ||
                        inventory.fechaCreacion?.toLocaleDateString("es-ES") ||
                        "No disponible"}
                    </Text>
                  </View>
                </View>

                <View style={detailStyle.infoItem}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={18}
                    color="#FFD6D6"
                  />
                  <View style={detailStyle.infoContent}>
                    <Text style={detailStyle.infoLabel}>Total Equipos</Text>
                    <Text style={detailStyle.infoValue}>
                      {inventory.totalEquipos || equipments.length || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // ================== RENDER ITEM PARA FLATLIST ==================
  const renderContent = () => (
    <View style={detailStyle.equipmentSection}>
      <View style={detailStyle.searchContainer}>
        <View style={detailStyle.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={detailStyle.searchInput}
            placeholder="Buscar por serie, perfil, ubicación o esquema..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            clearButtonMode="while-editing"
          />
          {searchText !== "" && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {searchText !== "" && (
          <Text style={detailStyle.searchResultText}>
            {filteredEquipments.length} de {equipments.length} equipos
          </Text>
        )}
      </View>
      <View style={detailStyle.sectionHeader}>
        <Text style={detailStyle.sectionTitle}>Equipos Registrados</Text>
        <Text style={detailStyle.sectionSubtitle}>
          {filteredEquipments.length}{" "}
          {filteredEquipments.length === 1 ? "equipo" : "equipos"} en total
        </Text>
      </View>

      <EquipmentList
        equipments={filteredEquipments}
        loading={equipmentsLoading}
        inventoryId={id}
        onRefresh={onRefresh}
        onPressEquipment={handleViewEquipment}
        onDeleteEquipment={handleDeleteEquipment}
      />

      <View style={{ height: 40 }} />
    </View>
  );

  // ================== MODAL DE EXPORTACIÓN ==================
  const ExportModal = () => {
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
      if (!lastExportUrl) {
        Alert.alert("Error", "No hay archivo para compartir");
        return;
      }

      setIsSharing(true);

      try {
        const tempDir = new Directory(Paths.cache, "temp");
        if (!tempDir.exists) {
          tempDir.create();
        }

        const mes = inventory?.mes || "inventario";
        const estado = inventory?.estado || "ubicacion";
        const localidad = inventory?.localidad || "localidad";
        const fecha = new Date()
          .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");

        let nombreArchivo = `${mes}_${estado}_${localidad}_${fecha}.xlsx`;

        nombreArchivo = nombreArchivo
          .replace(/[ñÑ]/g, (match) => (match === "ñ" ? "n" : "N"))
          .replace(/[áéíóú]/g, (match) => {
            const vocales = { á: "a", é: "e", í: "i", ó: "o", ú: "u" };
            return vocales[match];
          })
          .replace(/[ÁÉÍÓÚ]/g, (match) => {
            const vocales = { Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U" };
            return vocales[match];
          })
          .replace(/[^a-zA-Z0-9_.-]/g, "_");

        const tempFile = new File(tempDir, nombreArchivo);
        const downloadedFile = await File.downloadFileAsync(
          lastExportUrl,
          tempFile,
          {
            idempotent: true,
          },
        );

        await Sharing.shareAsync(downloadedFile.uri, {
          dialogTitle: `Compartir inventario ${mes}`,
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        await tempFile.delete();
      } catch (error) {
        console.error("Error al compartir:", error);
        Alert.alert(
          "Error",
          "No se pudo compartir el archivo: " + error.message,
        );
      } finally {
        setIsSharing(false);
      }
    };

    return (
      <Modal
        transparent={true}
        visible={showExportModal}
        animationType="fade"
        onRequestClose={() => !exporting && setShowExportModal(false)}
      >
        <View style={detailStyle.modalOverlay}>
          <View style={detailStyle.modalContainer}>
            <Text style={detailStyle.modalTitle}>
              {exporting ? "Exportando Inventario" : "Exportación Completada"}
            </Text>

            {exporting ? (
              <>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={detailStyle.modalText}>
                  Procesando {equipments.length} equipos...
                </Text>
                <View style={detailStyle.progressBar}>
                  <View
                    style={[
                      detailStyle.progressFill,
                      { width: `${exportProgress}%` },
                    ]}
                  />
                </View>
                <Text style={detailStyle.progressText}>{exportProgress}%</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                <Text style={detailStyle.modalText}>
                  ¡Inventario exportado exitosamente!
                </Text>

                <TouchableOpacity
                  style={detailStyle.modalButton}
                  onPress={() => {
                    if (lastExportUrl) {
                      Linking.openURL(lastExportUrl);
                    }
                    setShowExportModal(false);
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={detailStyle.modalButtonText}>
                    Descargar Excel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    detailStyle.modalButton,
                    { marginTop: 10, backgroundColor: "#2196F3" },
                  ]}
                  onPress={handleShare}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="share-outline" size={20} color="#fff" />
                      <Text style={detailStyle.modalButtonText}>Compartir</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[detailStyle.modalButtonSecondary, { marginTop: 10 }]}
                  onPress={() => setShowExportModal(false)}
                >
                  <Text style={detailStyle.modalButtonTextSecondary}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ================== RENDER LOADING ==================
  if (loading && !refreshing) {
    return (
      <View style={detailStyle.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={detailStyle.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  // ================== RENDER ERROR ==================
  if (!inventory) {
    return (
      <View style={detailStyle.centered}>
        <Text style={detailStyle.errorText}>Inventario no encontrado</Text>
        <TouchableOpacity
          style={detailStyle.button}
          onPress={() => router.back()}
        >
          <Text style={detailStyle.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ================== RENDER PRINCIPAL CON FLATLIST ==================
  return (
    <View style={detailStyle.container}>
      <FlatList
        ref={flatListRef}
        data={[{ key: "content" }]}
        renderItem={renderContent}
        ListHeaderComponent={<ProfessionalHeader />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />

      {/* ============== BOTONES FLOTANTES ==============*/}
      <View style={detailStyle.fabContainer}>
        {/* Botón flotante para SUBIR ARRIBA (arriba a la derecha) */}
        <TouchableOpacity
          style={[detailStyle.fab, detailStyle.fabTop]}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Botón flotante para AGREGAR equipo (izquierda) */}
        <TouchableOpacity
          style={[detailStyle.fab, detailStyle.fabAdd, detailStyle.fabLeft]}
          onPress={() => router.push(`/(forms)/pcForm?inventoryId=${id}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Botón flotante para EXPORTAR (derecha) */}
        {equipments.length > 0 && (
          <TouchableOpacity
            style={[
              detailStyle.fab,
              detailStyle.fabExport,
              detailStyle.fabRight,
              exporting && detailStyle.fabDisabled,
            ]}
            onPress={exportInventory}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de exportación */}
      <ExportModal />
    </View>
  );
}
