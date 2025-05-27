import { View, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar({
  placeholder = "Buscar...",
  onSearch,
  onClear,
}) {
  const [text, setText] = useState("");

  const handleClear = () => {
    setText("");
    if (onClear) onClear();
  };

  const handleSearch = (value) => {
    if (onSearch) onSearch(value);
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
        margin: 12,
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
        onChangeText={(value) => {
          setText(value);
          handleSearch(value);
        }}
        onSubmitEditing={() => handleSearch(text)}
        placeholder={placeholder}
        style={{ flex: 1, fontSize: 16 }}
        placeholderTextColor="#888"
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
