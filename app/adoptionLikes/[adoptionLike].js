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

  const { isLoaded, isSignedIn, user } = useUser();

  const [supaUser, setSupaUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

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

  // 1) Traer usuario interno por clerk_id
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

  // 2) Con supaUser.id, traer los likes + adoption_pet + pet(media)
  const fetchAdoptionPetLikes = useCallback(async () => {
    if (!supaUser?.id) return;
    setLoading(true);
    const id = ++reqId.current;

    const { data, error } = await supabase
      .from("adoption_likes_pet")
      .select(
        `
        adoption_pet:adoption_pet_id (
          id, name, birthdate, location, description, pet_id,
          pet:pet_id (
            id,
            name,
            media_pet ( source )
          )
        )
      `,
      )
      .eq("user_id", supaUser.id);

    if (error) {
      console.error("Error al obtener mascotas con like:", error.message);
      setLoading(false);
      return;
    }
    if (id !== reqId.current) {
      setLoading(false);
      return;
    }

    // Map -> 1 tarjeta por adoption_pet (dedup por seguridad)
    const seen = new Set();
    const pets = [];

    for (const like of data ?? []) {
      const ap = like.adoption_pet; // alias adoption_pet:adoption_pet_id
      const apId = String(ap?.id ?? "");
      if (!apId || seen.has(apId)) continue;
      seen.add(apId);

      // ✅ imagen desde pet -> media_pet
      const image = ap?.pet?.media_pet?.[0]?.source || "";

      // ✅ edad: birthdate de adoption_pet o fallback al pet
      const birthdate = ap?.birthdate ?? ap?.pet?.birthdate ?? null;

      // ✅ nombre: adoption_pet.name o fallback al pet.name
      const name = ap?.name ?? ap?.pet?.name ?? "";

      pets.push({
        id: apId,
        name,
        age: getAge(birthdate),
        location: ap?.location ?? "",
        description: ap?.description ?? "",
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
    [router, cardWidth],
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
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={16}
          removeClippedSubviews
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
