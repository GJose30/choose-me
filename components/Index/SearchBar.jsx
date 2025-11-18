import { View, TextInput, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

/**
 * Barra de búsqueda reutilizable
 * - onSearch: callback (texto) que se dispara al escribir o confirmar
 * - onClear: callback que se dispara al limpiar
 * - delay: ms de debounce para no disparar onSearch en cada tecla
 */
export default function SearchBar({
  placeholder = "Buscar...",
  onSearch,
  onClear,
  delay = 200, // pequeño debounce local (evita spam al escribir)
}) {
  const [text, setText] = useState("");

  // 🔁 Pequeño debounce interno
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(text.trim());
    }, delay);
    return () => clearTimeout(timer);
  }, [text]);

  const handleClear = () => {
    setText("");
    onClear?.();
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F1F1",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        margin: 8,
      }}
    >
      <Ionicons
        name="search"
        size={18}
        color="#888"
        style={{ marginRight: 8 }}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        style={{
          flex: 1,
          fontSize: 15,
          color: "#333",
        }}
        returnKeyType="search"
      />
      {text.length > 0 && (
        <Pressable onPress={handleClear}>
          <Ionicons name="close-circle" size={18} color="#888" />
        </Pressable>
      )}
    </View>
  );
}
