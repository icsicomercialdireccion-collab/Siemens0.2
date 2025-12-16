import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const isAuthenticated = false; // Cambia a true/false según tu lógica
  
  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }
  
  return <Stack screenOptions={{ headerShown: false }} />;
}