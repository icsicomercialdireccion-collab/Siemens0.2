// app.config.js - VERSIÓN CORREGIDA PARA react-native-image-picker
import "dotenv/config";

export default {
  expo: {
    name: "Siemens",
    slug: "siemens-app",
    version: "1.1.1",
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
        "expo-media-library",
        {
          photosPermission:
            "Permite a Siemens acceder a tus fotos para guardar imágenes de inventario.",
          savePhotosPermission:
            "Permite a Siemens guardar fotos en tu galería.",
          isAccessMediaLocationEnabled: true,
          microphonePermission:
            "Permite a Siemens acceder al micrófono para funciones de cámara.",
          // Configuración para Android 13+
          androidPermissions: [
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.RECORD_AUDIO",
          ],
        },
      ],
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
        NSPhotoLibraryAddUsageDescription:
          "Esta app guarda fotos en tu galería.",
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0066A1",
        foregroundImageType: "png",
      },
      package: "com.siemens.inventario02",
      versionCode: 2,
      // CONFIGURACIONES CRÍTICAS PARA GRADLE
      compileSdkVersion: 35,
      targetSdkVersion: 35,
      buildToolsVersion: "35.0.0",

      config: {
        largeHeap: true, // Permite usar más memoria
      },

      // Si usas diferentes flavors
      flavor: "production",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO", // 👈 Para compatibilidad
        "android.permission.READ_MEDIA_AUDIO", // 👈 Requerido por media-library
        "android.permission.RECORD_AUDIO",
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
