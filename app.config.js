// app.config.js - VERSIÓN CORREGIDA PARA react-native-image-picker
import "dotenv/config";

export default {
  expo: {
    name: "Siemens",
    slug: "siemens-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "siemens02",
    userInterfaceStyle: "automatic",

    owner: "martin.lara",
    // IMPORTANTE: Agrega newArchEnabled
    //newArchEnabled: false, Desactiva el nuevo architecture si causa problemas

    splash: {
      image: "./assets/images/splash-icon.png", // Imagen del splash (1242x2436)
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      // Color de fondo del splash
    },

    // ✅ PLUGINS SIMPLIFICADOS - SIN expo-media-library
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            // ¡Esta es la clave! Establece compileSdkVersion a 33 o 34.
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            enablePngGeneration: true,
            disableWebpGeneration: true,
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      "expo-router",
    ],

    // ✅ PERMISOS SIMPLIFICADOS
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.siemens.inventario02",
      infoPlist: {
        NSCameraUsageDescription:
          "Esta app usa la cámara para escanear códigos de barras y tomar fotos.",
        NSPhotoLibraryUsageDescription:
          "Esta app necesita acceso a la galería para seleccionar fotos.",
        // ❌ ELIMINAR NSPhotoLibraryAddUsageDescription (solo si guardas fotos)
        // ❌ ELIMINAR NSMicrophoneUsageDescription (solo si usas video/audio)
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0066A1",
        foregroundImageType: "png",
      },
      package: "com.siemens.inventario02",
      versionCode: 1,
      // CONFIGURACIONES CRÍTICAS PARA GRADLE
      compileSdkVersion: 35,
      targetSdkVersion: 35,
      buildToolsVersion: "35.0.0",

      // Si usas diferentes flavors
      flavor: "production",
      permissions: [
        "android.permission.CAMERA", // Para escanear y tomar fotos
        // Para react-native-image-picker (solo lectura):
        "android.permission.READ_EXTERNAL_STORAGE",
        // ❌ ELIMINAR WRITE_EXTERNAL_STORAGE (solo si guardas fotos)
        // ❌ ELIMINAR RECORD_AUDIO (solo si usas video)
        // Para Android 13+:
        "android.permission.READ_MEDIA_IMAGES",
      ],
      cameraPermission:
        "Permite que $(PRODUCT_NAME) acceda a tu cámara para escanear códigos de barras y tomar fotos.",
    },

    extra: {
      eas: {
        projectId: "5a3ca8c8-8efb-4162-9ed2-79c3031d4695",
      },

      // Variables de Firebase
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
  },
};
