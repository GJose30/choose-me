import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { supabase } from "../../lib/supabase";
import { useRouter, Stack } from "expo-router";

export default function SelectPetScreen() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user_id = "5c16bcb5-489c-465e-8f42-186c6fe9061f";

  const fetchPets = async () => {
    const { data, error } = await supabase
      .from("pet")
      .select(
        `
      *, 
      media_pet (
        *
      )
      `
      )
      .eq("user_id", user_id); // <- sin punto y coma antes

    if (error) {
      console.error("Error al obtener mascotas:", error);
    } else {
      setPets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPets();
    console.log(pets);
    // console.log("hola");
  }, []);

  // const renderPet = ({ item }) => (
  //   <TouchableOpacity
  //     style={{
  //       flexDirection: "row",
  //       alignItems: "center",
  //       padding: 12,
  //       marginBottom: 10,
  //       backgroundColor: "#f3f3f3",
  //       borderRadius: 10,
  //     }}
  //     onPress={() =>
  //       router.push({
  //         pathname: "/post/create",
  //         params: { pet_id: item.id },
  //       })
  //     }
  //   >
  //     <Image
  //       source={{ uri: item.media_pet.source }}
  //       style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12 }}
  //     />
  //     <Text style={{ fontSize: 18, fontWeight: "600" }}>
  //       {item.media_pet.source}
  //     </Text>
  //     <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
  //   </TouchableOpacity>
  // );

  const renderPet = ({ item }) => {
    // console.log("Mascota:", item);
    // console.log("Media_pet:", item.media_pet?.[0]?.source);

    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          marginBottom: 10,
          backgroundColor: "#f3f3f3",
          borderRadius: 10,
        }}
        onPress={() =>
          router.push({
            pathname: "/post/create",
            params: { pet_id: item.id },
          })
        }
      >
        <Image
          source={{ uri: item.media_pet?.[0]?.source }}
          style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12 }}
        />
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          {item.media_pet.source}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 15 }}>
        Selecciona la mascota para el nuevo post
      </Text>

      {loading ? (
        <Text>Cargando mascotas...</Text>
      ) : pets.length === 0 ? (
        <Text>No tienes mascotas registradas.</Text>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPet}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}
