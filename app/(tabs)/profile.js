import { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ProfileMetric } from "../../components/profile/ProfileMetrics";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

const screenWidth = Dimensions.get("window").width;
const IMAGE_SIZE = Math.floor(screenWidth / 3);

// ---------- Celdas memo ----------
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
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderWidth: 0.5,
          borderColor: "#e5e7eb",
        }}
        resizeMode="cover"
      />
    </Pressable>
  );
});

const PetCard = memo(function PetCard({ item }) {
  const router = useRouter();
  const cover = item?.media_pet?.[0]?.source;

  return (
    <Pressable
      className="w-40 p-2 bg-white rounded-xl shadow"
      onPress={() =>
        router.push({
          pathname: "indexScreens/petProfile/[id]",
          params: { pet_id: String(item.id) },
        })
      }
    >
      {cover ? (
        <Image source={{ uri: cover }} className="w-full h-24 rounded-md" />
      ) : (
        <View className="w-full h-24 rounded-md bg-gray-200 items-center justify-center">
          <Text className="text-gray-500 text-xs">Sin foto</Text>
        </View>
      )}

      <Text className="font-semibold text-gray-700 mt-2" numberOfLines={1}>
        {item?.name || "Mascota"}
      </Text>

      {!!item?.breed && (
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {item.breed}
        </Text>
      )}
    </Pressable>
  );
});

