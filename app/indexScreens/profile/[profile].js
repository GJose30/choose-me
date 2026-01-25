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
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { MessageIcon, ArrowLeft } from "../../../components/Icon";
import { ProfileMetric } from "../../../components/profile/ProfileMetrics";
import { supabase } from "../../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

const screenWidth = Dimensions.get("window").width;
const IMAGE_SIZE = Math.floor(screenWidth / 3);

const FALLBACK_PROFILE = "https://randomuser.me/api/portraits/men/32.jpg";

// ---- Celdas memoizadas ----
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

// ---- Header del perfil (se usa como ListHeaderComponent) ----
function ProfileHeader({
  userRow,
  profilePic,
  pets,
  onPressFollow,
  onPressMessage,
  isFollowing,
  togglingFollow,
  isMyProfile, // ✅ nuevo
}) {
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
            source={{ uri: profilePic || FALLBACK_PROFILE }}
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

      {/* Nombre + Bio */}
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

      {/* ✅ Acciones: ocultar si es mi perfil */}
      {!isMyProfile ? (
        <View className="mt-3 flex-row justify-center items-center gap-x-3">
          <Pressable
            onPress={onPressFollow}
            disabled={togglingFollow}
            className={`py-[8px] px-7 rounded-full my-2 ${
              isFollowing ? "bg-gray-500" : "bg-[#FE9B5C]"
            }`}
          >
            <Text className="text-white text-base font-semibold">
              {togglingFollow ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
            </Text>
          </Pressable>

          <Pressable
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
          </Pressable>
        </View>
      ) : null}

      {/* Sección Mascotas */}
      <View className="flex-row items-center justify-between px-4 mt-2 mb-1">
        <Text className="text-lg font-semibold text-gray-700">
          Mis Mascotas
        </Text>
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

export default function Profile() {
  const router = useRouter();

  const { index } = useLocalSearchParams();
  const routeUserId = Array.isArray(index) ? index[0] : index;

  const { isLoaded, isSignedIn, user } = useUser();

  // follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  // estado data
  const [userRow, setUserRow] = useState(null);
  const [pets, setPets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ mi user.id interno cacheado
  const [myInternalId, setMyInternalId] = useState(null);

  const isMyProfile =
    myInternalId && routeUserId && String(myInternalId) === String(routeUserId);

  // helper: obtener mi user.id interno
  const getMyInternalUserId = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return null;

    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    if (error || !data?.id) {
      console.error("No se pudo obtener mi user.id interno:", error?.message);
      return null;
    }

    return String(data.id);
  }, [isLoaded, isSignedIn, user?.id]);

  // cargar si ya lo sigo
  const fetchFollowState = useCallback(async () => {
    if (!routeUserId) return;

    const myId = myInternalId ?? (await getMyInternalUserId());
    if (!myId) return;

    // no auto-follow
    if (String(myId) === String(routeUserId)) {
      setIsFollowing(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", myId)
      .eq("following_id", String(routeUserId))
      .maybeSingle();

    if (error) {
      console.error("Error fetchFollowState:", error.message);
      return;
    }

    setIsFollowing(!!data);
  }, [routeUserId, myInternalId, getMyInternalUserId]);

  // toggle follow/unfollow
  const toggleFollow = useCallback(async () => {
    if (!routeUserId) return;

    const myId = myInternalId ?? (await getMyInternalUserId());
    if (!myId) return;

    const targetId = String(routeUserId);

    // no auto-follow
    if (String(myId) === String(targetId)) return;

    if (togglingFollow) return;
    setTogglingFollow(true);

    try {
      const { data: existing, error: exErr } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("follower_id", myId)
        .eq("following_id", targetId)
        .maybeSingle();

      if (exErr) {
        console.error("Error check follow:", exErr.message);
        return;
      }

      const already = !!existing;

      if (already) {
        // UNFOLLOW
        const { error: delErr } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", myId)
          .eq("following_id", targetId);

        if (delErr) {
          console.error("Error unfollow:", delErr.message);
          return;
        }

        const newFollowers = Math.max(0, (userRow?.followers ?? 0) - 1);

        const { error: updErr } = await supabase
          .from("user")
          .update({ followers: newFollowers })
          .eq("id", targetId);

        if (updErr) {
          console.error("Error update followers:", updErr.message);
          return;
        }

        setIsFollowing(false);
        setUserRow((prev) => ({ ...prev, followers: newFollowers }));
      } else {
        // FOLLOW
        const { error: insErr } = await supabase
          .from("user_follows")
          .insert([{ follower_id: myId, following_id: targetId }]);

        if (insErr) {
          console.error("Error follow:", insErr.message);
          return;
        }

        const newFollowers = (userRow?.followers ?? 0) + 1;

        const { error: updErr } = await supabase
          .from("user")
          .update({ followers: newFollowers })
          .eq("id", targetId);

        if (updErr) {
          console.error("Error update followers:", updErr.message);
          return;
        }

        setIsFollowing(true);
        setUserRow((prev) => ({ ...prev, followers: newFollowers }));
      }
    } finally {
      setTogglingFollow(false);
    }
  }, [
    routeUserId,
    myInternalId,
    getMyInternalUserId,
    togglingFollow,
    userRow?.followers,
  ]);

  // DM chat
  const openDmChat = useCallback(async () => {
    try {
      if (!isLoaded || !isSignedIn || !user?.id) return;
      if (!routeUserId) return;

      const myId = myInternalId ?? (await getMyInternalUserId());
      if (!myId) return;

      // ✅ no DM contigo mismo
      if (String(myId) === String(routeUserId)) return;

      // 1) Buscar chat DM existente entre ambos
      const { data: dmChats, error: dmError } = await supabase
        .from("chats")
        .select("id, chat_members(user_id)")
        .eq("type", "dm");

      if (dmError) {
        console.error("Error buscando chats:", dmError.message);
        return;
      }

      let chatId = null;
      for (const chat of dmChats || []) {
        const members = (chat.chat_members || []).map((m) => String(m.user_id));
        if (
          members.includes(String(myId)) &&
          members.includes(String(routeUserId))
        ) {
          chatId = chat.id;
          break;
        }
      }

      // 2) Crear si no existe
      if (!chatId) {
        const { data: newChat, error: createError } = await supabase
          .from("chats")
          .insert({ type: "dm", created_by: myId })
          .select("id")
          .maybeSingle();

        if (createError || !newChat?.id) {
          console.error("Error creando chat:", createError?.message);
          return;
        }

        chatId = newChat.id;

        const { error: membersError } = await supabase
          .from("chat_members")
          .insert([
            { chat_id: chatId, user_id: myId, role: "owner" },
            { chat_id: chatId, user_id: String(routeUserId), role: "member" },
          ]);

        if (membersError) {
          console.error("Error creando miembros:", membersError.message);
          return;
        }
      }

      router.push({
        pathname: "chatDetail/[id]",
        params: { userId: String(chatId) },
      });
    } catch (e) {
      console.error("openDmChat error:", e);
    }
  }, [
    isLoaded,
    isSignedIn,
    user?.id,
    routeUserId,
    router,
    myInternalId,
    getMyInternalUserId,
  ]);

  // fetchers
  const fetchUserById = useCallback(async () => {
    if (!routeUserId) return;

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", String(routeUserId))
      .single();

    if (!error) {
      setUserRow(data);
      setProfilePic(data?.profile_pic ?? null);
    }
  }, [routeUserId]);

  const fetchPets = useCallback(async () => {
    if (!routeUserId) return;

    const { data, error } = await supabase
      .from("pet")
      .select("*, media_pet(*)")
      .eq("user_id", String(routeUserId))
      .order("created_at", { ascending: false });

    if (!error) setPets(data || []);
  }, [routeUserId]);

  const fetchPosts = useCallback(async () => {
    if (!routeUserId) return;

    const { data, error } = await supabase
      .from("post")
      .select("*, media_post(*)")
      .eq("user_id", String(routeUserId))
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
  }, [routeUserId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const myId = await getMyInternalUserId();
      setMyInternalId(myId);

      await fetchUserById();
      await Promise.all([fetchPets(), fetchPosts()]);

      // ✅ solo consultar follow si no es mi perfil
      if (myId && String(myId) !== String(routeUserId)) {
        await fetchFollowState();
      } else {
        setIsFollowing(false);
      }
    } finally {
      setLoading(false);
    }
  }, [
    getMyInternalUserId,
    fetchUserById,
    fetchPets,
    fetchPosts,
    fetchFollowState,
    routeUserId,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const myId = myInternalId ?? (await getMyInternalUserId());
      if (!myInternalId) setMyInternalId(myId);

      await fetchUserById();
      await Promise.all([fetchPets(), fetchPosts()]);

      if (myId && String(myId) !== String(routeUserId)) {
        await fetchFollowState();
      } else {
        setIsFollowing(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    myInternalId,
    getMyInternalUserId,
    fetchUserById,
    fetchPets,
    fetchPosts,
    fetchFollowState,
    routeUserId,
  ]);

  // perf helpers
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
        onPressFollow={toggleFollow}
        onPressMessage={openDmChat}
        isFollowing={isFollowing}
        togglingFollow={togglingFollow}
        isMyProfile={!!isMyProfile} // ✅ aquí
      />
    );
  }, [
    userRow,
    profilePic,
    pets,
    toggleFollow,
    openDmChat,
    isFollowing,
    togglingFollow,
    isMyProfile,
  ]);

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
          headerLeft: () => (
            <View className="mt-4">
              <Pressable onPress={() => router.back()}>
                <ArrowLeft size={34} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <FlatList
        data={posts}
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
