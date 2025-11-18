import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../../lib/supabase";
import {
  Heart,
  Location,
  Paw,
  MessageIcon,
  ArrowLeft,
} from "../../../components/Icon";

/* ===== Utils ===== */
const getAge = (birthdateStr) => {
  if (!birthdateStr) return null;
  const today = new Date();
  const birth = new Date(birthdateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 0 || Number.isNaN(age) ? null : age;
};

/* ===== Mini comp ===== */
const MediaThumb = memo(function MediaThumb({ uri, size, onPress, active }) {
  return (
    <Pressable onPress={onPress} style={{ opacity: active ? 1 : 0.85 }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: 16,
            borderWidth: active ? 2 : 0,
            borderColor: active ? "#FE9B5C" : "transparent",
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{ width: size, height: size, borderRadius: 16 }}
          className="bg-gray-200 items-center justify-center"
        >
          <Text className="text-gray-500 text-xs">Sin foto</Text>
        </View>
      )}
    </Pressable>
  );
});

export default function AdoptionPetProfile() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { adoption_pet_id } = useLocalSearchParams();
  const pid = Array.isArray(adoption_pet_id)
    ? adoption_pet_id[0]
    : adoption_pet_id;

  // Clerk + Supabase user row
  const { isLoaded, isSignedIn, user } = useUser();
  const [supaUserId, setSupaUserId] = useState(null);

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [media, setMedia] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // like UI y bloqueo
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const heroHeight = useMemo(() => Math.floor(height * 0.5), [height]);
  const thumbSize = useMemo(() => Math.floor((width - 48) / 3), [width]);

  /* ===== Resolver supaUserId por clerk_id ===== */
  const fetchSupaUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    const clerkId = user.id;
    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();
    if (!error && data?.id) setSupaUserId(data.id);
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    fetchSupaUser();
  }, [fetchSupaUser]);

  /* ===== Fetch mascota + owner ===== */
  const fetchPet = useCallback(async () => {
    if (!pid) return;
    const { data, error } = await supabase
      .from("adoption_pet")
      .select(
        `
        id, name, description, likes, location, user_id, birthdate, created_at,
        media_adoption_pet ( source )
      `
      )
      .eq("id", String(pid))
      .single();

    if (error) throw error;

    setPet(data);
    const gal = data?.media_adoption_pet ?? [];
    setMedia(gal);
    setSelectedIndex(0);

    if (data?.user_id) {
      const { data: u, error: ue } = await supabase
        .from("user")
        .select("id, username, profile_pic")
        .eq("id", data.user_id)
        .single();
      if (!ue) setOwner(u || null);
    } else {
      setOwner(null);
    }
  }, [pid]);

  /* ===== Saber si YA le di like (para fijar el estado inicial) ===== */
  const fetchLiked = useCallback(async () => {
    if (!supaUserId || !pid) return;
    const { data, error } = await supabase
      .from("adoption_likes_pet")
      .select("id")
      .eq("adoption_pet_id", String(pid))
      .eq("user_id", String(supaUserId))
      .limit(1);
    if (!error) setLiked((data ?? []).length > 0);
  }, [supaUserId, pid]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPet();
      await fetchLiked(); // fijar estado del corazón si ya existe like
    } catch (e) {
      console.error("Error al cargar perfil de adopción:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [fetchPet, fetchLiked]);

  useEffect(() => {
    // Cuando ya conozco al usuario de supabase o cambio de mascota, cargo todo
    if (pid) loadAll();
  }, [pid, supaUserId, loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPet();
      await fetchLiked();
    } catch (e) {
      console.error("Refresh error:", e?.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPet, fetchLiked]);

  /* ===== LIKE: crea/borra en adoption_likes_pet y sync counter ===== */
  const handleLike = useCallback(async () => {
    if (!pet?.id || liking) return;
    if (!supaUserId) {
      alert("Inicia sesión para dar like.");
      return;
    }

    setLiking(true);
    try {
      const willLike = !liked;
      const delta = willLike ? 1 : -1;
      const newLikes = Math.max((pet.likes ?? 0) + delta, 0);

      // UI optimista
      setLiked(willLike);
      setPet((prev) => ({ ...prev, likes: newLikes }));

      if (willLike) {
        // insertar like
        const { error: insErr } = await supabase
          .from("adoption_likes_pet")
          .insert([{ adoption_pet_id: pet.id, user_id: supaUserId }]);
        if (insErr) {
          // revertir UI si falla
          setLiked(false);
          setPet((prev) => ({
            ...prev,
            likes: Math.max((prev.likes ?? 1) - 1, 0),
          }));
          throw insErr;
        }
      } else {
        // borrar like
        const { error: delErr } = await supabase
          .from("adoption_likes_pet")
          .delete()
          .eq("adoption_pet_id", pet.id)
          .eq("user_id", supaUserId);
        if (delErr) {
          // revertir UI si falla
          setLiked(true);
          setPet((prev) => ({ ...prev, likes: (prev.likes ?? 0) + 1 }));
          throw delErr;
        }
      }

      // sincronizar contador en la tabla adoption_pet
      const { error: upErr } = await supabase
        .from("adoption_pet")
        .update({ likes: newLikes })
        .eq("id", pet.id);
      if (upErr) {
        // revertir si falla
        setLiked(!willLike);
        setPet((prev) => ({
          ...prev,
          likes: Math.max((prev.likes ?? 0) - delta, 0),
        }));
        throw upErr;
      }
    } catch (err) {
      console.error("Error handleLike:", err?.message || err);
    } finally {
      setLiking(false);
    }
  }, [pet, liked, liking, supaUserId]);

  const goBack = useCallback(() => router.back(), [router]);

  const cover = media?.[selectedIndex]?.source || null;
  const age = getAge(pet?.birthdate);
  const displayName = pet?.name ?? "Mascota en adopción";
  const displayLocation = pet?.location ?? "";
  const displayDesc = pet?.description ?? "";

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackground: () => (
            <LinearGradient
              colors={["rgba(0,0,0,0.35)", "transparent"]}
              style={{ flex: 1 }}
            />
          ),
          headerLeft: () => (
            <View className="mt-4">
              <Pressable onPress={goBack}>
                <ArrowLeft size={34} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Hero ---- */}
        <View style={{ height: heroHeight }} className="w-full">
          {cover ? (
            <Image
              source={{ uri: cover }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray-200 items-center justify-center">
              <Text className="text-gray-500">Sin imagen</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 140,
            }}
          />

          <View
            style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-white text-3xl font-semibold"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Pressable
                onPress={handleLike}
                disabled={liking}
                className="bg-white/25 rounded-full p-2"
              >
                <Heart size={24} color={liked ? "red" : "white"} />
              </Pressable>
            </View>

            <View className="flex-row items-center mt-2 gap-x-3">
              {!!age && (
                <View className="bg-white/85 px-3 py-1 rounded-full">
                  <Text className="text-gray-700 font-medium">{age} años</Text>
                </View>
              )}
              {!!displayLocation && (
                <View className="bg-white/85 px-3 py-1 rounded-full flex-row items-center">
                  <Location size={16} color="#374151" />
                  <Text className="text-gray-700 font-medium ml-1">
                    {displayLocation}
                  </Text>
                </View>
              )}
              {typeof pet?.likes === "number" && (
                <View className="bg-white/85 px-3 py-1 rounded-full">
                  <Text className="text-gray-700 font-medium">
                    {pet.likes} likes
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ---- Galería ---- */}
        <View className="px-4 pt-3">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Galería
          </Text>

          <FlatList
            data={media}
            keyExtractor={(_, i) => `m-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            renderItem={({ item, index }) => (
              <MediaThumb
                uri={item?.source}
                size={thumbSize}
                active={index === selectedIndex}
                onPress={() => setSelectedIndex(index)}
              />
            )}
            ListEmptyComponent={
              <View className="py-2">
                <Text className="text-gray-500">No hay más fotos.</Text>
              </View>
            }
          />
        </View>

        {/* ---- Descripción ---- */}
        <View className="px-4">
          <Text className="text-base text-gray-700 mt-2">
            {displayDesc || "Esta mascota está en busca de un hogar ❤️"}
          </Text>
        </View>

        {/* ---- Dueño / responsable (BOTÓN) ---- */}
        {owner && (
          <Pressable
            className="flex-row items-center justify-between mt-10 px-4"
            onPress={() =>
              router.push({
                pathname: "indexScreens/profile/[id]",
                params: { index: owner.id },
              })
            }
          >
            <View className="flex-row items-center gap-x-3">
              <Image
                source={{
                  uri:
                    owner.profile_pic ||
                    "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
                }}
                className="w-12 h-12 rounded-full"
              />
              <View>
                <Text className="text-gray-800 font-semibold" numberOfLines={1}>
                  {owner.username || "Responsable"}
                </Text>
                <Text className="text-gray-500" numberOfLines={1}>
                  Organización / Rescatista
                </Text>
              </View>
            </View>

            <View className="bg-gray-100 rounded-full px-3 py-2">
              <Text className="text-gray-700 font-medium">Ver perfil</Text>
            </View>
          </Pressable>
        )}

        {/* ---- CTAs ---- */}
        <View className="px-4 pb-6">
          <View className="flex-row mt-6 gap-x-8">
            <View
              className="flex-1 rounded-2xl"
              style={{ backgroundColor: "#ff8b44", elevation: 3 }}
            >
              <Pressable
                className="py-4 rounded-2xl flex-row items-center justify-center gap-x-3"
                onPress={() =>
                  alert(`Solicitud de adopción enviada para ${displayName}`)
                }
              >
                <Paw size={24} color="white" />
                <Text className="text-white font-bold text-lg">
                  QUIERO ADOPTAR
                </Text>
              </Pressable>
            </View>

            <View
              className="w-14 rounded-2xl bg-gray-100"
              style={{ elevation: 3 }}
            >
              <Pressable
                className="py-4 rounded-2xl items-center justify-center"
                onPress={() => alert("Abrir chat / mensaje")}
              >
                <MessageIcon size={22} color="#FE9B5C" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
