import {
  View,
  Image,
  Text,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  Share,
  Heart,
  Location,
  Dots,
  Paw,
  ArrowLeft,
  MessageIcon,
} from "../../../components/Icon";
import { PetProfileModal } from "../../../components/petProfile/PetProfileModal";
import { PetShareModal } from "../../../components/petProfile/PetShareModal";
import { SliderPet } from "../../../components/petProfile/SliderPet";
import { supabase } from "../../../lib/supabase";

export default function AdoptionPetProfile() {
  const { index, nombre, descripcion, ubicacion, adoption_pet_id } =
    useLocalSearchParams();
  const router = useRouter();
  const [petProfileModalVisible, setPetProfileModalVisible] = useState(false);
  const [petShareModalVisible, setPetShareModalVisible] = useState(false);
  const [liked, setLiked] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [post, setPost] = useState([]);

  const onReportPost = () => {
    alert(`Usuario reportado ${nombre}`);
  };

  const handleLike = () => setLiked((prev) => !prev);

  const imagesArray = Array.isArray(post[0]?.media)
    ? post[0]?.media.filter((item) => item && item.source)
    : post[0]?.media?.source
      ? [{ type: post[0]?.media.type, source: post[0]?.media.source }]
      : [];

  // const fetchQualities = async () => {
  //   const { data, error } = await supabase
  //     .from("qualities")
  //     .select(`*`)
  //     .eq("pet_id", pet_id);
  //   if (error) {
  //     console.error("Error fetching posts:", error.message);
  //   } else {
  //     setQualities(data);
  //   }
  // };

  const fetchPost = async () => {
    const { data, error } = await supabase.from("adoption_pet").select(
      `
        *,
        media_pet(
          *
        )
      `
    );
    // .eq("id", adoption_pet_id);
    if (error) {
      console.error("Error fetching posts:", error.message);
    } else {
      setPost(data);
    }
  };

  useEffect(() => {
    // fetchQualities();
    fetchPost();
    console.log(descripcion);
  }, [descripcion]);

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <View className="mt-4">
              <Pressable
                onPress={() => {
                  router.back();
                }}
              >
                <ArrowLeft size={34} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <SliderPet images={imagesArray} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="absolute bottom-0 w-full bg-white rounded-t-[30px] h-[55%]"
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        <View className="flex-row px-5">
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

        <View className="flex-row items-center mb-2 px-5">
          <Location size={20} />
          <View className="ml-1">
            <Text className=" text-gray-400">{ubicacion}</Text>
          </View>
        </View>

        <FlatList
          data={qualities}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="pt-5 pb-7">
              <View
                className={`${item.color} flex-col justify-center items-center rounded-xl px-5 py-3 shadow-2xl`}
              >
                <Text className="text-lg text-white">{item.title}</Text>
                <Text className="text-2xl text-white font-medium">
                  {item.description}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View className="w-4" />}
        />

        <View className="w-full h-[1px] bg-gray-300" />

        <View className="flex px-5 mb-7 mt-5">
          <Text className="text-gray-700 text-xl font-semibold">Acerca de</Text>
          <Text className="text-gray-600 text-base">{descripcion}</Text>
        </View>

        <View className="flex-row gap-x-2 mb-5">
          <View className="flex-row justify-center items-center gap-x-3 bg-gray-200 py-3 px-5 rounded-r-xl">
            <Pressable
              className="flex-row gap-x-3"
              onPress={() =>
                router.push({
                  pathname: "indexScreens/profile/[id]",
                  params: {
                    index: index,
                  },
                })
              }
            >
              <Image
                className="h-12 w-12 rounded-full mt-2"
                source={{
                  uri: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
                  cache: "force-cache",
                }}
              />
              <View className="flex-col justify-center">
                <Text className="font-bold text-gray-500">Gil Arauz</Text>
                <Text className="text-gray-400">Fundacion Happy Feet</Text>
              </View>
            </Pressable>
            <Pressable
              className="ml-auto justify-center items-center"
              onPress={() => {
                setPetProfileModalVisible(true);
              }}
            >
              <Dots size={24} />
            </Pressable>
            <PetProfileModal
              visible={petProfileModalVisible}
              onClose={() => setPetProfileModalVisible(false)}
              selectedProfileIndex={index}
              onReport={onReportPost}
            />
          </View>
        </View>
        <View className="flex-row justify-center items-center gap-x-4">
          <Pressable
            onPress={() => alert(`Adoptaste a ${nombre}`)}
            className="self-center justify-center items-center py-4 px-16 bg-[#FE9B5C] flex-row rounded-full my-2 gap-x-2"
          >
            <Paw color="white" size={27} />
            <Text className="font-bold text-white text-2xl">ADOPTAR</Text>
            <Paw color="white" size={27} />
          </Pressable>
          <Pressable
            onPress={() => alert(`Escribirle a ${nombre}`)}
            className="self-center justify-center items-center py-4 px-4 bg-white flex-row rounded-3xl my-2 gap-x-2 shadow"
          >
            <MessageIcon color="#FE9B5C" size={27} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
