import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { formStyle } from "../../assets/styles/form.style";
import { useInventory } from "../contexts/InventoryContext";

import { COLORS } from "../../constants/colors";

const FormInventory = () => {
  const router = useRouter();
  const { createInventory, loading } = useInventory();

  const [formData, setFormData] = useState({
    mes: "",
    anio: "",
    estado: "",
    localidad: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let hasErrors = false;

    if (!formData.mes.trim()) {
      newErrors.mes = "El mes es requerido";
      hasErrors = true;
    }

    if (!formData.anio.trim()) {
      newErrors.anio = "El año es requerido";
      hasErrors = true;
    } else if (formData.anio.length !== 4 || isNaN(formData.anio)) {
      newErrors.anio = "Ingresa un año válido (4 dígitos)";
      hasErrors = true;
    }

    if (!formData.estado.trim()) {
      newErrors.estado = "El estado es requerido";
      hasErrors = true;
    }

    if (!formData.localidad.trim()) {
      newErrors.localidad = "La localidad es requerida";
      hasErrors = true;
    }

    setErrors(newErrors);

    // Si hay errores, mostrar alerta con los campos faltantes
    if (hasErrors) {
      const camposFaltantes = Object.keys(newErrors)
        .map((key) => {
          const nombres = {
            mes: "Mes",
            anio: "Año",
            estado: "Estado",
            localidad: "Localidad",
          };
          return `• ${nombres[key] || key}`;
        })
        .join("\n");

      Alert.alert(
        "⚠️ Campos incompletos",
        `Por favor completa los siguientes campos:\n\n${camposFaltantes}`,
        [{ text: "OK" }],
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const datosParaEnviar = {
      mes: formData.mes.trim(),
      anio: parseInt(formData.anio.trim()),
      estado: formData.estado.trim(),
      localidad: formData.localidad.trim(),
    };

    const result = await createInventory(datosParaEnviar);

    if (result.success) {
      Alert.alert("¡Éxito!", result.message, [
        {
          text: "Aceptar",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert(
        "Error",
        result.error || "Ocurrió un error al crear el inventario",
      );
    }
  };

  const mesesDelAnio = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <View style={formStyle.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={formStyle.scrollContent}
        >
          {/* Header con botón de regreso */}
          <View style={formStyle.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={formStyle.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={formStyle.headerTitle}>Nuevo Inventario</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Imagen principal */}
          <View style={formStyle.imageContainer}>
            <Image
              source={require("../../assets/images/inventario.png")}
              style={formStyle.image}
              contentFit="contain"
              transition={200}
            />
            <View style={formStyle.imageOverlay}>
              <Text style={formStyle.imageTitle}>Gestión de Inventarios</Text>
              <Text style={formStyle.imageSubtitle}>
                Complete los datos del nuevo inventario
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={formStyle.formContainer}>
            <View style={formStyle.formCard}>
              <View style={formStyle.sectionHeader}>
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={formStyle.sectionTitle}>
                  Periodo del Inventario
                </Text>
              </View>

              {/* Campo Mes */}
              <View style={formStyle.inputGroup}>
                <Text style={formStyle.label}>Mes *</Text>
                <View style={formStyle.inputWrapper}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={COLORS.gray}
                    style={formStyle.inputIcon}
                  />
                  <TextInput
                    style={[
                      formStyle.input,
                      errors.mes && formStyle.inputError,
                    ]}
                    placeholder="Seleccione el mes"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={formData.mes}
                    onChangeText={(value) => handleChange("mes", value)}
                    editable={!loading}
                  />
                </View>
                {errors.mes && (
                  <View style={formStyle.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={COLORS.error}
                    />
                    <Text style={formStyle.errorText}>{errors.mes}</Text>
                  </View>
                )}
              </View>

              {/* Campo Año */}
              <View style={formStyle.inputGroup}>
                <Text style={formStyle.label}>Año *</Text>
                <View style={formStyle.inputWrapper}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={COLORS.gray}
                    style={formStyle.inputIcon}
                  />
                  <TextInput
                    style={[
                      formStyle.input,
                      errors.anio && formStyle.inputError,
                    ]}
                    placeholder="Ej: 2024"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={formData.anio}
                    onChangeText={(value) => handleChange("anio", value)}
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!loading}
                  />
                </View>
                {errors.anio && (
                  <View style={formStyle.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={COLORS.error}
                    />
                    <Text style={formStyle.errorText}>{errors.anio}</Text>
                  </View>
                )}
              </View>

              <View style={formStyle.divider} />

              <View style={formStyle.sectionHeader}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={formStyle.sectionTitle}>Ubicación</Text>
              </View>

              {/* Campo Estado */}
              <View style={formStyle.inputGroup}>
                <Text style={formStyle.label}>Estado *</Text>
                <View style={formStyle.inputWrapper}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={COLORS.gray}
                    style={formStyle.inputIcon}
                  />
                  <TextInput
                    style={[
                      formStyle.input,
                      errors.estado && formStyle.inputError,
                    ]}
                    placeholder="Estado donde se realizará el inventario"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={formData.estado}
                    onChangeText={(value) => handleChange("estado", value)}
                    editable={!loading}
                  />
                </View>
                {errors.estado && (
                  <View style={formStyle.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={COLORS.error}
                    />
                    <Text style={formStyle.errorText}>{errors.estado}</Text>
                  </View>
                )}
              </View>

              {/* Campo Localidad */}
              <View style={formStyle.inputGroup}>
                <Text style={formStyle.label}>Inmueble *</Text>
                <View style={formStyle.inputWrapper}>
                  <Ionicons
                    name="pin-outline"
                    size={20}
                    color={COLORS.gray}
                    style={formStyle.inputIcon}
                  />
                  <TextInput
                    style={[
                      formStyle.input,
                      errors.localidad && formStyle.inputError,
                    ]}
                    placeholder="Inmueble Asistido"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={formData.localidad}
                    onChangeText={(value) => handleChange("localidad", value)}
                    editable={!loading}
                  />
                </View>
                {errors.localidad && (
                  <View style={formStyle.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={COLORS.error}
                    />
                    <Text style={formStyle.errorText}>{errors.localidad}</Text>
                  </View>
                )}
              </View>

              {/* Botón de envío */}
              <TouchableOpacity
                style={[
                  formStyle.submitButton,
                  loading && formStyle.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={formStyle.loadingContainer}>
                    <Ionicons
                      name="refresh"
                      size={20}
                      color="#FFF"
                      style={formStyle.loadingIcon}
                    />
                    <Text style={formStyle.buttonText}>
                      Creando inventario...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color="#FFF"
                    />
                    <Text style={formStyle.buttonText}>Crear Inventario</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={formStyle.cancelButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={formStyle.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default FormInventory;
