import { useEffect, useState, memo, useCallback } from "react";
import {
  View,
  Image,
  Text,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
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
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Alert } from "react-native";

export default function PetProfile() {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const imageSize = screenWidth / 3;

  // 👇 Solo recibimos pet_id
  const { pet_id } = useLocalSearchParams();
  const pid = Array.isArray(pet_id) ? pet_id[0] : pet_id;

  const router = useRouter();

  const [petProfileModalVisible, setPetProfileModalVisible] = useState(false);
  const [petShareModalVisible, setPetShareModalVisible] = useState(false);
  const [liked, setLiked] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [pet, setPet] = useState(null); // null -> objeto cuando cargue
  const [showVerMas, setShowVerMas] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // 👈 estado de refresh

  const handleLike = () => setLiked((prev) => !prev);
  const onReportPost = () => alert(`Usuario reportado ${pet?.name ?? ""}`);
  const onTextLayout = (e) => setShowVerMas(e?.nativeEvent?.lines?.length > 2);

  // ===== Supabase fetchers =====
  const fetchQualities = useCallback(async () => {
    if (!pid) return;
    const { data, error } = await supabase
      .from("qualities")
      .select("*")
      .eq("pet_id", String(pid));
    if (!error) setQualities(data || []);
  }, [pid]);

  const fetchPosts = useCallback(async () => {
    if (!pid) return;
    const { data, error } = await supabase
      .from("post")
      .select(
        `
    *,
    media_post(*),
    user:user_id (
      id,
      username,
      profile_pic
    )
  `
      )
      .eq("pet_id", String(pid))
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
  }, [pid]);

  const fetchPet = useCallback(async () => {
    if (!pid) return;
    // Si tu PK fuera 'id', aquí va 'id'
    const { data, error } = await supabase
      .from("pet")
      .select(
        `
    *,
    media_pet(*),
    user:user_id (
      id,
      username,
      profile_pic
    )
  `
      )
      .eq("id", String(pid))
      .limit(1);

    if (!error) setPet(data?.[0] ?? null);
  }, [pid]);

  // 🚿 Carga/refresh de todo
  const loadAll = useCallback(async () => {
    await Promise.all([fetchPet(), fetchPosts(), fetchQualities()]);
  }, [fetchPet, fetchPosts, fetchQualities]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  // Celda del grid (memo para performance) — usa router.push
  const PostCell = memo(function PostCell({ item }) {
    const router = useRouter();
    const uri = item?.media_post?.[0]?.source;
    if (!uri) return null;
    return (
      <Pressable
        className="justify-center items-center"
        onPress={() =>
          router.push({
            pathname: "indexScreens/comment",
            params: { index: item.id },
          })
        }
      >
        <Image
          source={{ uri }}
          style={{
            width: imageSize,
            height: imageSize,
            borderWidth: 0.5,
            borderColor: "#ccc",
          }}
          resizeMode="cover"
        />
      </Pressable>
    );
  });

  // Para scroll más fluido (celdas fijas)
  const CELL = imageSize + 0.5;
  const getItemLayout = useCallback(
    (_data, i) => {
      const row = Math.floor(i / 3);
      return { length: CELL, offset: row * CELL, index: i };
    },
    [CELL]
  );

  // dentro de PetProfile() agrega esta función:
  const handleDeletePet = useCallback(
    async (petId) => {
      if (!petId) return;

      try {
        // (Opcional) Si quieres confirmar aquí en vez de en el modal:
        // Si ya lo confirmas en el modal, puedes quitar este Alert.
        Alert.alert(
          "Eliminar mascota",
          "¿Seguro que quieres eliminar esta mascota? Esta acción no se puede deshacer.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                const { error } = await supabase
                  .from("pet")
                  .delete()
                  .eq("id", String(petId));

                if (error) {
                  Alert.alert("Error", error.message);
                  return;
                }

                // Limpia UI local
                setPet(null);
                setPosts([]);
                setQualities([]);

                // Cierra modal y vuelve atrás
                setPetProfileModalVisible(false);
                router.back();
              },
            },
          ]
        );
      } catch (e) {
        Alert.alert("Error", e?.message ?? "No se pudo eliminar la mascota.");
      }
    },
    [router]
  );

  // ---------- HEADER ----------
  const renderHeader = useCallback(() => {
    // const ownerId = pet?.user_id ?? posts?.[0]?.user?.[0]?.id ?? "";

    // Dueño preferido: el que viene de pet
    const ownerFromPet = pet?.user;

    // Si no hay en pet, tomamos el del primer post
    const ownerFromPost = posts?.[0]?.user;

    const owner = ownerFromPet || ownerFromPost || null;

    const ownerId = owner?.id ?? "";
    const ownerName = owner?.username || "Usuario desconocido";
    const ownerPic =
      owner?.profile_pic ||
      "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg";

    return (
      <>
        <View className="rounded-t-3xl bg-white pb-3 shadow-md">
          <View className="w-full items-center mt-5">
            <View className="w-12 h-1.5 bg-gray-400 rounded-full" />
          </View>

          {/* Barra superior: nombre + acciones */}
          <View className="flex-row px-5 mt-2">
            <Text className="text-3xl font-medium text-slate-700">
              {pet?.name ?? ""}
            </Text>

            <View className="flex-row ml-auto gap-4">
              {/* <Pressable onPress={handleLike}>
                <Heart color={liked ? "red" : "#374151"} size={24} />
              </Pressable> */}

              {/* Abre modal de compartir (renderizado afuera) */}
              <Pressable onPress={() => setPetShareModalVisible(true)}>
                <Share />
              </Pressable>
            </View>
          </View>

          {/* Ubicación */}
          <View className="flex-row items-center mt-1 px-5">
            <Location size={20} color="#6b7280" />
            <Text className="ml-1 text-gray-500">{pet?.location ?? ""}</Text>
          </View>

          {/* Qualities horizontal */}
          <FlatList
            data={qualities}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18 }}
            ItemSeparatorComponent={() => <View className="w-2" />}
            renderItem={({ item }) => (
              <View className="bg-gray-300 flex-col justify-center items-center rounded-full px-3 py-2 shadow my-3">
                <Text className="text-base font-medium text-slate-600">
                  {item.description}
                </Text>
              </View>
            )}
          />

          {/* Acerca de */}
          <Pressable className="px-5" onPress={() => setExpanded(!expanded)}>
            <View>
              <Text
                numberOfLines={expanded ? undefined : 2}
                onTextLayout={onTextLayout}
                className="text-base text-gray-700"
              >
                {pet?.description ?? ""}
              </Text>
            </View>

            {showVerMas && (
              <Text className="text-gray-400 font-normal text-base">
                {expanded ? "Ver menos" : "Ver más..."}
              </Text>
            )}
          </Pressable>
        </View>

        {/* ---------- FOOTER: perfil + botones ---------- */}
        <View className="bg-white pb-2">
          <View className="flex-row items-center px-5 pt-2 pb-3 gap-x-3">
            {/* Perfil dinámico */}
            <Pressable
              className="flex-row items-center gap-x-3"
              onPress={() =>
                router.push({
                  pathname: "indexScreens/profile/[id]",
                  params: { index: ownerId },
                })
              }
              disabled={!ownerId}
            >
              <Image
                className="h-12 w-12 rounded-full"
                source={{ uri: ownerPic }}
              />
              <View className="flex-col justify-center">
                <Text className="font-bold text-base text-gray-700">
                  {ownerName}
                </Text>
                {/* Si no tienes fundación, puedes quitar esta línea o usar otro campo */}
                {/* <Text className="text-gray-400">Fundación Happy Feet</Text> */}
              </View>
            </Pressable>

            <View className="flex-1" />

            {/* Dots: abre modal de opciones */}
            <Pressable
              className="p-2 z-10"
              onPress={() => setPetProfileModalVisible(true)}
            >
              <Dots size={24} />
            </Pressable>
          </View>

          {/* <View className="flex-row px-5 gap-x-[5px]">
            <View
              className="flex-[0.8] rounded-2xl my-2 shadow"
              style={{ elevation: 5, backgroundColor: "#ff8b44" }}
            >
              <Pressable
                onPress={() => alert(`Adoptaste a ${pet?.name ?? ""}`)}
                className="flex-row items-center justify-center py-4 rounded-2xl gap-x-4"
                style={{ overflow: "hidden" }}
              >
                <Paw color="white" size={27} />
                <Text className="font-bold text-white text-2xl">ADOPTAR</Text>
                <Paw color="white" size={27} />
              </Pressable>
            </View>

            <View
              className="flex-[0.2] rounded-2xl my-2 shadow"
              style={{ elevation: 5, backgroundColor: "#f9fafb" }}
            >
              <Pressable
                onPress={() => alert(`Escribirle a ${pet?.name ?? ""}`)}
                className="flex-row items-center justify-center py-4 rounded-2xl"
                style={{ overflow: "hidden" }}
              >
                <MessageIcon color="#ff8b44" size={27} />
              </Pressable>
            </View>
          </View> */}
        </View>
      </>
    );
  }, [
    liked,
    pet,
    qualities,
    expanded,
    showVerMas,
    posts,
    router,
    handleLike,
    onTextLayout,
  ]);

  // Imagen de portada segura
  const coverUri = pet?.media_pet?.[0]?.source
    ? String(pet.media_pet[0].source)
    : "";

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackground: () => (
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "transparent"]}
              style={{ flex: 1 }}
            />
          ),
          headerLeft: () => (
            <View className="mt-4">
              <Pressable onPress={() => router.back()}>
                <ArrowLeft size={34} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <PetShareModal
        visible={petShareModalVisible}
        onClose={() => setPetShareModalVisible(false)}
      />

      <PetProfileModal
        visible={petProfileModalVisible}
        onClose={() => setPetProfileModalVisible(false)}
        selectedProfileIndex={pid}
        onReport={(i) => console.log("report", i)}
        onDeletePet={(id) => handleDeletePet(id)} // <-- aquí ya borra en BD
      />

      {/* 🔒 IMAGEN FIJA */}
      <View
        className="absolute top-0 left-0 right-0"
        style={{ height: screenHeight * 0.5, zIndex: 0 }}
        pointerEvents="none"
      >
        {!!coverUri && (
          <Image
            source={{ uri: coverUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}
      </View>

      {/* 📜 CONTENIDO + REFRESH */}
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PostCell item={item} />}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={renderHeader}
        getItemLayout={getItemLayout}
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={9}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews
        contentContainerStyle={{ paddingTop: screenHeight * 0.5 - 35 }}
        style={{ backgroundColor: "transparent" }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}
