import { Stack } from 'expo-router';
import { AuthProvider } from '../app/contexts/AutContext'; // Añade esta importación
import { COLORS } from '../constants/colors';
import SafeScreen from './components/safeScreen';

export default function RootLayout() {
  return (
    //  DEBES envolver TODO con AuthProvider
    <AuthProvider>
      <SafeScreen style={{flex: 1, backgroundColor: COLORS.background}}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Las rutas se cargan automáticamente */}
        </Stack>
      </SafeScreen>
    </AuthProvider>
    //  AuthProvider debe envolver todo
  );
}