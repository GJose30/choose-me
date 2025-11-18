import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";

/* ======================= Card (memo) ======================= */
const AdoptionLikeCard = React.memo(function AdoptionLikeCard({
  item,
  cardWidth,
  onPress,
}) {
  return (
    <Pressable
      className="bg-white rounded-2xl shadow-md m-2 overflow-hidden"
      onPress={onPress}
      style={{ width: cardWidth }}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: 120 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{ width: "100%", height: 120 }}
          className="bg-gray-200 items-center justify-center"
        >
          <Text className="text-gray-500 text-xs">Sin foto</Text>
        </View>
      )}
      <View className="p-3">
        <Text className="text-lg font-semibold text-gray-700" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-gray-600" numberOfLines={1}>
          {item.age} años
        </Text>
        <Text className="text-sm text-gray-400" numberOfLines={1}>
          {item.location}
        </Text>
      </View>
    </Pressable>
  );
});

/* ======================= Pantalla ======================= */
export default function AdoptionLikes() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Clerk (usuario autenticado)
  const { isLoaded, isSignedIn, user } = useUser();

  // Usuario de tu app en Supabase (fila en tabla "user")
  const [supaUser, setSupaUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  // layout estable
  const CARD_GAP = 24;
  const cardWidth = useMemo(() => Math.floor(width / 2) - CARD_GAP, [width]);

  const [adoptionPet, setAdoptionPet] = useState([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const getAge = useCallback((birthdateStr) => {
    if (!birthdateStr) return "N/A";
    const today = new Date();
    const birth = new Date(birthdateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age < 0 || isNaN(age) ? "N/A" : age;
  }, []);

  // 1) Traer el usuario de Supabase por clerk_id (igual que en Main)
  const fetchSupaUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setUserLoading(true);
    try {
      const clerkId = user.id;
      const { data, error } = await supabase
        .from("user")
        .select("id, username, profile_pic, clerk_id")
        .eq("clerk_id", clerkId)
        .single();

      if (error) throw error;
      setSupaUser(data);
    } catch (err) {
      console.error("Supabase user error:", err?.message);
    } finally {
      setUserLoading(false);
    }
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    fetchSupaUser();
  }, [fetchSupaUser]);

  // 2) Con el supaUser.id, traer los likes
  const fetchAdoptionPetLikes = useCallback(async () => {
    if (!supaUser?.id) return;
    setLoading(true);
    const id = ++reqId.current;

    const { data, error } = await supabase
      .from("adoption_likes_pet")
      .select(
        `
        adoption_pet (
          id, name, birthdate, location, description,
          media_adoption_pet ( source, type )
        )
      `
      )
      .eq("user_id", supaUser.id);

    if (error) {
      console.error("Error al obtener mascotas con like:", error.message);
      setLoading(false);
      return;
    }
    if (id !== reqId.current) {
      // llegó una respuesta vieja
      setLoading(false);
      return;
    }

    // Map -> 1 tarjeta por mascota (dedup por seguridad)
    const seen = new Set();
    const pets = [];
    for (const like of data ?? []) {
      const pet = like.adoption_pet;
      const petId = String(pet?.id ?? "");
      if (!petId || seen.has(petId)) continue;
      seen.add(petId);

      const image =
        pet?.media_adoption_pet?.find((m) => m?.type === "image")?.source ||
        pet?.media_adoption_pet?.[0]?.source ||
        "";

      pets.push({
        id: petId,
        name: pet?.name ?? "",
        age: getAge(pet?.birthdate),
        location: pet?.location ?? "",
        description: pet?.description ?? "",
        image,
      });
    }

    setAdoptionPet(pets);
    setLoading(false);
  }, [supaUser?.id, getAge]);

  useEffect(() => {
    fetchAdoptionPetLikes();
  }, [fetchAdoptionPetLikes]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }) => (
      <AdoptionLikeCard
        item={item}
        cardWidth={cardWidth}
        onPress={() =>
          router.push({
            pathname: "indexScreens/adoptionPetProfile/[id]",
            params: {
              adoption_pet_id: String(item.id),
            },
          })
        }
      />
    ),
    [router, cardWidth]
  );

  if (!isLoaded || userLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isLoaded && !isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Inicia sesión para ver tus likes.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 p-2">
      <Stack.Screen
        options={{
          title: "Quiero Adoptar ❤️",
          headerTransparent: false,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={adoptionPet}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          // rendimiento
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={16}
          removeClippedSubviews
          // padding y espacio
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-gray-500">
                Aún no has dado like a mascotas.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
