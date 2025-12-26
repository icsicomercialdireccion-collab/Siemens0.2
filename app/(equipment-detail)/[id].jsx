// app/(equipment-detail)/[id].jsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PcDetailStyle } from '../../assets/styles/pc.details';
import { COLORS } from '../../constants/colors';
import { useEquipment } from '../contexts/EquipmentContext';

export default function EquipmentDetailScreen() {

  const { id: equipmentId, inventoryId } = useLocalSearchParams();
  const router = useRouter();
  const { getEquipment, deleteEquipment, updateEquipment, loading } = useEquipment();
  
  const [equipment, setEquipment] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    if (equipmentId && inventoryId) {
      loadEquipment();
    }
  }, [equipmentId, inventoryId]);

  const loadEquipment = async () => {
    try {
      setLoadingDetail(true);
      const result = await getEquipment(inventoryId, equipmentId);
      
      if (result.success) {
        setEquipment(result.data);
      } else {
        Alert.alert('Error', result.error || 'No se pudo cargar el equipo');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Error al cargar los datos del equipo');
      console.error(error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar equipo',
      `¿Estás seguro de eliminar el equipo ${equipment?.serial}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteEquipment(inventoryId, equipmentId);
              if (result.success) {
                Alert.alert('Éxito', 'Equipo eliminado correctamente', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el equipo');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(forms)/editEquipment',
      params: { 
        inventoryId,
        equipmentId,
        equipmentData: JSON.stringify(equipment)
      }
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'nuevo': return '#4CAF50';
      case 'usado': return '#FF9800';
      case 'reparacion': return '#2196F3';
      case 'danado': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'nuevo': return 'Nuevo';
      case 'usado': return 'Usado';
      case 'reparacion': return 'En Reparación';
      case 'danado': return 'Dañado';
      default: return status;
    }
  };

  const formatDate = (dateInput) => {
    try {
      let date;
      
      if (!dateInput) return 'No disponible';
      
      if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput.toDate) {
        date = dateInput.toDate();
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        return 'No disponible';
      }
      
      if (isNaN(date.getTime())) return 'No disponible';
      
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'No disponible';
    }
  };

  if (loadingDetail) {
    return (
      <View style={PcDetailStyle.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={PcDetailStyle.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={PcDetailStyle.centered}>
        <Text style={PcDetailStyle.errorText}>Equipo no encontrado</Text>
        <TouchableOpacity style={PcDetailStyle.backButton} onPress={() => router.back()}>
          <Text style={PcDetailStyle.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={PcDetailStyle.container}>
      {/* HEADER CON SERIAL */}
      <View style={PcDetailStyle.header}>
        <View style={PcDetailStyle.serialContainer}>
          <Ionicons name="barcode-outline" size={32} color="#fff" />
          <Text style={PcDetailStyle.serialText}>{equipment.serial}</Text>
        </View>
        <View style={[PcDetailStyle.statusBadge, { backgroundColor: getStatusColor(equipment.estado) }]}>
          <Text style={PcDetailStyle.statusText}>{getStatusLabel(equipment.estado)}</Text>
        </View>
      </View>

      {/* IMAGEN PRINCIPAL */}
      {equipment.imagenUrl ? (
        <View style={PcDetailStyle.imageContainer}>
          <Image
            source={{ uri: equipment.imagenUrl }}
            style={PcDetailStyle.mainImage}
            resizeMode="cover"
          />
          <View style={PcDetailStyle.imageOverlay}>
            <Text style={PcDetailStyle.imageCaption}>Fotografía del equipo</Text>
          </View>
        </View>
      ) : (
        <View style={PcDetailStyle.noImageContainer}>
          <Ionicons name="image-outline" size={80} color="#ddd" />
          <Text style={PcDetailStyle.noImageText}>Sin imagen</Text>
        </View>
      )}

      {/* INFORMACIÓN DETALLADA */}
      <View style={PcDetailStyle.infoContainer}>
        <Text style={PcDetailStyle.sectionTitle}>📋 Información del Equipo</Text>
        
        <View style={PcDetailStyle.infoCard}>
          <View style={PcDetailStyle.infoRow}>
            <Ionicons name="cube-outline" size={20} color={COLORS.primary} />
            <Text style={PcDetailStyle.infoLabel}>Tipo:</Text>
            <Text style={PcDetailStyle.infoValue}>{equipment.tipo || 'Computadora'}</Text>
          </View>

          <View style={PcDetailStyle.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={PcDetailStyle.infoLabel}>Fecha registro:</Text>
            <Text style={PcDetailStyle.infoValue}>{formatDate(equipment.createdAt)}</Text>
          </View>

          <View style={PcDetailStyle.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={PcDetailStyle.infoLabel}>Última actualización:</Text>
            <Text style={PcDetailStyle.infoValue}>{formatDate(equipment.updatedAt)}</Text>
          </View>

          {equipment.observaciones && (
            <View style={PcDetailStyle.observationsContainer}>
              <View style={PcDetailStyle.observationsHeader}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                <Text style={PcDetailStyle.observationsTitle}>Observaciones:</Text>
              </View>
              <Text style={PcDetailStyle.observationsText}>{equipment.observaciones}</Text>
            </View>
          )}
        </View>

      </View>

      {/* BOTONES DE ACCIÓN */}
      <View style={PcDetailStyle.actionsContainer}>

        <TouchableOpacity 
          style={[PcDetailStyle.actionButton, PcDetailStyle.editButton]} 
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
          <Text style={PcDetailStyle.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[PcDetailStyle.actionButton, PcDetailStyle.deleteButton]} 
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={PcDetailStyle.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* BOTÓN VOLVER */}
      <TouchableOpacity 
        style={PcDetailStyle.backButtonFull} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        <Text style={PcDetailStyle.backButtonFullText}>Volver al inventario</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

