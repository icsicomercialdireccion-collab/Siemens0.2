// app/_layout.jsx - VERSIÓN SIMPLE SIN BUCLE

import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react"; // 👈 Agrega esto
import { ActivityIndicator, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import ErrorBoundaty from "./components/ErrorBoundary";
import SafeScreen from "./components/safeScreen";
import { AuthProvider, useAuth } from "./contexts/AutContext";
import { EquipmentProvider } from "./contexts/EquipmentContext";
import { InventoryProvider, useInventory } from "./contexts/InventoryContext";
import { ProfileProvider } from "./contexts/ProfileContext";

function AuthHandler() {
  const {
    user,
    loading: authLoading,
    userData,
    initialized: authInitialized,
  } = useAuth();
  const { loading: inventoryLoading, initialized: inventoryInitialized } =
    useInventory();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log("📊 [LAYOUT] Estado:", {
      authLoading,
      authInitialized,
      inventoryLoading,
      inventoryInitialized,
      hasUser: !!user,
      hasUserData: !!userData,
      role: userData?.role,
      hasRedirected,
    });
  }, [
    authLoading,
    authInitialized,
    inventoryLoading,
    inventoryInitialized,
    user,
    userData,
    hasRedirected,
  ]);

  // 1. Loading
  if (
    authLoading ||
    !authInitialized ||
    inventoryLoading ||
    !inventoryInitialized
  ) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10 }}>
          {authLoading
            ? "Iniciando sesión..."
            : !authInitialized
              ? "Cargando perfil..."
              : inventoryLoading
                ? "Cargando inventarios..."
                : "Preparando aplicación..."}
        </Text>
      </View>
    );
  }

  // 2. No autenticado → Solo auth
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }

  // 3. Esperando userData
  if (!userData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text>Cargando datos del usuario...</Text>
      </View>
    );
  }

  // 4. Autenticado y con userData → Mostrar rutas según rol
  console.log(`🎯 Rol detectado: ${userData.role}`);

  if (userData.role === "admin") {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs-admin)" />
        <Stack.Screen name="(forms)" />
        <Stack.Screen name="(details)" />
        <Stack.Screen name="(equipment-detail)" />
        {/* NO incluir (tabs) aquí para admin */}
      </Stack>
    );
  } else {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(forms)" />
        <Stack.Screen name="(details)" />
        <Stack.Screen name="(equipment-detail)" />
        {/* NO incluir (tabs-admin) aquí para user */}
      </Stack>
    );
  }
}

const LoadingScreen = ({ message }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.background,
    }}
  >
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ marginTop: 15, color: COLORS.text }}>{message}</Text>
  </View>
);

export default function RootLayout() {
  return (
    <ErrorBoundaty>
      <AuthProvider>
        <ProfileProvider>
          <InventoryProvider>
            <EquipmentProvider>
              <SafeScreen
                style={{ flex: 1, backgroundColor: COLORS.background }}
              >
                <AuthHandler />
              </SafeScreen>
            </EquipmentProvider>
          </InventoryProvider>
        </ProfileProvider>
      </AuthProvider>
    </ErrorBoundaty>
  );
}
