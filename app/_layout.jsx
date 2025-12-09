import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from '../app/contexts/AutContext'; // Añade esta importación
import { COLORS } from '../constants/colors';

export default function RootLayout() {
  return (
    //  DEBES envolver TODO con AuthProvider
    <AuthProvider>
      <SafeAreaView style={{flex: 1, backgroundColor: COLORS.background}}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Las rutas se cargan automáticamente */}
        </Stack>
      </SafeAreaView>
    </AuthProvider>
    //  AuthProvider debe envolver todo
  );
}