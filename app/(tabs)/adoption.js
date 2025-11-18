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
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { supabase } from "../../lib/supabase";
import { Stack, useRouter } from "expo-router";
import { Heart, Close, Paw, Info } from "../../components/Icon";
import { LinearGradient } from "expo-linear-gradient";

/** ---------- Tarjeta de adopción (memo) ---------- */
const AdoptionCard = React.memo(function AdoptionCard({
  item,
  getAge,
  onInfoPress,
  onOwnerPress,
}) {
  const cover = item?.media_adoption_pet?.[0]?.source;
  const owner = item?.user;
  const ownerName = owner?.username || "Dueño desconocido";
  const { width, height } = useWindowDimensions();
  const cardWidth = useMemo(() => width - 32, [width]);
  const cardHeight = useMemo(() => Math.floor(height * 0.5), [height]);
  const ownerPic =
    owner?.profile_pic ||
    "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg";

  return (
    <View className="gap-3">
      {/* Tarjeta principal */}
      <View
        className="bg-white rounded-3xl overflow-hidden shadow-xl self-center"
        style={{
          width: cardWidth,
          height: cardHeight,
          alignSelf: "center",
          elevation: 6,
        }}
      >
        {!!cover && (
          <Image
            source={{ uri: cover }}
            className="w-full h-[350px]"
            resizeMode="cover"
          />
        )}

        <View className="flex-row px-4 py-3">
          <View className="flex-1 pr-4">
            <Text
              className="text-xl font-semibold text-gray-700"
              numberOfLines={1}
            >
              {item?.name ?? ""}
            </Text>

            {!!item?.birthdate && (
              <Text className="text-base text-gray-600" numberOfLines={1}>
                {getAge(item.birthdate)} años
              </Text>
            )}

            <Text className="text-base text-gray-400" numberOfLines={1}>
              {item?.location ?? ""}
            </Text>
          </View>

          <Pressable
            className="ml-auto items-center justify-center p-1"
            onPress={() => onInfoPress?.(item?.id)}
            hitSlop={10}
          >
            <Info color="#6b7280" size={30} />
          </Pressable>
        </View>
      </View>

      {/* Tarjeta secundaria: likes + dueño */}
      <View
        className="bg-white rounded-3xl flex-row justify-between items-center px-3 py-3 shadow-lg w-11/12 self-center"
        style={{
          width: cardWidth,
          // height: cardHeight,
          alignSelf: "center",
          elevation: 6,
        }}
      >
        <View className="rounded-full px-3 border border-red-400 items-center justify-center">
          <Text className="text-lg font-semibold text-red-400">
            {(item?.likes ?? 0) + " Likes"}
          </Text>
        </View>

        <Pressable
          className="flex-row items-center justify-center gap-x-2"
          onPress={() => owner?.id && onOwnerPress?.(owner.id)}
          hitSlop={10}
        >
          <Text
            className="text-xl text-gray-600 font-semibold"
            numberOfLines={1}
          >
            {ownerName}
          </Text>
          <Image
            source={{ uri: ownerPic }}
            className="w-12 h-12 rounded-full ring-4 ring-white shadow-md"
          />
        </Pressable>
      </View>
    </View>
  );
});

