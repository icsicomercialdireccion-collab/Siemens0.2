// contexts/AuthContext.jsx - VERSIÓN CORREGIDA
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebase/FirebaseConfig';

// Crear el contexto
const AuthContext = createContext({});

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // 🔥 FIX CRÍTICO: Cargar userData inmediatamente cuando cambia el usuario
  useEffect(() => {
    console.log("🔄 [AUTH] useEffect iniciado");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("👤 [AUTH] onAuthStateChanged:", firebaseUser?.email);
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log("📥 [AUTH] Usuario detectado, cargando datos...");
        await loadUserData(firebaseUser.uid);
      } else {
        console.log("🚪 [AUTH] No hay usuario, limpiando datos");
        setUserData(null);
      }
      
      if (initialLoad) {
        setInitialLoad(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔥 FIX: Función loadUserData mejorada
  const loadUserData = async (userId) => {
    try {
      console.log("=".repeat(40));
      console.log("📥 [AUTH] loadUserData para:", userId);
      
      if (!userId) {
        console.log("❌ [AUTH] userId es undefined");
        return;
      }

      const userDocRef = doc(db, 'users', userId);
      console.log("📄 [AUTH] Referencia creada");
      
      const userDoc = await getDoc(userDocRef);
      console.log("✅ [AUTH] Documento leído, existe?:", userDoc.exists());
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("🎭 [AUTH] Rol encontrado:", data.role);
        console.log("📊 [AUTH] Datos completos:", data);
        
        // 🔥 FIX CRÍTICO: Asegurar que se actualiza el estado
        setUserData(data);
        console.log("🔄 [AUTH] userData actualizado en estado");
        
      } else {
        console.log("⚠️ [AUTH] No hay documento, creando default...");
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("❌ [AUTH] No hay currentUser para crear default");
          return;
        }
        
        const defaultUserData = {
          uid: userId,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          createdAt: new Date().toISOString(),
          role: 'user', // Por defecto
          active: true
        };
        
        console.log("📝 [AUTH] Creando documento default:", defaultUserData);
        await setDoc(userDocRef, defaultUserData);
        
        // 🔥 FIX: Actualizar estado inmediatamente
        setUserData(defaultUserData);
        console.log("✅ [AUTH] Documento default creado y estado actualizado");
      }
      
      console.log("=".repeat(40));
    } catch (error) {
      console.error('❌ [AUTH] Error en loadUserData:', error);
      console.error('   Código:', error.code);
      console.error('   Mensaje:', error.message);
    }
  };

  // 🔥 FIX: Función login mejorada
  const login = async (email, password) => {
    try {
      console.log("=".repeat(40));
      console.log("🔄 [AUTH] login iniciado para:", email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log("✅ [AUTH] Firebase auth exitoso");
      console.log("   UID:", firebaseUser.uid);
      console.log("   Email:", firebaseUser.email);
      
      // 🔥 FIX CRÍTICO: Esperar explícitamente a que cargue userData
      console.log("📥 [AUTH] Cargando userData después de login...");
      await loadUserData(firebaseUser.uid);

      // 🔥 NUEVO: Crear una promesa para esperar la actualización del estado
      // Esperar un momento para que React actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar que userData se cargó
      console.log("🔍 [AUTH] userData después de loadUserData:", userData);
      
      console.log("=".repeat(40));
      
      return { 
        success: true, 
        user: firebaseUser,
        message: 'Inicio de sesión exitoso'
      };
      
    } catch (error) {
      console.error("❌ [AUTH] Error en login:", error);
      
      let errorMessage = 'Error al iniciar sesión';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
        default:
          errorMessage = error.message || 'Error desconocido';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code 
      };
    }
  };

  // 🔥 FIX: Función register mejorada
  const register = async (email, password, displayName = '') => {
    try {
      console.log("🔄 [AUTH] Registrando:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log("✅ [AUTH] Usuario creado en Auth:", firebaseUser.uid);
      
      // Actualizar perfil
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }
      
      // Crear documento en Firestore
      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || '',
        createdAt: new Date().toISOString(),
        role: 'user', // Todos nuevos son 'user' por defecto
        active: true,
        emailVerified: false
      };
      
      console.log("📝 [AUTH] Creando documento en Firestore:", newUserData);
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, newUserData);
      
      // 🔥 FIX: Actualizar estado inmediatamente
      setUserData(newUserData);
      console.log("✅ [AUTH] Estado actualizado");
      
      return { 
        success: true, 
        user: firebaseUser,
        message: 'Cuenta creada exitosamente',
      };
      
    } catch (error) {
      console.error("❌ [AUTH] Error en register:", error);
      
      let errorMessage = 'Error al crear cuenta';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email ya está registrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'El registro con email/contraseña no está habilitado';
          break;
        default:
          errorMessage = error.message || 'Error desconocido';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code 
      };
    }
  };
  const loginAndWait = async (email, password) => {
  try {
    console.log("=".repeat(40));
    console.log("🔐 [AUTH] loginAndWait para:", email);
    
    // 1. Autenticar
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log("✅ [AUTH] Usuario autenticado:", firebaseUser.uid);
    
    // 2. Crear una promesa para esperar userData
    return new Promise((resolve) => {
      const checkUserData = () => {
        if (userData) {
          console.log("📦 [AUTH] userData cargado:", userData.role);
          resolve({ 
            success: true, 
            user: firebaseUser,
            userData: userData, // <- ¡Incluir userData en la respuesta!
            message: 'Inicio de sesión exitoso'
          });
        } else {
          console.log("⏳ [AUTH] Esperando userData...");
          setTimeout(checkUserData, 100);
        }
      };
      
      // 3. Iniciar carga de userData
      loadUserData(firebaseUser.uid);
      
      // 4. Comenzar a verificar
      setTimeout(checkUserData, 500);
    });
    
  } catch (error) {
    console.error("❌ [AUTH] Error:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};


  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      return { 
        success: true, 
        message: 'Sesión cerrada exitosamente' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Error al cerrar sesión' 
      };
    }
  };

  // Función para recuperar contraseña
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: 'Email de recuperación enviado' 
      };
    } catch (error) {
      let errorMessage = 'Error al enviar email';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Función para actualizar perfil
  const updateUserProfile = async (updates) => {
    try {
      if (!auth.currentUser) throw new Error('No hay usuario autenticado');
      
      await updateProfile(auth.currentUser, updates);
      
      if (updates.displayName) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { displayName: updates.displayName }, { merge: true });
        setUserData(prev => ({ ...prev, displayName: updates.displayName }));
      }
      
      setUser({ ...auth.currentUser });
      return { success: true, message: 'Perfil actualizado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🔥 NUEVO: Función para verificar el estado actual
  const debugAuthState = () => {
    console.log("=".repeat(40));
    console.log("🐛 [AUTH] DEBUG - Estado actual:");
    console.log("   auth.currentUser:", auth.currentUser?.email);
    console.log("   estado user:", user?.email);
    console.log("   estado userData:", userData);
    console.log("   estado loading:", loading);
    console.log("=".repeat(40));
  };

  // 🔥 NUEVO: Función para forzar recarga de userData
  const forceReloadUserData = async () => {
    if (user) {
      console.log("🔄 [AUTH] Forzando recarga de userData");
      await loadUserData(user.uid);
    }
  };

  // Valor del contexto
  const value = {
    // Estados
    user,
    userData,
    loading,
    initialLoad,
    
    // Estados derivados
    isSignedIn: !!user,
    isEmailVerified: user?.emailVerified || false,
    userRole: userData?.role || null,
    
    // Funciones de autenticación
    login,
    register,
    logout,
    resetPassword,
    loginAndWait,
    
    // Funciones de perfi
    updateUserProfile,
    changePassword: async (currentPassword, newPassword) => {
      try {
        const user = auth.currentUser;
        if (!user?.email) throw new Error('No hay usuario');
        
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        return { success: true, message: 'Contraseña cambiada' };
      } catch (error) {
        let errorMessage = 'Error al cambiar contraseña';
        switch (error.code) {
          case 'auth/wrong-password':
            errorMessage = 'Contraseña actual incorrecta';
            break;
          case 'auth/weak-password':
            errorMessage = 'La nueva contraseña es muy débil';
            break;
        }
        return { success: false, error: errorMessage };
      }
    },
    
    // Funciones de utilidad
    refreshUserData: () => user && loadUserData(user.uid),
    forceReloadUserData,
    debugAuthState,
    
    // 🔥 FIX: Función getRedirectPath corregida
    getRedirectPath: () => {
      if (!userData) {
        console.log("🛑 [AUTH] getRedirectPath: userData es null");
        return null;
      }
      
      console.log(`🛣️ [AUTH] getRedirectPath: rol=${userData.role}`);
      
      if (userData.role === 'admin') {
        return "/(tabs-admin)/home";
      } else {
        return "/(tabs)/home";
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};