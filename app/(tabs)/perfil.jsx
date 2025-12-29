// app/(profile)/profile.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { profileStyle } from '../../assets/styles/profileScreen.style';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../contexts/AutContext';

export default function PerfilAdminScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      // Aquí podrías obtener más datos del usuario si es necesario
      setUserData({
        name: user.displayName || 'Administrador',
        email: user.email || 'No especificado',
        role: 'Administrador', // Esto debería venir de tu base de datos
        avatarUrl: user.photoURL,
        joinDate: user.metadata?.creationTime || new Date().toISOString(),
        lastLogin: user.metadata?.lastSignInTime || new Date().toISOString(),
        uid: user.uid,
      });
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await logout();
            setLoading(false);
            
            if (result.success) {
              router.replace("/(auth)/login");
            } else {
              Alert.alert("Error", result.error || "No se pudo cerrar sesión");
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push({
      pathname: '/(profile)/editProfile',
      params: { userData: JSON.stringify(userData) }
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'No disponible';
    }
  };

  if (authLoading) {
    return (
      <View style={profileStyle.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={profileStyle.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user || !userData) {
    return (
      <View style={profileStyle.centered}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={profileStyle.errorText}>No se pudo cargar el perfil</Text>
        <TouchableOpacity 
          style={profileStyle.retryButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={profileStyle.retryButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={profileStyle.container} contentContainerStyle={profileStyle.contentContainer}>
      {/* Header con avatar */}
      <View style={profileStyle.header}>
        <View style={profileStyle.avatarContainer}>
          {userData.avatarUrl ? (
            <Image
              source={{ uri: userData.avatarUrl }}
              style={profileStyle.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={profileStyle.avatarPlaceholder}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
          <TouchableOpacity 
            style={profileStyle.editAvatarButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={profileStyle.userName}>{userData.name}</Text>
        <Text style={profileStyle.userEmail}>{userData.email}</Text>
        
        <View style={profileStyle.roleBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
          <Text style={profileStyle.roleText}>{userData.role}</Text>
        </View>
      </View>

      {/* Información del usuario */}
      <View style={profileStyle.infoSection}>
        <View style={profileStyle.sectionHeader}>
          <Text style={profileStyle.sectionTitle}>Información de la cuenta</Text>
          <TouchableOpacity onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={profileStyle.infoCard}>
          {/* Información personal */}
          <View style={profileStyle.infoRow}>
            <View style={profileStyle.infoIcon}>
              <Ionicons name="person-circle-outline" size={20} color="#666" />
            </View>
            <View style={profileStyle.infoContent}>
              <Text style={profileStyle.infoLabel}>Nombre</Text>
              <Text style={profileStyle.infoValue}>{userData.name}</Text>
            </View>
          </View>

          <View style={profileStyle.divider} />

          {/* Email */}
          <View style={profileStyle.infoRow}>
            <View style={profileStyle.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#666" />
            </View>
            <View style={profileStyle.infoContent}>
              <Text style={profileStyle.infoLabel}>Correo electrónico</Text>
              <Text style={profileStyle.infoValue}>{userData.email}</Text>
            </View>
          </View>

          <View style={profileStyle.divider} />

          {/* ID de usuario */}
          <View style={profileStyle.infoRow}>
            <View style={profileStyle.infoIcon}>
              <Ionicons name="key-outline" size={20} color="#666" />
            </View>
            <View style={profileStyle.infoContent}>
              <Text style={profileStyle.infoLabel}>ID de usuario</Text>
              <Text style={[profileStyle.infoValue, profileStyle.userIdText]} numberOfLines={1}>
                {userData.uid}
              </Text>
            </View>
          </View>

          <View style={profileStyle.divider} />

          {/* Fecha de registro */}
          <View style={profileStyle.infoRow}>
            <View style={profileStyle.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </View>
            <View style={profileStyle.infoContent}>
              <Text style={profileStyle.infoLabel}>Cuenta creada</Text>
              <Text style={profileStyle.infoValue}>{formatDate(userData.joinDate)}</Text>
            </View>
          </View>

          <View style={profileStyle.divider} />

          {/* Último acceso */}
          <View style={profileStyle.infoRow}>
            <View style={profileStyle.infoIcon}>
              <Ionicons name="time-outline" size={20} color="#666" />
            </View>
            <View style={profileStyle.infoContent}>
              <Text style={profileStyle.infoLabel}>Último acceso</Text>
              <Text style={profileStyle.infoValue}>{formatDate(userData.lastLogin)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={profileStyle.actionsSection}>
        <Text style={profileStyle.sectionTitle}>Acciones</Text>
        
        <View style={profileStyle.actionsGrid}>
          <TouchableOpacity 
            style={profileStyle.actionButton}
            onPress={handleEditProfile}
          >
            <View style={[profileStyle.actionIcon, profileStyle.editIcon]}>
              <Ionicons name="create-outline" size={22} color="#fff" />
            </View>
            <View style={profileStyle.actionTextContainer}>
              <Text style={profileStyle.actionTitle}>Editar perfil</Text>
              <Text style={profileStyle.actionSubtitle}>Actualizar información</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={profileStyle.actionButton}
            onPress={() => router.push('/(profile)/changePassword')}
          >
            <View style={[profileStyle.actionIcon, profileStyle.securityIcon]}>
              <Ionicons name="lock-closed-outline" size={22} color="#fff" />
            </View>
            <View style={profileStyle.actionTextContainer}>
              <Text style={profileStyle.actionTitle}>Seguridad</Text>
              <Text style={profileStyle.actionSubtitle}>Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

        </View>
      </View>

      {/* Botón de cerrar sesión */}
      <TouchableOpacity 
        style={profileStyle.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
            <Text style={profileStyle.logoutButtonText}> Cerrar sesión</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Versión de la app */}
      <Text style={profileStyle.versionText}>v1.0.0</Text>
    </ScrollView>
  );
}
