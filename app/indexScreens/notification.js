import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { NotificationIcon } from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

export default function Notification() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const [supaUserId, setSupaUserId] = useState(null);

  // 1) Obtener tu usuario de Supabase por clerk_id (igual que en Main)
  const fetchSupaUserId = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    const clerkId = user.id;
    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();
    if (error) {
      console.error("❌ No se pudo obtener supaUser.id:", error.message);
      return;
    }
    setSupaUserId(data?.id || null);
  }, [isLoaded, isSignedIn, user?.id]);

  // 2) Traer notificaciones para ese supaUserId (destinatario)
  const fetchNotifications = useCallback(async () => {
    if (!supaUserId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notification")
      .select(
        `
        id,
        user_id,
        post_id,
        notification_type,
        message,
        is_read,
        created_at,
        post (
          id,
          description,
          created_at,
          media_post ( source, type ),
          pet ( id, name, description, location, logo, media_pet ( source, type ) )
        ),
        user ( id, username, profile_pic )
      `
      )
      .eq("user_id", supaUserId) // 👈 filtra por destinatario correcto
      .order("is_read", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("❌ Error fetching notifications:", error.message);
      setNotifications([]);
    } else {
      setNotifications(data ?? []);
    }
    setLoading(false);
  }, [supaUserId]);

  // Carga supaUserId y notifs
  useEffect(() => {
    fetchSupaUserId();
  }, [fetchSupaUserId]);
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Re-fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleOpenNotification = async (item) => {
    // Optimista: marcar como leída
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );

    const { error } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("id", item.id);

    if (error) {
      console.error("❌ No se pudo marcar como leída:", error.message);
      // rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: false } : n))
      );
      return;
    }

    // Navega a la pantalla de comentarios del post
    const p = item.post;
    router.push({
      pathname: "/indexScreens/comment",
      params: {
        index: p?.id,
      },
    });
  };

  const renderItem = ({ item }) => {
    const avatar = item.user?.profile_pic || "https://placehold.co/96x96";
    const thumb =
      item.post?.media_post?.[0]?.source ||
      item.post?.pet?.media_pet?.[0]?.source;

    return (
      <Pressable
        onPress={() => handleOpenNotification(item)}
        className={`flex-row items-center gap-3 mb-4 px-2 py-3 rounded-xl ${
          item.is_read ? "bg-white" : "bg-gray-50"
        }`}
      >
        <View className="relative">
          <Image source={{ uri: avatar }} className="w-12 h-12 rounded-full" />
          {!item.is_read && (
            <View className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-gray-800 font-semibold" numberOfLines={1}>
            {item.user?.username || "Usuario"}
          </Text>
          <Text className="text-gray-600" numberOfLines={2}>
            {item.message}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        {thumb ? (
          <Image source={{ uri: thumb }} className="w-12 h-12 rounded-lg" />
        ) : (
          <View className="w-12 h-12 rounded-lg bg-gray-200" />
        )}
      </Pressable>
    );
  };

  const empty = notifications.length === 0;

  return (
    <View className="bg-white flex-1 p-4">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Notificaciones",
        }}
      />

      {empty ? (
        <View className="flex-1 justify-center items-center">
          <View className="m-4">
            <NotificationIcon className="text-gray-600" />
          </View>
          <Text className="font-medium text-gray-800 text-lg">
            Aún no hay notificaciones
          </Text>
          <Text className="font-medium text-sm text-gray-500">
            No tienes notificaciones por el momento
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
            />
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}
