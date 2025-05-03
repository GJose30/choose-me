import { View, Image, Text, Pressable } from "react-native";
import { useState } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  Share,
  Heart,
  Location,
  Dots,
  Paw,
  ArrowLeft,
} from "../../../components/Icon";
import { PetProfileModal } from "../../../components/petProfile/PetProfileModal";
import { PetShareModal } from "../../../components/petProfile/PetShareModal";

export default function PetProfile() {
  const router = useRouter();
  const { index, nombre, descripcion, imagen, logo } = useLocalSearchParams();
  const [petProfileModalVisible, setPetProfileModalVisible] = useState(false);
  const [petShareModalVisible, setPetShareModalVisible] = useState(false);
  const [liked, setLiked] = useState(false);

  const onReportPost = () => {
    alert(`Usuario reportado ${nombre}`);
  };

  const handleLike = () => setLiked((prev) => !prev);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
          // headerTintColor: "#FFFFFF",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mt-4">
              <ArrowLeft size={34} color="white" />
            </Pressable>
          ),
        }}
      />

      {/* Imagen superior */}
      <View className="w-full h-[55%]">
        <Image
          className="w-full h-full"
          source={{
            uri: logo,
          }}
        />
      </View>

      {/* Contenido blanco que sube y se pega */}
      <View className="absolute bottom-0 w-full bg-white p-5 rounded-t-[30px] gap-y-2">
        <View className="flex-row">
          <Text className="text-2xl font-semibold text-slate-600">
            {nombre}
          </Text>
          <View className="flex-row ml-auto gap-4">
            <Pressable onPress={handleLike}>
              <Heart color={liked ? "red" : "#374151"} size={24} />
            </Pressable>
            <Pressable
              onPress={() => {
                setPetShareModalVisible(true);
              }}
            >
              <Share />
            </Pressable>
            <PetShareModal
              visible={petShareModalVisible}
              onClose={() => setPetShareModalVisible(false)}
            />
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Location size={30} />
          <View className="ml-1">
            <Text className=" text-gray-600">Ubicación</Text>
            <Text className=" text-gray-400">Ciudad de Panamá</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-center items-center gap-4 my-2">
          <Text className="bg-green-400 py-2 px-4 rounded-3xl text-2xl text-white">
            Edad: 1 mes
          </Text>
          <Text className="bg-yellow-300 py-2 px-4 rounded-3xl text-2xl text-white">
            Sexo: hembra
          </Text>
          <Text className="bg-blue-300 py-2 px-4 rounded-3xl text-2xl text-white">
            Personalidad: Calmada
          </Text>
          <Text className="bg-red-400 py-2 px-4 rounded-3xl text-2xl text-white">
            Color: Naranja
          </Text>
        </View>

        <View className="w-full h-[1px] bg-gray-300 my-2" />

        <View className="flex-row gap-x-2">
          <Pressable className="justify-center items-center">
            <Image
              className="h-12 w-12 rounded-full mt-2"
              source={{
                uri: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
              }}
            />
          </Pressable>
          <View className="justify-center">
            <Text className="font-bold text-gray-500">Gil Arauz</Text>
            <Text className="text-gray-400">Fundacion Happy Feet</Text>
          </View>
          <Pressable
            className="ml-auto justify-center items-center"
            onPress={() => {
              setPetProfileModalVisible(true);
            }}
          >
            <Dots />
          </Pressable>
          <PetProfileModal
            visible={petProfileModalVisible}
            onClose={() => setPetProfileModalVisible(false)}
            selectedProfileIndex={index}
            onReport={onReportPost}
          />
        </View>
        <Pressable
          onPress={() => alert(`Adoptaste a ${nombre}`)}
          className="self-center justify-center items-center py-4 px-16 bg-[#FE9B5C] flex-row rounded-full my-2 gap-x-2"
        >
          <Paw color="white" size={27} />
          <Text className="font-bold text-white text-2xl">ADOPTAR</Text>
          <Paw color="white" size={27} />
        </Pressable>
      </View>
    </View>
  );
}
