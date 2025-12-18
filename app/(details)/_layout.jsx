// app/(details)/_layout.jsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function DetailsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          shadowColor: "#000",
          borderBottomColor: "#FFF",
          shadowRadius: 3,
          elevation: 5,
          heigth: 20,
          borderBottomWidth: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold", fontSize: 23 },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          headerShown: true,
          header: () => (
            <View
              style={{
                height: 75,
                backgroundColor: COLORS.primary,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                paddingHorizontal: 20,
              }}
            >
              {/* Botón atrás personalizado */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ position: "absolute", left: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Título centrado */}
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                  width: 205,
                }}
              >
                Detalles del Inventario
              </Text>
            </View>
          ),
        })}
      />
    </Stack>
  );
}
