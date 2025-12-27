// utils/responsiveStyle.js - WRAPPER PARA STYLESHEET
import { StyleSheet } from 'react-native';
import responsive from './responsive';

const { scale, verticalScale, moderateScale, deviceType } = responsive;

// Crear StyleSheet con escalas automáticas
export const createResponsiveStyle = (styles) => {
  const processedStyles = {};
  
  Object.keys(styles).forEach(key => {
    if (typeof styles[key] === 'object' && styles[key] !== null) {
      processedStyles[key] = {};
      
      Object.keys(styles[key]).forEach(styleKey => {
        const value = styles[key][styleKey];
        
        // Aplicar escalas automáticamente a números
        if (typeof value === 'number') {
          // Escalar propiedades de tamaño
          if (styleKey.includes('fontSize') || 
              styleKey.includes('lineHeight') || 
              styleKey === 'borderRadius' ||
              styleKey === 'borderWidth') {
            processedStyles[key][styleKey] = moderateScale(value);
          }
          // Escalar padding/margin horizontales
          else if (styleKey.includes('paddingHorizontal') || 
                   styleKey.includes('marginHorizontal') ||
                   styleKey === 'paddingLeft' || styleKey === 'paddingRight' ||
                   styleKey === 'marginLeft' || styleKey === 'marginRight') {
            processedStyles[key][styleKey] = scale(value);
          }
          // Escalar padding/margin verticales
          else if (styleKey.includes('paddingVertical') || 
                   styleKey.includes('marginVertical') ||
                   styleKey === 'paddingTop' || styleKey === 'paddingBottom' ||
                   styleKey === 'marginTop' || styleKey === 'marginBottom') {
            processedStyles[key][styleKey] = verticalScale(value);
          }
          // Otros números (width, height, etc.)
          else if (styleKey === 'width' || styleKey === 'height' ||
                   styleKey === 'minWidth' || styleKey === 'maxWidth' ||
                   styleKey === 'minHeight' || styleKey === 'maxHeight') {
            processedStyles[key][styleKey] = scale(value);
          }
          // Mantener otros números sin escalar
          else {
            processedStyles[key][styleKey] = value;
          }
        }
        // Mantener otros tipos de valores
        else {
          processedStyles[key][styleKey] = value;
        }
      });
      
      // Agregar estilos condicionales para tablets
      if (deviceType.isTablet) {
        processedStyles[key] = {
          ...processedStyles[key],
          ...(styles[`${key}Tablet`] || {})
        };
      }
      // Agregar estilos condicionales para pantallas pequeñas
      if (deviceType.isSmall) {
        processedStyles[key] = {
          ...processedStyles[key],
          ...(styles[`${key}Small`] || {})
        };
      }
    }
  });
  
  return StyleSheet.create(processedStyles);
};

// Métodos directos para usar en componentes
export const rs = (size) => moderateScale(size);  // Responsive Size
export const rv = (size) => verticalScale(size);  // Responsive Vertical
export const rh = (size) => scale(size);          // Responsive Horizontal

export default createResponsiveStyle;