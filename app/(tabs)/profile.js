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
import { MessageIcon } from "../../components/Icon";
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
          params: { pet_id: String(item.id) }, // 👈 solo pet_id
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
  onPressFollow,
  onPressMessage,
}) {
  const router = useRouter();
  const banner = userRow?.banner_pic;

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

      {/* Nombre + Bio + Acciones */}
      <View className="mt-14 mx-4 items-center">
        <Text
          className="text-2xl font-semibold text-gray-800"
          numberOfLines={1}
        >
          {userRow?.username || "Usuario"}
        </Text>
      </View>

      <View className="px-6 items-center mt-2">
        <Text className="text-sm text-gray-700 text-center">
          {userRow?.bio || "Este usuario aún no ha escrito una biografía."}
        </Text>
      </View>

      <View className="mt-3 flex-row justify-center items-center gap-x-3">
        <Pressable
          onPress={onPressFollow}
          className="py-[8px] px-7 bg-[#FE9B5C] rounded-full my-2"
        >
          <Text className="text-white text-base font-semibold">Seguir</Text>
        </Pressable>
        {/* <Pressable
          onPress={onPressMessage}
          className="p-[8px] bg-white rounded-2xl my-2"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <MessageIcon color="#FE9B5C" size={19} />
        </Pressable> */}
      </View>

      {/* Sección Mascotas */}
      <View className="flex-row items-center justify-between px-4 mt-2 mb-1">
        <Text className="text-lg font-semibold text-gray-700">
          Mis Mascotas
        </Text>

        <Pressable
          className="py-[6px] px-4 bg-[#FE9B5C] rounded-full"
          onPress={() => router.push({ pathname: "createPet/createPet" })}
        >
          <Text className="text-white text-sm font-semibold">
            Crear Mascota
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
      />

      {/* Título publicaciones */}
      <View className="px-4 mt-2 mb-2">
        <Text className="text-lg font-semibold text-gray-700">
          Mis Publicaciones
        </Text>
      </View>
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

  // Fetchers
  const fetchUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("clerk_id", user.id)
      .single();
    if (!error) {
      setUserRow(data);
      setProfilePic(data?.profile_pic ?? null);
    }
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchPets = useCallback(async () => {
    if (!userRow?.id) return;
    const { data, error } = await supabase
      .from("pet")
      .select("*, media_pet(*)")
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });
    if (!error) setPets(data || []);
  }, [userRow?.id]);

  const fetchPosts = useCallback(async () => {
    if (!userRow?.id) return;
    const { data, error } = await supabase
      .from("post")
      .select("*, media_post(*)")
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });
    if (!error) setPosts(data || []);
  }, [userRow?.id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchUser();
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  // Carga inicial y dependiente
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    (async () => {
      if (!userRow?.id) return;
      await Promise.all([fetchPets(), fetchPosts()]);
    })();
  }, [userRow?.id, fetchPets, fetchPosts]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUser();
      await Promise.all([fetchPets(), fetchPosts()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUser, fetchPets, fetchPosts]);

  // Perf helpers
  const keyExtractor = useCallback((item) => String(item.id), []);
  const getItemLayout = useCallback((_data, index) => {
    const row = Math.floor(index / 3);
    const length = IMAGE_SIZE + 0.5;
    return { length, offset: row * length, index };
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <ProfileHeader
        userRow={userRow}
        profilePic={profilePic}
        pets={pets}
        onPressFollow={() =>
          alert(`Seguiste a ${userRow?.username || "este usuario"}`)
        }
        onPressMessage={() =>
          alert(`Escribirle a ${userRow?.username || "este usuario"}`)
        }
      />
    );
  }, [userRow, profilePic, pets]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
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
        }}
      />

      {/* Un solo FlatList: header (perfil + mascotas) + grid de posts */}
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        numColumns={3}
        renderItem={({ item }) => <PostCell item={item} />}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        // PERF
        getItemLayout={getItemLayout}
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={9}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews
        // REFRESH
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FE9B5C"
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Text className="text-gray-500">Aún no hay publicaciones</Text>
          </View>
        }
      />
    </View>
  );
}
