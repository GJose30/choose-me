import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  Alert,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { supabase } from "../../lib/supabase";
import { Stack, useRouter } from "expo-router";
import { Heart, Close, Paw, Info } from "../../components/Icon";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";

/** ---------- Tarjeta de adopción (memo) ---------- */
const AdoptionCard = React.memo(function AdoptionCard({
  item,
  getAge,
  onInfoPress,
  onOwnerPress,
}) {
  // ✅ Imagen: pet -> media_pet(source)
  const cover = item?.pet?.media_pet?.[0]?.source;

  const owner = item?.user;
  const ownerName = owner?.username || "Dueño desconocido";
  const ownerPic =
    owner?.profile_pic ||
    "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg";

  const { width, height } = useWindowDimensions();

  const cardWidth = useMemo(() => Math.min(width * 0.92, 420), [width]);
  const cardHeight = useMemo(() => {
    const h = Math.floor(height * 0.62);
    return Math.max(460, Math.min(h, 640));
  }, [height]);

  const displayName = item?.name ?? item?.pet?.name ?? "";
  const displayBirthdate = item?.birthdate ?? item?.pet?.birthdate ?? null;

  return (
    <View
      className="rounded-[28px] overflow-hidden bg-white shadow-xl"
      style={{
        width: cardWidth,
        height: cardHeight,
        alignSelf: "center",
        elevation: 10,
      }}
    >
      {!!cover ? (
        <Image
          source={{ uri: cover }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-gray-200">
          <Text className="text-gray-500">Sin imagen</Text>
        </View>
      )}

      <View className="absolute left-0 right-0 bottom-0 top-0">
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.72)"]}
          style={{ flex: 1 }}
        />
      </View>

      <View className="absolute top-3 left-3 right-3 flex-row items-center justify-between">
        {!!item?.location ? (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.22)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
            }}
            className="px-3 py-2 rounded-full"
          >
            <Text className="text-white font-semibold" numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <Pressable
          style={{
            backgroundColor: "rgba(255,255,255,0.22)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
          }}
          className="p-2 rounded-full"
          onPress={() => onInfoPress?.(item?.id)}
          hitSlop={10}
        >
          <Info color="white" size={26} />
        </Pressable>
      </View>

      <View className="absolute left-0 right-0 bottom-0 px-4 pb-4">
        <View className="flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text
              className="text-white text-3xl font-extrabold"
              numberOfLines={1}
            >
              {displayName}
            </Text>

            {!!displayBirthdate && (
              <Text
                className="text-white/90 text-base font-semibold"
                numberOfLines={1}
              >
                {getAge(displayBirthdate)} años
              </Text>
            )}
          </View>

          <View className="bg-white/22 px-3 py-2 rounded-full border border-white/20">
            <Text className="text-white font-bold">
              {(item?.likes ?? 0) + " Likes"}
            </Text>
          </View>
        </View>

        <Pressable
          className="mt-4 flex-row items-center"
          onPress={() => owner?.id && onOwnerPress?.(owner.id)}
          hitSlop={10}
        >
          <Image
            source={{ uri: ownerPic }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.95)",
            }}
          />
          <View className="ml-3 flex-1">
            <Text
              className="text-white font-semibold text-lg"
              numberOfLines={1}
            >
              {ownerName}
            </Text>
            <Text className="text-white/75 text-sm" numberOfLines={1}>
              Ver perfil del dueño
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

