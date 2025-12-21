import { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

// 🔹 Card de mascota (memo para performance)
const PetCard = memo(function PetCard({ pet, onPress }) {
  const cover = pet?.media_pet?.[0]?.source;

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 mb-3 bg-white rounded-2xl shadow-sm"
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mr-3">
        {cover ? (
          <Image
            source={{ uri: cover }}
            className="w-16 h-16"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-slate-400 text-xs text-center">Sin foto</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text
          className="text-base font-semibold text-slate-800"
          numberOfLines={1}
        >
          {pet?.name ?? "Mascota sin nombre"}
        </Text>
        <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>
          Toca para crearle un nuevo post
        </Text>
      </View>

      <Text className="text-lg text-slate-400 ml-2">›</Text>
    </TouchableOpacity>
  );
});

export default function SelectPetScreen() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [currentUserId, setCurrentUserId] = useState(null);

  // TODO: reemplazar por el user real (auth)
  const user_id = "5c16bcb5-489c-465e-8f42-186c6fe9061f";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const fetchCurrentUserId = async () => {
      const { data, error } = await supabase
        .from("user")
        .select("id")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error obteniendo user interno:", error.message);
        return;
      }

      if (!data?.id) {
        console.warn("No existe fila en user para este clerk_id");
        return;
      }

      setCurrentUserId(data.id);
    };

    fetchCurrentUserId();
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchPets = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pet")
        .select(`*, media_pet(*)`)
        .eq("user_id", currentUserId);

      if (error) {
        console.error("Error al obtener mascotas:", error);
      } else {
        setPets(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchPets();
    }
  }, [currentUserId, fetchPets]);

  const handlePressPet = useCallback(
    (petId) => {
      router.push({
        pathname: "/post/create",
        params: { pet_id: petId },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PetCard pet={item} onPress={() => handlePressPet(item.id)} />
    ),
    [handlePressPet]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />

      {/* Header tipo banner */}
      <LinearGradient
        colors={["#f97316", "#fb923c"]}
        className="h-36 px-5 pt-10 pb-4 rounded-b-3xl"
      >
        <Text className="text-white text-2xl font-bold">
          Selecciona una mascota
        </Text>
        <Text className="text-white/90 text-base mt-1">
          Elige a cuál de tus peluditos le quieres crear un nuevo post 🐾
        </Text>
      </LinearGradient>

      {/* Contenido */}
      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="mt-2 text-slate-500">Cargando mascotas...</Text>
          </View>
        ) : pets.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-lg font-semibold text-slate-700 text-center">
              Aún no tienes mascotas registradas
            </Text>
            <Text className="mt-2 text-slate-500 text-center">
              Registra una mascota primero para poder crearle posts.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pets}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews
            onRefresh={fetchPets}
            refreshing={loading}
          />
        )}
      </View>
    </View>
  );
}
