// contexts/ProfileContext.jsx
import {
    EmailAuthProvider,
    updateProfile as firebaseUpdateProfile,
    reauthenticateWithCredential,
    updatePassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useState } from 'react';
import { auth, db } from '../../firebase/FirebaseConfig';

// Crear el contexto
const ProfileContext = createContext({});

// Hook personalizado
export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 1. ACTUALIZAR NOMBRE DEL USUARIO
  const updateUserName = async (newName) => {
    try {
      setLoading(true);
      console.log("🔄 [PROFILE] Actualizando nombre:", newName);

      // Validaciones
      if (!newName || !newName.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }

      const trimmedName = newName.trim();
      if (trimmedName.length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Verificar si el nombre es diferente al actual
      if (trimmedName === currentUser.displayName) {
        return {
          success: true,
          message: 'El nombre ya está actualizado',
          noChanges: true
        };
      }

      // 1. Actualizar en Firebase Authentication
      console.log("📤 [PROFILE] Actualizando en Firebase Auth...");
      await firebaseUpdateProfile(currentUser, {
        displayName: trimmedName
      });
      console.log("✅ [PROFILE] Nombre actualizado en Firebase Auth");

      // 2. Actualizar en Firestore
      console.log("📤 [PROFILE] Actualizando en Firestore...");
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        displayName: trimmedName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("✅ [PROFILE] Nombre actualizado en Firestore");

      return {
        success: true,
        message: 'Nombre actualizado correctamente',
        newName: trimmedName,
        user: auth.currentUser // Devuelve el usuario actualizado
      };

    } catch (error) {
      console.error("❌ [PROFILE] Error actualizando nombre:", error);

      let errorMessage = 'Error al actualizar el nombre';
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Debes volver a iniciar sesión para actualizar tu perfil';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        default:
          errorMessage = error.message || 'Error desconocido';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    } finally {
      setLoading(false);
    }
  };

  // 2. CAMBIAR CONTRASEÑA
  const changeUserPassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      console.log("🔄 [PROFILE] Cambiando contraseña...");

      // Validaciones
      if (!currentPassword || !currentPassword.trim()) {
        throw new Error('La contraseña actual es requerida');
      }

      if (!newPassword || !newPassword.trim()) {
        throw new Error('La nueva contraseña es requerida');
      }

      if (newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      if (newPassword === currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No hay usuario autenticado');
      }

      // 1. Reautenticar al usuario (Firebase requiere esto)
      console.log("🔐 [PROFILE] Reautenticando usuario...");
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      console.log("✅ [PROFILE] Reautenticación exitosa");

      // 2. Actualizar contraseña
      console.log("🔑 [PROFILE] Actualizando contraseña...");
      await updatePassword(currentUser, newPassword);
      console.log("✅ [PROFILE] Contraseña actualizada");

      // 3. Registrar cambio en Firestore (opcional, para auditoría)
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("📝 [PROFILE] Registro de cambio guardado en Firestore");
      } catch (firestoreError) {
        console.warn("⚠️ [PROFILE] No se pudo registrar en Firestore:", firestoreError);
        // No es crítico, continuamos
      }

      return {
        success: true,
        message: 'Contraseña cambiada exitosamente'
      };

    } catch (error) {
      console.error("❌ [PROFILE] Error cambiando contraseña:", error);

      let errorMessage = 'Error al cambiar la contraseña';
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'La contraseña actual es incorrecta';
          break;
        case 'auth/weak-password':
          errorMessage = 'La nueva contraseña es muy débil. Usa al menos 6 caracteres';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Para cambiar la contraseña debes volver a iniciar sesión';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        default:
          errorMessage = error.message || 'Error desconocido';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    } finally {
      setLoading(false);
    }
  };

  // 3. ACTUALIZAR EMAIL (requiere verificación)
  const updateUserEmail = async (newEmail, password) => {
    try {
      setLoading(true);
      console.log("🔄 [PROFILE] Actualizando email a:", newEmail);

      // Validaciones
      if (!newEmail || !newEmail.trim()) {
        throw new Error('El nuevo email es requerido');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail.trim())) {
        throw new Error('El formato del email es inválido');
      }

      if (!password || !password.trim()) {
        throw new Error('La contraseña es requerida para cambiar el email');
      }

      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No hay usuario autenticado');
      }

      // Verificar si el email es diferente al actual
      if (newEmail.trim() === currentUser.email) {
        return {
          success: true,
          message: 'El email ya está actualizado',
          noChanges: true
        };
      }

      // 1. Reautenticar
      console.log("🔐 [PROFILE] Reautenticando para cambiar email...");
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      console.log("✅ [PROFILE] Reautenticación exitosa");

      // NOTA: En Firebase, cambiar email es más complejo y requiere verificación
      // Por ahora, solo devolvemos un mensaje informativo
      console.log("ℹ️ [PROFILE] Cambio de email requiere implementación adicional");

      return {
        success: false,
        error: 'Cambio de email no disponible temporalmente. Contacta al administrador.',
        requiresVerification: true
      };

    } catch (error) {
      console.error("❌ [PROFILE] Error actualizando email:", error);

      let errorMessage = 'Error al actualizar el email';
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Este email ya está en uso por otra cuenta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del email es inválido';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Debes volver a iniciar sesión para cambiar el email';
          break;
        default:
          errorMessage = error.message || 'Error desconocido';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    } finally {
      setLoading(false);
    }
  };

  // 4. VERIFICAR CONTRASEÑA ACTUAL (para operaciones sensibles)
  const verifyCurrentPassword = async (password) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        return {
          success: false,
          error: 'No hay usuario autenticado'
        };
      }

      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      return {
        success: true,
        message: 'Contraseña verificada correctamente'
      };

    } catch (error) {
      console.error("❌ [PROFILE] Error verificando contraseña:", error);

      let errorMessage = 'Error al verificar contraseña';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  };

  // 5. ACTUALIZAR FOTO DE PERFIL (si decides implementarlo después)
  const updateProfilePhoto = async (imageUri) => {
    try {
      setLoading(true);
      setUploadProgress(0);
      
      console.log("🔄 [PROFILE] Actualizando foto de perfil...");

      // Validaciones
      if (!imageUri) {
        throw new Error('No se proporcionó una imagen');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Simular progreso de subida (en una implementación real usarías Firebase Storage)
      const simulateUpload = () => {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 100) {
                clearInterval(interval);
                resolve();
                return 100;
              }
              return prev + 10;
            });
          }, 200);
        });
      };

      await simulateUpload();

      // Aquí iría la lógica real para subir a Firebase Storage
      console.log("ℹ️ [PROFILE] Implementación de subida de imagen pendiente");

      return {
        success: false,
        error: 'Actualización de foto no disponible temporalmente',
        feature: 'profile_photo'
      };

    } catch (error) {
      console.error("❌ [PROFILE] Error actualizando foto:", error);
      return {
        success: false,
        error: error.message || 'Error al actualizar la foto'
      };
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // 6. VALIDAR FORMATO DE NOMBRE
  const validateName = (name) => {
    if (!name || !name.trim()) {
      return {
        isValid: false,
        error: 'El nombre no puede estar vacío'
      };
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      return {
        isValid: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      };
    }

    if (trimmedName.length > 50) {
      return {
        isValid: false,
        error: 'El nombre no puede exceder 50 caracteres'
      };
    }

    return {
      isValid: true,
      cleanedName: trimmedName
    };
  };

  // 7. VALIDAR FORMATO DE CONTRASEÑA
  const validatePassword = (password) => {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    // Puedes añadir más validaciones aquí
    // Ej: mayúsculas, números, caracteres especiales
    
    return {
      isValid: true
    };
  };

  // Valor del contexto
  const value = {
    // Estados
    loading,
    uploadProgress,
    
    // Funciones principales
    updateUserName,
    changeUserPassword,
    updateUserEmail,
    verifyCurrentPassword,
    updateProfilePhoto,
    
    // Funciones de validación
    validateName,
    validatePassword,
    
    // Funciones de utilidad
    clearProgress: () => setUploadProgress(0),
    
    // Alias para compatibilidad
    updateProfile: updateUserName, // Alias para updateUserName
    changePassword: changeUserPassword, // Alias para changeUserPassword
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// Export default para Expo Router
export default ProfileProvider;