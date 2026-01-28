// firebase/FirebaseConfig.js - VERSIÓN CORREGIDA
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Firebase v9+ modular imports
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId,
};

// ✅ 1. Inicializar la app de Firebase
const app = initializeApp(firebaseConfig);

// ✅ 2. Inicializar Auth CON PERSISTENCIA (esto soluciona la advertencia)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ 3. Inicializar otros servicios
const db = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);
const functions = getFunctions(app);

// ✅ 4. Exportar todos los servicios
export { app, auth, database, db, functions, storage };

// Exportación por defecto (opcional)
export default app;
