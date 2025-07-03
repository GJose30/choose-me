import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  Pressable,
} from "react-native";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const likedPets = [
  {
    id: 1,
    name: "Luna",
    age: 3,
    location: "Ciudad de Panamá",
    image:
      "https://cdn.pixabay.com/photo/2016/02/19/11/19/dog-1207816_1280.jpg",
  },
  {
    id: 2,
    name: "Max",
    age: 5,
    location: "David, Chiriquí",
    image:
      "https://cdn.pixabay.com/photo/2017/09/25/13/12/dog-2785074_1280.jpg",
  },
  {
    id: 3,
    name: "Bella",
    age: 2,
    location: "Colón",
    image: "https://cdn.pixabay.com/photo/2015/03/26/09/54/dog-690176_1280.jpg",
  },
  {
    id: 4,
    name: "Rocky",
    age: 4,
    location: "Santiago, Veraguas",
    image:
      "https://cdn.pixabay.com/photo/2017/11/30/18/17/dog-2982426_1280.jpg",
  },
];

export default function AdoptionLikes() {
  const router = useRouter();
  const [adoptionPet, setAdoptionPet] = useState([]);

  // const fetchAdoptionPetLikes = async () => {
  // const { data, error } = await supabase.from("pet").select(`
  //     *,
  //     post (
  //       *,
  //       media (
  //       *
  //       )
  //     )

  //   `);

  // if (error) {
  //   console.error("Error fetching posts:", error.message);
  // } else {
  //   setPosts(data);
  // }
  //   const { data, error } = await supabase
  //     .from("adoption_likes_pet")
  //     .select("*");
  //   if (error) {
  //     console.error("Error al obtener likes:", error.message);
  //   } else {
  //     setAdoptionPet(data);
  //   }
  // };

  const fetchAdoptionPetLikes = async () => {
    const userId = "9b4fc3c3-df95-4763-b2b9-8449c78e9b3a"; // usuario fijo

    const { data, error } = await supabase
      .from("adoption_likes_pet")
      .select(
        `
        adoption_pet (
          *,
          media_pet (
            *
          )
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error al obtener mascotas con like:", error.message);
    } else {
      const petsWithLikes = data.map((like) => {
        const pet = like.adoption_pet;
        const image =
          pet.media_pet?.find((m) => m.type === "image")?.source || "";
        const birthdate = pet.birthdate ? new Date(pet.birthdate) : null;
        const today = new Date();
        const age = birthdate
          ? today.getFullYear() -
            birthdate.getFullYear() -
            (today <
            new Date(
              today.getFullYear(),
              birthdate.getMonth(),
              birthdate.getDate()
            )
              ? 1
              : 0)
          : "N/A";

        return {
          id: pet.id,
          name: pet.name,
          age: age,
          location: pet.location,
          description: pet.description,
          image: image,
        };
      });

      setAdoptionPet(petsWithLikes);
    }
  };

  useEffect(() => {
    fetchAdoptionPetLikes();
    // console.log(adoptionPet.id);
  }, []);

  const renderCard = ({ item }) => (
    <Pressable
      className="bg-white rounded-2xl shadow-md m-2 overflow-hidden"
      onPress={() =>
        router.push({
          pathname: "indexScreens/adoptionPetProfile/[id]",
          params: {
            // index: index,
            nombre: item.name,
            descripcion: item.description,
            ubicacion: item.location,
            adoption_pet_id: item.id,
          },
        })
      }
      style={{ width: Dimensions.get("window").width / 2 - 24 }}
    >
      <Image
        source={{ uri: item.image }}
        style={{ width: "100%", height: 120 }}
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="text-lg font-semibold text-gray-700">{item.name}</Text>
        <Text className="text-sm text-gray-600">{item.age} años</Text>
        <Text className="text-sm text-gray-400">{item.location}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-100 p-2">
      <Stack.Screen
        options={{
          title: "Quiero Adoptar ❤️",
          headerTransparent: false,
        }}
      />
      {/* <FlatList
        data={likedPets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 20 }}
      /> */}
      <FlatList
        data={adoptionPet} // antes era likedPets
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
