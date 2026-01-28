// app/_layout.jsx - VERSIÓN SIMPLE SIN BUCLE

import { Stack, useRouter } from "expo-router";
import { useEffect } from "react"; // 👈 Agrega esto
import { ActivityIndicator, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import SafeScreen from "./components/safeScreen";
import { AuthProvider, useAuth } from "./contexts/AutContext";
import { EquipmentProvider } from "./contexts/EquipmentContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import { ProfileProvider } from "./contexts/ProfileContext";

function AuthHandler() {
  const { user, loading, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userData) {
      console.log("✅ Usuario autenticado, redirigiendo...");
      if (userData.role === "admin") {
        router.replace("/(tabs-admin)"); // 👈 Redirige a tabs-admin
      } else {
        router.replace("/(tabs)"); // 👈 Redirige a tabs regular
      }
    }
  }, [user, loading, userData, router]);

  // 1. Loading
  if (loading) {
    return <LoadingScreen message="Cargando..." />;
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
    return <LoadingScreen message="Cargando perfil..." />;
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
    <AuthProvider>
      <ProfileProvider>
        <InventoryProvider>
          <EquipmentProvider>
            <SafeScreen style={{ flex: 1, backgroundColor: COLORS.background }}>
              <AuthHandler />
            </SafeScreen>
          </EquipmentProvider>
        </InventoryProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
