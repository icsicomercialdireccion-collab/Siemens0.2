// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';



export default function RootLayout() {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.background}}>
      
      <Stack screenOptions={{ headerShown: false }}>
        {/* Las rutas se cargan automáticamente */}
      </Stack>
    </SafeAreaView>
  );
}