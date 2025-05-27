import {
  Text,
  View,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ProfileMetric } from "../../../components/profile/ProfileMetrics";
import { MessageIcon, ArrowLeft } from "../../../components/Icon";
import { LinearGradient } from "expo-linear-gradient";

const user = {
  id: "123",
  nombre: "Gil Arauz",
  email: "gil@email.com",
  fotoPerfil:
    "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
  fotoFondo:
    "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
  descripcion: "Amante de los animales y voluntario en refugios.",
  mascotas: [
    {
      id: "m1",
      nombre: "Rocky",
      foto: "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
      raza: "Labrador",
      edad: "2 años",
    },
    {
      id: "m2",
      nombre: "Milo",
      foto: "https://urgenciesveterinaries.com/wp-content/uploads/2023/09/survet-gato-caida-pelo-01.jpeg",
      raza: "Beagle",
      edad: "4 años",
    },
    {
      id: "m3",
      nombre: "Rocky",
      foto: "https://purina.com.pa/sites/default/files/2022-11/purina-brand-cuanto-vive-un-gato-nota_03.jpg",
      raza: "Labrador",
      edad: "2 años",
    },
    {
      id: "m4",
      nombre: "Milo",
      foto: "https://okdiario.com/img/2025/04/08/el-significado-de-que-tu-perro-te-chupe-los-pies-sin-parar-635x358.jpg",
      raza: "Beagle",
      edad: "4 años",
    },
    {
      id: "m5",
      nombre: "Rocky",
      foto: "https://vitakraft.es/wp-content/uploads/2020/12/Blog_HistoriaPerros-1110x600.jpg",
      raza: "Labrador",
      edad: "2 años",
    },
    {
      id: "m6",
      nombre: "Rocky",
      foto: "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
      raza: "Labrador",
      edad: "2 años",
    },
    {
      id: "m7",
      nombre: "Milo",
      foto: "https://urgenciesveterinaries.com/wp-content/uploads/2023/09/survet-gato-caida-pelo-01.jpeg",
      raza: "Beagle",
      edad: "4 años",
    },
    {
      id: "m8",
      nombre: "Rocky",
      foto: "https://purina.com.pa/sites/default/files/2022-11/purina-brand-cuanto-vive-un-gato-nota_03.jpg",
      raza: "Labrador",
      edad: "2 años",
    },
    {
      id: "m9",
      nombre: "Milo",
      foto: "https://okdiario.com/img/2025/04/08/el-significado-de-que-tu-perro-te-chupe-los-pies-sin-parar-635x358.jpg",
      raza: "Beagle",
      edad: "4 años",
    },
    {
      id: "m10",
      nombre: "Rocky",
      foto: "https://vitakraft.es/wp-content/uploads/2020/12/Blog_HistoriaPerros-1110x600.jpg",
      raza: "Labrador",
      edad: "2 años",
    },
  ],
};

export default function Profile() {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const imageSize = screenWidth / 3;

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
    >
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
      <View className="relative w-full h-44">
        <View className="absolute w-full h-full">
          <Image
            source={{ uri: user.fotoFondo }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.2)", "transparent"]}
            className="absolute top-0 w-full h-full"
          />
        </View>
        <View className="absolute bottom-[-48px] left-0 right-0 flex-row justify-between px-10 items-center z-10">
          <View className="top-12">
            <ProfileMetric label="Seguidores" value="42.5k" />
          </View>

          {/* Foto perfil */}
          <Image
            source={{ uri: user.fotoPerfil }}
            className="w-28 h-28 rounded-full border-4 border-white"
          />

          {/* Seguidos */}
          <View className="top-12">
            <ProfileMetric label="Seguidos" value="312" />
          </View>
        </View>
      </View>

      <View className="mt-14 mx-4 items-center">
        <Text className="text-2xl font-normal text-gray-800">
          {user.nombre}
        </Text>
      </View>

      <View className="px-4 items-center mt-2">
        <Text className="text-sm text-gray-700">
          {user.descripcion || "Este usuario aún no ha escrito una biografía."}
        </Text>
      </View>

      <View className="mt-3 flex-row justify-center items-center gap-x-3">
        <Pressable
          onPress={() => alert(`Adoptaste a ${user.nombre}`)}
          className="py-[4px] px-7 bg-[#FE9B5C] flex-row rounded-full my-2 gap-x-2"
        >
          <Text className="text-white text-lg">Seguir</Text>
        </Pressable>
        <Pressable
          onPress={() => alert(`Escribirle a ${user.nombre}`)}
          className="p-[8px] bg-white flex-row rounded-2xl my-2 gap-x-2 shadow"
        >
          <MessageIcon color="#FE9B5C" size={19} />
        </Pressable>
      </View>

      <View className="mx-4 my-2">
        <Text className="text-lg font-medium text-gray-700">Mis Mascotas</Text>
      </View>
      <FlatList
        data={user.mascotas}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Pressable
            className="w-40 p-2 bg-white rounded-xl shadow-xl"
            onPress={() =>
              router.push({
                pathname: "indexScreens/petProfile/[id]",
                params: {
                  index: index,
                  nombre: item.nombre,
                },
              })
            }
          >
            <Image
              source={{ uri: item.foto }}
              className="w-full h-24 rounded-md"
            />
            <Text className="font-semibold text-gray-700">{item.nombre}</Text>
            <Text className="text-sm text-gray-500">{item.raza}</Text>
          </Pressable>
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          gap: 12,
        }}
      />

      <View className="mx-4 mb-4">
        <Text className="text-lg font-medium text-gray-700">
          Mis Publicaciones
        </Text>
      </View>
      <FlatList
        data={user.mascotas}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <View>
            <Pressable
              className="justify-center items-center"
              onPress={() =>
                router.push({
                  pathname: "indexScreens/message",
                  params: {
                    index: index,
                  },
                })
              }
            >
              <Image
                source={{ uri: item.foto }}
                style={{
                  width: imageSize,
                  height: imageSize,
                  borderWidth: 0.5,
                  borderColor: "#ccc",
                }}
              />
            </Pressable>
          </View>
        )}
      />
    </ScrollView>
  );
}
