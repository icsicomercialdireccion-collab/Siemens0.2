// app.config.js
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
    newArchEnabled: true,
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.siemens.inventario02",
      infoPlist: {
        NSCameraUsageDescription: "Esta app usa la cámara para escanear códigos de barras y tomar fotos de los equipos del inventario.",
        NSPhotoLibraryUsageDescription: "Esta app necesita acceso a la galería para seleccionar fotos de los equipos.",
        NSPhotoLibraryAddUsageDescription: "Esta app necesita permiso para guardar fotos en la galería.",
        NSMicrophoneUsageDescription: "Esta app necesita acceso al micrófono para grabar video (opcional)."
      }
    },
    
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      package: "com.siemens.inventario02",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      [
        "expo-barcode-scanner",
        {
          cameraPermission: "Permite el acceso a la cámara para escanear códigos de barras de los equipos."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "La app necesita acceso a tus fotos para adjuntar imágenes a los equipos.",
          cameraPermission: "La app necesita acceso a la cámara para tomar fotos de los equipos.",
          microphonePermission: "Permite el acceso al micrófono si quieres grabar videos (opcional)."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Permite el acceso a la cámara para tomar fotos de los equipos.",
          microphonePermission: "Permite el acceso al micrófono para videos.",
          recordAudioAndroid: true
        }
      ]
    ],
    
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
      tsconfigPaths: true
    },
    
    extra: {
      // Esto ahora SÍ leerá las variables de .env
      firebaseApiKey: "AIzaSyDCEYpDhqRJhI-befwQ-Y4sZWZ71rIkICE",
      firebaseAuthDomain: "process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
      firebaseProjectId: "siemens-b9f8b",
      firebaseStorageBucket: "process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
      firebaseMessagingSenderId: "109804774402",
      firebaseAppId: "process.env.EXPO_PUBLIC_FIREBASE_APP_ID",
      firebaseMeasurementId: "G-7G5NFKNG54",
      
      eas: {
        projectId: "tu-project-id-eas"
      },
      
      router: {
        origin: false
      }
    },
    
    runtimeVersion: {
      policy: "appVersion"
    },
    
    updates: {
      url: "https://u.expo.dev/tu-project-id-eas"
    }
  }
};