export default function Adoption() {
  const router = useRouter();

  const [adoptionPet, setAdoptionPet] = useState([]);
  const [index, setIndex] = useState(0);
  const swiperRef = useRef(null);

  const [swipeMessage, setSwipeMessage] = useState("");
  const swipeMessageRef = useRef("");
  const [canSwipe, setCanSwipe] = useState(true);
  const isManualSwipe = useRef(false);

  const [refreshing, setRefreshing] = useState(false);

  // Edad
  const getAge = useCallback((birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  // Fetch con dueño incluido
  const fetchAdoptionPet = useCallback(async () => {
    const { data, error } = await supabase
      .from("adoption_pet")
      .select(
        `
        id, name, birthdate, location, likes, user_id,
        media_adoption_pet ( source ),
        user: user_id ( id, username, profile_pic )
      `
      )
      .order("created_at", { ascending: false });

    if (!error) setAdoptionPet(data ?? []);
  }, []);

  useEffect(() => {
    fetchAdoptionPet();
  }, [fetchAdoptionPet]);

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

  // Señal “Lo quiero / No me interesa”
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
    [canSwipe]
  );

  // Navegaciones
  const goToAdoptionProfile = useCallback(
    (adoptionId) => {
      if (!adoptionId) return;
      router.push({
        pathname: "indexScreens/adoptionPetProfile/[id]",
        params: { adoption_pet_id: String(adoptionId) },
      });
    },
    [router]
  );

  const goToOwnerProfile = useCallback(
    (ownerId) => {
      if (!ownerId) return;
      router.push({
        pathname: "indexScreens/profile/[id]",
        params: { index: String(ownerId) },
      });
    },
    [router]
  );

  const swipeBgClass =
    swipeMessage === "¡Lo quiero!" ? "bg-emerald-400" : "bg-red-400";

  return (
    <View className="flex-1 bg-white">
      {/* Header nativo */}
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />

      {/* Gradient naranja con borde redondeado abajo */}
      <View className="absolute top-0 left-0 right-0 h-52 rounded-b-3xl overflow-hidden">
        <LinearGradient
          colors={["#f97316", "#facc15"]}
          className="w-full h-full"
        />
      </View>

      {/* Contenido */}
      <ScrollView
        className="flex-1"
        // contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Barra superior: título + heart */}
        <View className="mt-10 px-4 flex-row items-center justify-between">
          <Text className="text-white text-3xl font-bold">Descubre</Text>

          <Pressable
            className="bg-white/20 p-2 rounded-full"
            onPress={() => router.push({ pathname: "adoptionLikes/[id]" })}
            hitSlop={10}
          >
            <Heart size={24} color="white" />
          </Pressable>
        </View>

        {/* Wrapper de swiper y botones */}
        <View className="items-center">
          {/* Mensaje flotante arriba del card */}
          {swipeMessage !== "" && (
            <View className={`mb-3 px-5 py-2 rounded-2xl ${swipeBgClass}`}>
              <Text className="text-white font-bold text-lg">
                {swipeMessage}
              </Text>
            </View>
          )}

          {/* Swiper (cards) */}
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
              onSwiping={(x, y) => handleSwiping(x)} // <- usa x para el mensaje
              onSwipedRight={() => {
                if (isManualSwipe.current) return;
                setSwipeMessage("");
                swipeMessageRef.current = "";
              }}
              onSwipedLeft={() => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
              }}
              onSwipedTop={() => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
                alert("Me adoptaste");
              }}
              onSwiped={(i) => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
                setIndex(i + 1);
              }}
              // 🔴 IMPORTANTE: limpiar cuando se “aborta” el swipe
              onSwipedAborted={() => {
                setSwipeMessage("");
                swipeMessageRef.current = "";
              }}
              cardIndex={0}
              containerStyle={{
                marginTop: 0,
              }}
            />
          ) : (
            <Text className="text-gray-500 text-lg text-center mt-6">
              Cargando mascotas...
            </Text>
          )}
        </View>
      </ScrollView>

      {/* BOTONES — FIJOS ABAJO DE LA PANTALLA */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-center gap-x-5"
        style={{ bottom: 40, zIndex: 50 }}
        pointerEvents="box-none"
      >
        <Pressable
          className="rounded-full items-center justify-center w-[78px] h-[78px] bg-red-500 shadow-xl"
          onPress={() => handleSwipe("left")}
        >
          <Close size={38} color="white" />
        </Pressable>

        <Pressable
          className="rounded-full items-center justify-center w-[92px] h-[92px] bg-[#FE9B5C] shadow-xl"
          onPress={() => alert("Me adoptaste")}
        >
          <Paw size={42} color="white" />
        </Pressable>

        <Pressable
          className="rounded-full items-center justify-center w-[78px] h-[78px] bg-yellow-400 shadow-xl"
          onPress={() => handleSwipe("right")}
        >
          <Heart size={38} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
