// utils/responsive.js - ARCHIVO ÚNICO PARA TODOS
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base de diseño (iPhone 11: 375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Funciones de escala SIMPLES
export const scale = (size) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size, factor = 0.5) => 
  size + (scale(size) - size) * factor;

// Detectar tipo de dispositivo
export const isSmallDevice = width <= 375;    // iPhone SE, 6, 7, 8
export const isMediumDevice = width <= 414;   // iPhone 11 Pro, X
export const isLargeDevice = width > 414;     // Teléfonos grandes
export const isTablet = width >= 768;         // Tablets
export const isLandscape = width > height;

// Breakpoints para estilos condicionales
export const deviceType = {
  isSmall: isSmallDevice,
  isMedium: isMediumDevice,
  isLarge: isLargeDevice,
  isTablet,
  isLandscape,
  width,
  height,
};

// Exportar todo
export default {
  scale,
  verticalScale,
  moderateScale,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isLandscape,
  deviceType,
  width,
  height,
};