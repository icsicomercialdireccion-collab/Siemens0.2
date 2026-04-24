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
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase/FirebaseConfig";

// Crear el contexto
const AuthContext = createContext({});

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [isTokenRefreshing, setIsTokenRefreshing] = useState(false);
  const [lastTokenRefresh, setLastTokenRefresh] = useState(null);

  // 🔥 FIX CRÍTICO: Cargar userData inmediatamente cuando cambia el usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await loadUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      setInitialized(true);
      if (initialLoad) {
        setInitialLoad(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔥 NUEVO: Función para manejar refresh de tokens
  const handleTokenRefresh = async (firebaseUser) => {
    try {
      // Obtener información del token actual
      const tokenResult = await firebaseUser.getIdTokenResult(false);
      const expiration = new Date(tokenResult.expirationTime);
      const now = new Date();
      const minutesLeft = (expiration - now) / (1000 * 60);

      // Guardar token y expiración
      setToken(tokenResult.token);
      setTokenExpiry(expiration);

      // Si el token está por expirar (< 5 min), refrescar automáticamente
      if (minutesLeft < 5) {
        await refreshToken(firebaseUser);
      }
    } catch (error) {
      console.error("❌ [AUTH] Error verificando token:", error);

      // Intentar forzar refresh
      try {
        await refreshToken(firebaseUser);
      } catch (refreshError) {
        console.error(
          "❌ [AUTH] Error crítico al refrescar token:",
          refreshError,
        );

        // Forzar logout si no se puede recuperar
        if (
          refreshError.code === "auth/user-token-expired" ||
          refreshError.code === "auth/invalid-user-token"
        ) {
          await auth.signOut();
        }
      }
    }
  };

  // 🔥 NUEVO: Función para refrescar token
  const refreshToken = async (firebaseUser) => {
    if (isTokenRefreshing) {
      return;
    }

    setIsTokenRefreshing(true);

    try {
      // Forzar refresh
      const newToken = await firebaseUser.getIdToken(true);
      const tokenResult = await firebaseUser.getIdTokenResult(true);

      // Actualizar estados
      setToken(newToken);
      setTokenExpiry(new Date(tokenResult.expirationTime));
      setLastTokenRefresh(new Date());
    } catch (error) {
      console.error("❌ [AUTH] Error refrescando token:", error);
      throw error;
    } finally {
      setIsTokenRefreshing(false);
    }
  };

  // 🔥 FIX: Función loadUserData mejorada
  const loadUserData = async (userId) => {
    try {
      if (!userId) {
        return;
      }

      const userDocRef = doc(db, "users", userId);

      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();

        // 🔥 FIX CRÍTICO: Asegurar que se actualiza el estado
        setUserData(data);
      } else {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          return;
        }

        const defaultUserData = {
          uid: userId,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
          createdAt: new Date().toISOString(),
          role: "user", // Por defecto
          active: true,
        };

        await setDoc(userDocRef, defaultUserData);

        // 🔥 FIX: Actualizar estado inmediatamente
        setUserData(defaultUserData);
      }

      //return data
    } catch (error) {
      console.error("❌ [AUTH] Error en loadUserData:", error);
      console.error("   Código:", error.code);
      console.error("   Mensaje:", error.message);
    }
  };

  // 🔥 FIX: Función login mejorada
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // 🔥 FIX CRÍTICO: Esperar explícitamente a que cargue userData
      const loadedUserData = await loadUserData(firebaseUser.uid);

      // 🔥 NUEVO: Crear una promesa para esperar la actualización del estado
      // Esperar un momento para que React actualice el estado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar que userData se cargó

      return {
        success: true,
        user: firebaseUser,
        message: "Inicio de sesión exitoso",
        userData: loadedUserData,
        role: loadedUserData?.role,
      };
    } catch (error) {
      let errorMessage = "Error al iniciar sesión";
      let errorCode = error.code;

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "El formato del correo electrónico no es válido";
          break;
        case "auth/invalid-credential":
          // 👈 Este es el nuevo error unificado
          errorMessage = "Correo electrónico o contraseña incorrectos";
          break;
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido deshabilitada";
          break;
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Verifica tu internet";
          break;
        default:
          errorMessage = error.message || "Error desconocido";
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code,
      };
    }
  };

  // 🔥 FIX: Función register mejorada
  const register = async (email, password, displayName = "") => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Actualizar perfil
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      // Crear documento en Firestore
      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || "",
        createdAt: new Date().toISOString(),
        role: "user",
        active: true,
        emailVerified: false,
      };

      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, newUserData);

      // 🔥 FIX: Actualizar estado inmediatamente
      setUserData(newUserData);

      return {
        success: true,
        user: firebaseUser,
        message: "Cuenta creada exitosamente",
      };
    } catch (error) {
      console.error("❌ [AUTH] Error en register:", error);

      let errorMessage = "Error al crear cuenta";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este email ya está registrado";
          break;
        case "auth/invalid-email":
          errorMessage = "Email inválido";
          break;
        case "auth/weak-password":
          errorMessage = "La contraseña debe tener al menos 6 caracteres";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "El registro con email/contraseña no está habilitado";
          break;
        default:
          errorMessage = error.message || "Error desconocido";
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code,
      };
    }
  };
  const loginAndWait = async (email, password) => {
    try {
      // 1. Autenticar
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // 2. Crear una promesa para esperar userData
      return new Promise((resolve) => {
        const checkUserData = () => {
          if (userData) {
            resolve({
              success: true,
              user: firebaseUser,
              userData: userData, // <- ¡Incluir userData en la respuesta!
              message: "Inicio de sesión exitoso",
            });
          } else {
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
        error: error.message,
      };
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      return {
        success: true,
        message: "Sesión cerrada exitosamente",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Error al cerrar sesión",
      };
    }
  };

  // Función para recuperar contraseña
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Email de recuperación enviado",
      };
    } catch (error) {
      let errorMessage = "Error al enviar email";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este email";
          break;
        case "auth/invalid-email":
          errorMessage = "Email inválido";
          break;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Función para actualizar perfil
  const updateUserProfile = async (updates) => {
    try {
      if (!auth.currentUser) throw new Error("No hay usuario autenticado");

      await updateProfile(auth.currentUser, updates);

      if (updates.displayName) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(
          userDocRef,
          { displayName: updates.displayName },
          { merge: true },
        );
        setUserData((prev) => ({ ...prev, displayName: updates.displayName }));
      }

      setUser({ ...auth.currentUser });
      return { success: true, message: "Perfil actualizado" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🔥 NUEVO: Función para forzar recarga de userData
  const forceReloadUserData = async () => {
    if (user) {
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
    initialized,

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
        if (!user?.email) throw new Error("No hay usuario");

        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword,
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        return { success: true, message: "Contraseña cambiada" };
      } catch (error) {
        let errorMessage = "Error al cambiar contraseña";
        switch (error.code) {
          case "auth/wrong-password":
            errorMessage = "Contraseña actual incorrecta";
            break;
          case "auth/weak-password":
            errorMessage = "La nueva contraseña es muy débil";
            break;
        }
        return { success: false, error: errorMessage };
      }
    },

    // Funciones de utilidad
    refreshUserData: () => user && loadUserData(user.uid),
    forceReloadUserData,

    // 🔥 FIX: Función getRedirectPath corregida
    getRedirectPath: () => {
      if (!userData) {
        return null;
      }

      if (userData.role === "admin") {
        return "/(tabs-admin)/home";
      } else {
        return "/(tabs)/home";
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
