import {
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Stack } from "expo-router";
import { ProfileMetric } from "../../components/profile/ProfileMetrics";

const user = {
  id: "123",
  nombre: "Gil Arauz",
  email: "gil@email.com",
  foto: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
  descripcion: "Amante de los animales y voluntaria en refugios.",
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
  const screenWidth = Dimensions.get("window").width;
  // const paddingHorizontal = 4;
  const imageSize = screenWidth / 3; // 3 columnas
  // const imageSize = (screenWidth - paddingHorizontal * 2 * 3) / 3;
  return (
    <View className="flex-1 bg-white">
      <View className="mx-4">
        <Stack.Screen
          options={{
            headerStyle: { backgroundColor: "white" },
            headerTitle: "Perfil",
          }}
        />
        <View className="items-center p-4">
          <Image
            source={{ uri: user.foto }}
            className="w-24 h-24 rounded-full mb-2"
          />
          <Text className="text-xl font-semibold text-gray-800">
            {user.nombre}
          </Text>
          <Text className="text-sm text-gray-500">{user.email}</Text>
        </View>

        <View className="px-4 items-center">
          <Text className="text-base text-gray-700">
            {user.descripcion ||
              "Este usuario aún no ha escrito una biografía."}
          </Text>
        </View>
      </View>

      <View className="mx-4">
        <View className="flex-row justify-around my-4">
          <ProfileMetric label="Mascotas" value="3" />
          <ProfileMetric label="Adopciones" value="1" />
          <ProfileMetric label="Reseñas" value="12" />
        </View>
      </View>

      <View className="mx-4">
        <Text className="text-lg font-bold my-2">Mis Mascotas</Text>
        <FlatList
          data={user.mascotas}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="w-40 mt-3 mb-5 mr-2 p-2 bg-white rounded-xl shadow-xl">
              <Image
                source={{ uri: item.foto }}
                className="w-full h-24 rounded-md"
              />
              <Text className="mt-2 font-semibold text-gray-700">
                {item.nombre}
              </Text>
              <Text className="text-sm text-gray-500">{item.raza}</Text>
            </View>
          )}
        />
      </View>

      <View className="mx-4">
        <Text className="text-lg font-bold my-2">Mis Publicaciones</Text>
      </View>
      <FlatList
        data={user.mascotas}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        // columnWrapperStyle={{ justifyContent: "center" }} // 💡 centra las filas
        renderItem={({ item }) => (
          <View>
            <TouchableOpacity
              onPress={() => {
                /* abrir detalle si quieres */
              }}
            >
              <Image
                className="justify-center items-center"
                source={{ uri: item.foto }}
                style={{
                  width: imageSize,
                  height: imageSize,
                  borderWidth: 0.5,
                  borderColor: "#ccc",
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
