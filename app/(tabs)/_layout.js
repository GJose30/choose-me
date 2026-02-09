import { Tabs, Link, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Image, Pressable, Text } from "react-native";
import {
  Home,
  Paw,
  SearchIcon,
  Menu,
  MessageIcon,
  NotificationIcon,
  Plus,
  Dots,
} from "../../components/Icon";
import "../../global.css";
import { SideBarModal } from "../../components/Index/SideBarModal";
import { ChatModal } from "../../components/Index/ChatModal";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";

const FALLBACK_PROFILE_PIC =
  "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg";

export default function TabsLayout() {
  const [sideBarModarVisible, setSideBarModarVisible] = useState(false);
  const [chatOptionsVisible, setChatOptionsVisible] = useState(false);

  // --- badge state ---
  const [supaUserId, setSupaUserId] = useState(null);
  const [notifCount, setNotifCount] = useState(0);

  // ✅ profile pic state
  const [profilePic, setProfilePic] = useState(null);

  const { isLoaded, isSignedIn, user } = useUser();

  // 1) Resolver usuario de Supabase por clerk_id (id + profile_pic)
  const fetchSupaUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const { data, error } = await supabase
      .from("user")
      .select("id, profile_pic")
      .eq("clerk_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetchSupaUser:", error.message);
      return;
    }

    if (data?.id) setSupaUserId(String(data.id));
    setProfilePic(data?.profile_pic || null);
  }, [isLoaded, isSignedIn, user?.id]);

  // 2) Contar notificaciones no leídas
  const fetchNotifCount = useCallback(async () => {
    if (!supaUserId) return;

    const { count, error } = await supabase
      .from("notification")
      .select("id", { count: "exact", head: true })
      .eq("user_id", supaUserId)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetchNotifCount:", error.message);
      return;
    }

    if (typeof count === "number") setNotifCount(count);
  }, [supaUserId]);

  useEffect(() => {
    fetchSupaUser();
  }, [fetchSupaUser]);

  // ✅ refrescar profile pic cuando vuelves a tabs (por si lo cambió en profile)
  useFocusEffect(
    useCallback(() => {
      fetchSupaUser();
      fetchNotifCount();
    }, [fetchSupaUser, fetchNotifCount]),
  );

  // 3) Suscripción en tiempo real a notification
  useEffect(() => {
    if (!supaUserId) return;

    fetchNotifCount();

    const channel = supabase
      .channel("notification-badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification",
          filter: `user_id=eq.${supaUserId}`,
        },
        () => fetchNotifCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supaUserId, fetchNotifCount]);

  const DrawerButton = () => (
    <View>
      <Pressable onPress={() => setSideBarModarVisible(true)} className="ml-4">
        <Menu color={"#374151"} size={24} />
      </Pressable>
      <SideBarModal
        visible={sideBarModarVisible}
        onClose={() => setSideBarModarVisible(false)}
      />
    </View>
  );

  const BellWithBadge = () => (
    <Link href={{ pathname: "/indexScreens/notification" }} asChild>
      <Pressable className="relative">
        <NotificationIcon color={"#374151"} size={24} />
        {notifCount > 0 && (
          <View className="absolute -top-1.5 -right-1.5 bg-red-500 h-4 min-w-[16px] rounded-full px-1 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {notifCount > 99 ? "99+" : notifCount}
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );

  const TabIconBox = ({ children }) => (
    <View className="items-center justify-center top-1 h-[38px] w-[38px]">
      {children}
    </View>
  );

  // ✅ uri final del tab profile
  const profileTabUri = useMemo(
    () => profilePic || FALLBACK_PROFILE_PIC,
    [profilePic],
  );

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: "#FF8B41",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          height: 50,
        },
        tabBarItemStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "",
          title: "",
          headerStyle: { backgroundColor: "white", height: 50 },
          headerLeft: () => <DrawerButton />,
          headerRight: () => (
            <View className="flex-row gap-5 items-center mr-4">
              <BellWithBadge />
              <Link href={{ pathname: "/indexScreens/search" }} asChild>
                <Pressable>
                  <SearchIcon color={"#374151"} size={24} />
                </Pressable>
              </Link>
            </View>
          ),
          tabBarIcon: () => (
            <TabIconBox>
              <Home color={"white"} size={24} />
            </TabIconBox>
          ),
        }}
      />

      <Tabs.Screen
        name="adoption"
        options={{
          headerTitle: "",
          title: "",
          tabBarIcon: () => (
            <TabIconBox>
              <Paw color={"white"} size={24} />
            </TabIconBox>
          ),
        }}
      />

      <Tabs.Screen
        name="post"
        options={{
          headerTitle: "",
          title: "",
          tabBarIcon: () => (
            <TabIconBox>
              <Plus color={"white"} size={34} />
            </TabIconBox>
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "",
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Mensajes",
          headerRight: () => (
            <>
              <View className="mr-4">
                <Pressable onPress={() => setChatOptionsVisible(true)}>
                  <Dots color={"#374151"} size={24} />
                </Pressable>
              </View>

              <ChatModal
                visible={chatOptionsVisible}
                onClose={() => setChatOptionsVisible(false)}
                onReport={() => console.log("🚨 Reportar chat")}
                onBlock={() => console.log("⛔ Bloquear usuario")}
              />
            </>
          ),
          tabBarIcon: () => (
            <TabIconBox>
              <MessageIcon color={"white"} size={24} />
            </TabIconBox>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "",
          title: "",
          tabBarIcon: () => (
            <TabIconBox>
              <Image
                className="h-8 w-8 rounded-full"
                source={{ uri: profileTabUri }}
              />
            </TabIconBox>
          ),
        }}
      />
    </Tabs>
  );
}
