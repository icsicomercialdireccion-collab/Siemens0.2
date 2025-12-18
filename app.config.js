// app.config.js - VERSIÓN CORREGIDA
import 'dotenv/config';

export default {
  expo: {
    name: "Siemens0.2",
    slug: "Siemens0.2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "siemens02",
    userInterfaceStyle: "automatic",
    
    // ✅ PLUGINS CORREGIDOS - ELIMINA expo-camera de aquí
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "La app necesita acceso a tus fotos.",
          cameraPermission: "La app necesita acceso a la cámara para tomar fotos."
        }
      ]
      // ❌ REMOVER expo-camera de aquí (ya viene incluido en Expo)
    ],
    
    // ✅ AGREGAR CONFIGURACIÓN DE PERMISOS EN EL NIVEL PRINCIPAL
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.siemens.inventario02",
      infoPlist: {
        NSCameraUsageDescription: "Esta app usa la cámara para escanear códigos de barras y tomar fotos.",
        NSPhotoLibraryUsageDescription: "Esta app necesita acceso a la galería para seleccionar fotos.",
        NSPhotoLibraryAddUsageDescription: "Esta app necesita permiso para guardar fotos.",
      },
      // ✅ Permisos para iOS
      cameraPermission: "Permite que $(PRODUCT_NAME) acceda a tu cámara para escanear códigos de barras y tomar fotos."
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#E6F4FE"
      },
      package: "com.siemens.inventario02",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO" // Opcional si usas video
      ],
      // ✅ Permisos para Android
      cameraPermission: "Permite que $(PRODUCT_NAME) acceda a tu cámara para escanear códigos de barras y tomar fotos."
    },
    
    web: {
      favicon: "./assets/images/favicon.png",
    },
    
    extra: {
      // Variables de Firebase
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }
  }
};