// ---------- Header del perfil ----------
function ProfileHeader({
  userRow,
  profilePic,
  pets,
  activeTab,
  setActiveTab,
  postsCount,
  savedCount,
}) {
  const router = useRouter();
  const banner = userRow?.banner_pic;

  const isFoundation = userRow?.account_type === "FOUNDATION";

  const TabButton = ({ label, isActive, onPress }) => (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-2 rounded-full ${
        isActive ? "bg-[#FE9B5C]" : "bg-gray-100"
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          isActive ? "text-white" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View>
      {/* Banner */}
      <View className="relative w-full h-44 bg-gray-100">
        {banner ? (
          <Image
            source={{ uri: banner }}
            className="absolute w-full h-full z-0"
            resizeMode="cover"
          />
        ) : null}
        <View className="absolute w-full h-full bg-black/15" />

        {/* Métricas + avatar */}
        <View className="absolute bottom-[-48px] left-0 right-0 flex-row justify-between px-10 items-center z-10">
          <View className="top-12">
            <ProfileMetric label="Seguidores" value={userRow?.followers ?? 0} />
          </View>

          <Image
            source={{
              uri:
                profilePic || "https://randomuser.me/api/portraits/men/32.jpg",
            }}
            className="w-28 h-28 rounded-full border-4 border-white"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          />

          <View className="top-12">
            <ProfileMetric label="Seguidos" value={userRow?.following ?? 0} />
          </View>
        </View>
      </View>

      {/* Nombre + badge */}
      <View className="mt-14 mx-4 items-center">
        <Text
          className="text-2xl font-semibold text-gray-800"
          numberOfLines={1}
        >
          {userRow?.username || "Usuario"}
        </Text>

        {/* ✅ Badge por tipo */}
        <View className="mt-2 px-3 py-1 rounded-full bg-gray-100">
          <Text className="text-xs font-semibold text-gray-600">
            {isFoundation ? "Fundación" : "Persona"}
          </Text>
        </View>
      </View>

      {/* Bio */}
      <View className="px-6 items-center mt-2">
        <Text className="text-sm text-gray-700 text-center">
          {userRow?.bio || "Este usuario aún no ha escrito una biografía."}
        </Text>
      </View>

      {/* ✅ Acciones extra para fundación */}
      {isFoundation ? (
        <View className="flex-row gap-2 px-4 mt-4">
          <Pressable
            className="flex-1 py-3 bg-[#FE9B5C] rounded-full items-center"
            onPress={() => router.push({ pathname: "adoption/create" })}
          >
            <Text className="text-white font-semibold">Publicar adopción</Text>
          </Pressable>

          <Pressable
            className="flex-1 py-3 bg-gray-100 rounded-full items-center"
            onPress={() => router.push({ pathname: "adoption/requests" })}
          >
            <Text className="text-gray-700 font-semibold">Solicitudes</Text>
          </Pressable>
        </View>
      ) : (
        // Persona: botón opcional (si quieres dejarlo vacío, bórralo)
        <View className="px-4 mt-4">
          <Pressable
            className="py-3 bg-gray-100 rounded-full items-center"
            onPress={() => router.push({ pathname: "adoption/create" })}
          >
            <Text className="text-gray-700 font-semibold">
              Publicar mascota en adopción
            </Text>
          </Pressable>
        </View>
      )}

      {/* Sección Mascotas + Crear Mascota */}
      <View className="flex-row items-center justify-between px-4 mt-4 mb-1">
        <Text className="text-lg font-semibold text-gray-700">
          {isFoundation ? "Mascotas en adopción" : "Mis Mascotas"}
        </Text>

        <Pressable
          className="py-[6px] px-4 bg-[#FE9B5C] rounded-full"
          onPress={() => router.push({ pathname: "createPet/createPet" })}
        >
          <Text className="text-white text-sm font-semibold">
            {isFoundation ? "Añadir Mascota" : "Crear Mascota"}
          </Text>
        </Pressable>
      </View>

      {/* Carrusel mascotas */}
      <FlatList
        data={pets}
        keyExtractor={(item) => String(item.pet_id ?? item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <PetCard item={item} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 14,
          gap: 12,
        }}
        ListEmptyComponent={
          <View className="px-4 py-6">
            <Text className="text-gray-500">
              {isFoundation
                ? "Aún no has agregado mascotas para adopción."
                : "Aún no has agregado mascotas."}
            </Text>
          </View>
        }
      />

      {/* Título + Tabs */}
      <View className="px-4 mt-2 mb-2">
        <Text className="text-lg font-semibold text-gray-700">
          {activeTab === "posts" ? "Mis Publicaciones" : "Guardados"}
        </Text>

        <View className="flex-row gap-2 mt-3 bg-white">
          <TabButton
            label={`Publicaciones (${postsCount})`}
            isActive={activeTab === "posts"}
            onPress={() => setActiveTab("posts")}
          />
          <TabButton
            label={`Guardados (${savedCount})`}
            isActive={activeTab === "saved"}
            onPress={() => setActiveTab("saved")}
          />
        </View>
      </View>

      {/* ✅ Nota/Info extra para fundación */}
      {isFoundation ? (
        <View className="px-4 pb-2">
          <View className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <Text className="text-sm text-gray-700">
              Consejo: Mantén tu perfil actualizado para generar más confianza
              al recibir solicitudes de adopción.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ---------- Pantalla principal ----------
export default function Profile() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [userRow, setUserRow] = useState(null);
  const [pets, setPets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");

  const fetchUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error("Error fetchUser:", error.message);
      return;
    }

    setUserRow(data);
    setProfilePic(data?.profile_pic ?? null);
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchPets = useCallback(async () => {
    if (!userRow?.id) return;

    // ✅ Por ahora, fundación y persona comparten el mismo esquema (pets por user_id)
    // Si luego haces "foundation_id", aquí se ajusta el filtro.
    const { data, error } = await supabase
      .from("pet")
      .select("*, media_pet(*)")
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetchPets:", error.message);
      return;
    }

    setPets(data || []);
  }, [userRow?.id]);

  const fetchPosts = useCallback(async () => {
    if (!userRow?.id) return;

    const { data, error } = await supabase
      .from("post")
      .select("*, media_post(*)")
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetchPosts:", error.message);
      return;
    }

    setPosts(data || []);
  }, [userRow?.id]);

  const fetchBookmarks = useCallback(async () => {
    if (!userRow?.id) return;

    const { data, error } = await supabase
      .from("post_bookmarks")
      .select(
        `
        id,
        created_at,
        post:post_id (
          *,
          media_post(*)
        )
      `,
      )
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetchBookmarks:", error.message);
      return;
    }

    const onlyPosts = (data || []).map((row) => row.post).filter(Boolean);
    setBookmarkedPosts(onlyPosts);
  }, [userRow?.id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchUser();
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    (async () => {
      if (!userRow?.id) return;
      await Promise.all([fetchPets(), fetchPosts(), fetchBookmarks()]);
    })();
  }, [userRow?.id, fetchPets, fetchPosts, fetchBookmarks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUser();
      await Promise.all([fetchPets(), fetchPosts(), fetchBookmarks()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUser, fetchPets, fetchPosts, fetchBookmarks]);

  // PERF helpers
  const keyExtractor = useCallback((item) => String(item.id), []);
  const getItemLayout = useCallback((_data, index) => {
    const row = Math.floor(index / 3);
    const length = IMAGE_SIZE + 0.5;
    return { length, offset: row * length, index };
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <View className="w-full">
        <ProfileHeader
          userRow={userRow}
          profilePic={profilePic}
          pets={pets}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          postsCount={posts?.length ?? 0}
          savedCount={bookmarkedPosts?.length ?? 0}
        />
      </View>
    );
  }, [userRow, profilePic, pets, activeTab, posts, bookmarkedPosts]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const dataToShow = activeTab === "posts" ? posts : bookmarkedPosts;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />

      <FlatList
        data={dataToShow}
        keyExtractor={keyExtractor}
        numColumns={3}
        renderItem={({ item }) => <PostCell item={item} />}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={9}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FE9B5C"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Text className="text-gray-500">
              {activeTab === "posts"
                ? "Aún no hay publicaciones"
                : "Aún no tienes guardados"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
