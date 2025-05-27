import { View, Text, FlatList, Image, Pressable } from "react-native";
import { useState } from "react";
import SearchBar from "../../components/Index/SearchBar";
import { Stack } from "expo-router";

const datos = [
  { id: "1", nombre: "Gil Arauz" },
  { id: "2", nombre: "Fundación Happy Feet" },
  { id: "3", nombre: "Carlos López" },
];

export default function MiPantalla() {
  const [query, setQuery] = useState("");

  const filtrados = datos.filter((item) =>
    item.nombre.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
      }}
    >
      <Image
        source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }}
        style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.nombre}</Text>
        <Text style={{ color: "#888", fontSize: 12 }}>Ver perfil</Text>
      </View>
      <Pressable
        style={{
          backgroundColor: "#FE9B5C",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
          Ver
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: () => (
            <View className="ml-[-25px] items-center justify-center">
              <SearchBar
                onSearch={(text) => setQuery(text)}
                onClear={() => setQuery("")}
              />
            </View>
          ),
        }}
      />
      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}