export default function Adoption() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const [userRow, setUserRow] = useState(null);

  const [adoptionPet, setAdoptionPet] = useState([]);
  const [index, setIndex] = useState(0);
  const swiperRef = useRef(null);

  const [swipeMessage, setSwipeMessage] = useState("");
  const swipeMessageRef = useRef("");
  const [canSwipe, setCanSwipe] = useState(true);
  const isManualSwipe = useRef(false);

  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const isLikingRef = useRef(false);

  const footerHeight = useMemo(() => {
    const base = height < 750 ? 104 : 120;
    return base + insets.bottom;
  }, [height, insets.bottom]);

  const swiperHeight = useMemo(() => {
    const h = height - footerHeight - 140;
    return Math.max(460, Math.min(h, 700));
  }, [height, footerHeight]);

  const getAge = useCallback((birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  // ✅ Traer tu userRow interno (tabla user) por clerk_id
  const fetchUserRow = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const { data, error } = await supabase
      .from("user")
      .select("id, username")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error("fetchUserRow:", error.message);
      return;
    }

    setUserRow(data);
  }, [isLoaded, isSignedIn, user?.id]);

  // ✅ Like: crea registro en adoption_likes_pet
  const likeAdoptionPet = useCallback(
    async (adoptionPetId) => {
      if (!isLoaded || !isSignedIn) {
        Alert.alert("Atención", "Debes iniciar sesión para dar like.");
        return;
      }
      if (!userRow?.id) return;
      if (!adoptionPetId) return;

      // Evita doble tap / doble swipe rápido
      if (isLikingRef.current) return;
      isLikingRef.current = true;

      // Recomendado: tener UNIQUE(user_id, adoption_pet_id) y hacer upsert.
      // Si no tienes el UNIQUE, esto insertará duplicados.
      const payload = {
        user_id: userRow.id,
        adoption_pet_id: adoptionPetId,
        // created_at lo pone la DB
      };

      const { error } = await supabase
        .from("adoption_likes_pet")
        .upsert(payload, { onConflict: "user_id,adoption_pet_id" });

      if (error) {
        console.error("likeAdoptionPet:", error.message);
        // Si no existe el UNIQUE, te dará error de onConflict o no funcionará como esperas.
      } else {
        // (Opcional) feedback rápido
        // setSwipeMessage("Guardado ❤️");
      }

      isLikingRef.current = false;
    },
    [isLoaded, isSignedIn, userRow?.id],
  );

  // ✅ Fetch adoption_pet con pet->media_pet y user
  const fetchAdoptionPet = useCallback(async () => {
    const { data, error } = await supabase
      .from("adoption_pet")
      .select(
        `
        id, name, birthdate, location, likes, user_id, pet_id,
        pet:pet_id (
          id,
          name,
          media_pet ( source )
        ),
        user: user_id ( id, username, profile_pic )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchAdoptionPet error:", error.message);
      return;
    }

    setAdoptionPet(data ?? []);
  }, []);

  useEffect(() => {
    fetchAdoptionPet();
  }, [fetchAdoptionPet]);

  useEffect(() => {
    fetchUserRow();
  }, [fetchUserRow]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAdoptionPet();
      setIndex(0);
      swiperRef.current?.jumpToCardIndex?.(0);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAdoptionPet]);

  const handleSwiping = useCallback((x) => {
    const next = x < -50 ? "No me interesa" : x > 50 ? "¡Lo quiero!" : "";
    if (swipeMessageRef.current !== next) {
      swipeMessageRef.current = next;
      setSwipeMessage(next);
    }
  }, []);

  const handleSwipe = useCallback(
    async (direction) => {
      if (!canSwipe) return;

      const msg = direction === "right" ? "¡Lo quiero!" : "No me interesa";
      setSwipeMessage(msg);
      swipeMessageRef.current = msg;
      isManualSwipe.current = true;
      setCanSwipe(false);

      setTimeout(() => {
        if (direction === "right") swiperRef.current?.swipeRight();
        else swiperRef.current?.swipeLeft();
      }, 120);

      setTimeout(() => {
        setSwipeMessage("");
        swipeMessageRef.current = "";
        setCanSwipe(true);
        isManualSwipe.current = false;
      }, 700);
    },
    [canSwipe],
  );

  const goToAdoptionProfile = useCallback(
    (adoptionId) => {
      if (!adoptionId) return;
      router.push({
        pathname: "indexScreens/adoptionPetProfile/[id]",
        params: { adoption_pet_id: String(adoptionId) },
      });
    },
    [router],
  );

  const goToOwnerProfile = useCallback(
    (ownerId) => {
      if (!ownerId) return;
      router.push({
        pathname: "indexScreens/profile/[id]",
        params: { index: String(ownerId) },
      });
    },
    [router],
  );

  const swipeBgClass =
    swipeMessage === "¡Lo quiero!" ? "bg-emerald-400" : "bg-red-400";

  const blob1 = useMemo(() => Math.min(width * 0.85, 380), [width]);
  const blob2 = useMemo(() => Math.min(width * 0.75, 320), [width]);
  const blob3 = useMemo(() => Math.min(width * 0.65, 280), [width]);

  return (
    <View className="flex-1">
      {/* Fondo */}
      <View className="absolute top-0 left-0 right-0 bottom-0">
        <LinearGradient
          colors={["#FFF7ED", "#FFE4E6", "#DBEAFE"]}
          locations={[0, 0.55, 1]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <View
          style={{
            position: "absolute",
            top: -blob1 * 0.25,
            left: -blob1 * 0.25,
            width: blob1,
            height: blob1,
            borderRadius: blob1 / 2,
            backgroundColor: "rgba(254,155,92,0.25)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: height * 0.12,
            right: -blob2 * 0.35,
            width: blob2,
            height: blob2,
            borderRadius: blob2 / 2,
            backgroundColor: "rgba(96,165,250,0.22)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -blob3 * 0.35,
            left: width * 0.18,
            width: blob3,
            height: blob3,
            borderRadius: blob3 / 2,
            backgroundColor: "rgba(250,204,21,0.20)",
          }}
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.0)", "rgba(255,255,255,0.35)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>

      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: footerHeight + 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mt-10 px-4 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-800 text-3xl font-extrabold">
              Descubre
            </Text>
            <Text className="text-slate-600 font-medium">
              Encuentra tu próxima amistad 🐾
            </Text>
          </View>

          <Pressable
            style={{
              backgroundColor: "rgba(255,255,255,0.55)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.7)",
            }}
            className="p-2 rounded-full"
            onPress={() => router.push({ pathname: "adoptionLikes/[id]" })}
            hitSlop={10}
          >
            <Heart size={24} color="#FE9B5C" />
          </Pressable>
        </View>

        <View className="items-center">
          {swipeMessage !== "" && (
            <View
              className={`mt-4 mb-3 px-5 py-2 rounded-2xl ${swipeBgClass}`}
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              <Text className="text-white font-bold text-lg">
                {swipeMessage}
              </Text>
            </View>
          )}

          {adoptionPet.length > 0 ? (
            <Swiper
              ref={(c) => (swiperRef.current = c)}
              cards={adoptionPet}
              renderCard={(item) => (
                <AdoptionCard
                  item={item}
                  getAge={getAge}
                  onInfoPress={goToAdoptionProfile}
                  onOwnerPress={goToOwnerProfile}
                />
              )}
              backgroundColor="transparent"
              stackSize={1}
              stackSeparation={0}
              animateCardOpacity
              disableBottomSwipe
              onSwiping={(x) => handleSwiping(x)}
              // ✅ Aquí guardamos el like al swipar a la derecha
              onSwipedRight={(cardIndex) => {
                const item = adoptionPet?.[cardIndex];
                if (item?.id) likeAdoptionPet(item.id);
                setSwipeMessage("");
                swipeMessageRef.current = "";
              }}
              onSwipedLeft={() => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
              }}
              onSwiped={(i) => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
                setIndex(i + 1);
              }}
              onSwipedAborted={() => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
              }}
              cardIndex={0}
              containerStyle={{
                marginTop: 14,
                height: swiperHeight,
              }}
            />
          ) : (
            <Text className="text-slate-600 text-lg text-center mt-6">
              Cargando mascotas...
            </Text>
          )}
        </View>
      </ScrollView>

      {/* DOCK INFERIOR */}
      <View
        className="absolute left-0 right-0"
        style={{
          bottom: 0,
          paddingBottom: insets.bottom + 10,
          paddingTop: 14,
          paddingHorizontal: 18,
        }}
      >
        <View
          className="flex-row items-center justify-center gap-x-5 rounded-3xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.72)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.9)",
            paddingVertical: 12,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <Pressable
            className="rounded-full items-center justify-center"
            style={{
              width: height < 750 ? 66 : 74,
              height: height < 750 ? 66 : 74,
              backgroundColor: "#ef4444",
            }}
            onPress={() => handleSwipe("left")}
          >
            <Close size={height < 750 ? 32 : 36} color="white" />
          </Pressable>

          <Pressable
            className="rounded-full items-center justify-center"
            style={{
              width: height < 750 ? 78 : 88,
              height: height < 750 ? 78 : 88,
              backgroundColor: "#FE9B5C",
            }}
            onPress={() => alert("Me adoptaste")}
          >
            <Paw size={height < 750 ? 38 : 42} color="white" />
          </Pressable>

          {/* ✅ Este botón hace swipeRight, y swipeRight dispara onSwipedRight => like */}
          <Pressable
            className="rounded-full items-center justify-center"
            style={{
              width: height < 750 ? 66 : 74,
              height: height < 750 ? 66 : 74,
              backgroundColor: "#facc15",
            }}
            onPress={() => handleSwipe("right")}
          >
            <Heart size={height < 750 ? 32 : 36} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
