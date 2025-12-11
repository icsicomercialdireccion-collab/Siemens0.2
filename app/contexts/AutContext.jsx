// contexts/AuthContext.jsx
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
import { auth, db } from '../../firebase/FirebaseConfig'; // Ajusta la ruta según tu estructura

// Crear el contexto
const AuthContext = createContext({});

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // Datos adicionales del usuario de Firestore

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Cargar datos adicionales del usuario desde Firestore
        await loadUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return unsubscribe;
  }, []);

  // Cargar datos adicionales del usuario desde Firestore
  const loadUserData = async (userId) => {
  try {
    console.log("🔍 Loading user data for:", userId);

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    console.log("📄 Document exists?", userDoc.exists());
    console.log("📊 Document data:", userDoc.data());
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("🎭 User role from Firestore:", data.role);
      setUserData(data);
    
    } else {
      // OBTENER EL USER ACTUAL DE AUTH
      console.log("⚠️ No document, creating default...");

      const currentUser = auth.currentUser;
      
      const defaultUserData = {
        uid: userId,
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || '',
        createdAt: new Date().toISOString(),
        role: 'user',
        active: true
      };
      
      await setDoc(userDocRef, defaultUserData);
      setUserData(defaultUserData);
    }
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
  }
};

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Cargar datos del usuario
      await loadUserData(firebaseUser.uid);
      
      return { 
        success: true, 
        user: firebaseUser,
        message: 'Inicio de sesión exitoso'
      };
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      // Manejo específico de errores de Firebase
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
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code 
      };
    }
  };

  // Función para registrar usuario
  const register = async (email, password, displayName = '') => {
    
    console.log(" Registrando usuario:", email);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log("📝 Creando usuario en Firebase...");
      console.log("✅ Usuario creado:", userCredential.user.uid);
      
      // Actualizar perfil con displayName si se proporciona
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }
      
      // Enviar email de verificación (opcional)
      // await sendEmailVerification(firebaseUser);
      
      // Crear documento del usuario en Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || '',
        createdAt: new Date().toISOString(),
        role: 'user',
        active: true,
        emailVerified: false
      };
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, userData);
      
      // Actualizar estado local
      setUserData(userData);
      
      return { 
        success: true, 
        user: firebaseUser,
        message: 'Cuenta creada exitosamente',
      };
    } catch (error) {
      let errorMessage = 'Error al crear cuenta';
      console.error("❌ Error Firebase:", error.code, error.message);

      
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
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code 
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
        message: 'Se ha enviado un email para recuperar tu contraseña' 
      };
    } catch (error) {
      let errorMessage = 'Error al enviar email de recuperación';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Función para actualizar perfil
  const updateUserProfile = async (updates) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No hay usuario autenticado');
      }
      
      await updateProfile(auth.currentUser, updates);
      
      // Actualizar también en Firestore si es necesario
      if (updates.displayName) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { displayName: updates.displayName }, { merge: true });
        setUserData(prev => ({ ...prev, displayName: updates.displayName }));
      }
      
      // Actualizar estado local
      setUser({ ...auth.currentUser });
      
      return { success: true, message: 'Perfil actualizado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función para cambiar contraseña (requiere reautenticación)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Cambiar la contraseña
      await updatePassword(user, newPassword);
      
      return { success: true, message: 'Contraseña cambiada exitosamente' };
    } catch (error) {
      let errorMessage = 'Error al cambiar contraseña';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Contraseña actual incorrecta';
          break;
        case 'auth/weak-password':
          errorMessage = 'La nueva contraseña es muy débil';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Debes iniciar sesión nuevamente para cambiar la contraseña';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Valor del contexto
  const value = {
    // Estados
    user,
    userData,
    loading,
    
    // Estados derivados
    isSignedIn: !!user,
    isEmailVerified: user?.emailVerified || false,
    
    // Funciones de autenticación
    login,
    register,
    logout,
    resetPassword,
    
    // Funciones de perfil
    updateUserProfile,
    changePassword,
    
    // Función para refrescar datos del usuario
    refreshUserData: () => user && loadUserData(user.uid)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};