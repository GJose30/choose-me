// import { useNotifications } from "../../contexts/NotificationContext";
import { useState, useEffect } from "react";
import { View, Text, FlatList, Image } from "react-native";
import { Stack } from "expo-router";
import { NotificationIcon } from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";
import { useSupabaseUserProfile } from "../../components/HooksCustoms/useSupabaseUserProfile";

export default function Notification() {
  // const { notifications } = useNotifications();
  const [notification, setNotification] = useState([]);
  const { isLoaded, isSignedIn, user } = useUser();
  const { profile, loading, error } = useSupabaseUserProfile();

  const fetchNotification = async () => {
    const { data, error } = await supabase.from("notification").select(
      `
          *,
            user (
              *
            ),
            post (
              *,
              media_post (
                *
              )
            )
        `
    );
    // .eq("clerk_id", user.id); // Clerk ID;

    if (error) {
      console.error("Error fetching posts:", error.message);
    } else {
      setNotification(data);
    }
  };

  // useEffect(() => {
  //   fetchNotification();
  //   console.log(notification[0].user);
  // }, [notification[0].user]);

  useEffect(() => {
    fetchNotification();
  }, []);

  useEffect(() => {
    // if (notification.length > 0 && notification[0].user.username) {
    //   console.log(notification[0].post.media[0].source);
    // }
    console.log(notification[2]?.post.media_post[0]?.source);
  }, []); // Escucha cambios en todo el array

  return (
    <View className="bg-white flex-1 p-4">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Notificaciones",
        }}
      />
      {notification.length === 0 ? (
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
          data={notification}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 mb-4">
              <Image
                source={{ uri: profile?.profile_pic }}
                className="w-12 h-12 rounded-full"
              />
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">
                  {/* {item[0].user.name} */}
                  {item.user.username}
                </Text>
                <Text className="text-gray-600">{item.message}</Text>
                <Text className="text-gray-400 text-xs">
                  {/* {new Date(item.fecha).toLocaleString()} */}
                  {item.created_at}
                </Text>
              </View>
              <Image
                source={{ uri: item.post?.media_post?.[0]?.source }}
                // notification[0]?.post.media_post[0]?.source
                className="w-12 h-12 rounded-lg"
              />
            </View>
          )}
        />
      )}
    </View>
  );
}
