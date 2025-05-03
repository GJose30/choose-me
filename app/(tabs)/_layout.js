import { Tabs, Link } from "expo-router";
import React, { useState } from "react";
import {
  Home,
  Paw,
  SearchIcon,
  Menu,
  Message,
  Heart,
} from "../../components/Icon";
import { View, Image, Pressable } from "react-native";
// import { useNavigation } from "@react-navigation/native";
import "../../global.css";
import { SideBarModal } from "../../components/Index/SideBarModal";

export default function TabsLayout() {
  const [sideBarModarVisible, setSideBarModarVisible] = useState(false);
  const DrawerButton = () => {
    // const navigation = useNavigation();
    return (
      <View>
        <Pressable
          onPress={() => setSideBarModarVisible(true)}
          style={{ marginLeft: 16 }}
        >
          <Menu color={"#374151"} size={24} />
        </Pressable>
        <SideBarModal
          visible={sideBarModarVisible}
          onClose={() => setSideBarModarVisible(false)}
        />
      </View>
    );
  };
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: "#FE9B5C",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          height: 50,
        },
        tabBarItemStyle: {
          height: 60,
          // paddingVertical: 5,
        },
        tabBarLabelStyle: {
          // top: 3,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "",
          title: "Inicio",
          headerStyle: { backgroundColor: "white", height: 50 },
          headerLeft: () => <DrawerButton />,
          headerRight: () => (
            <View className="flex-row gap-5 justify-center items-center">
              <Link
                href={{
                  pathname: "/indexScreens/notification",
                }}
                asChild
              >
                <Pressable>
                  <Heart color={"#374151"} size={24} />
                </Pressable>
              </Link>
              <Link
                href={{
                  pathname: "/indexScreens/message/chatList",
                }}
                asChild
              >
                <Pressable>
                  <Message color={"#374151"} size={24} />
                </Pressable>
              </Link>
              <Link
                href={{
                  pathname: "/indexScreens/profile",
                }}
                asChild
              >
                <Pressable>
                  <Image
                    className="h-8 w-8 rounded-full mr-4"
                    source={{
                      uri: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
                    }}
                  />
                </Pressable>
              </Link>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                // top: 3,
                height: 38,
                width: 38,
              }}
            >
              <Home color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="adoption"
        options={{
          headerTitle: "Adopcion",
          title: "Adopcion",
          headerStyle: { backgroundColor: "#FE9B5C" },
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                // top: 3,
                height: 38,
                width: 38,
              }}
            >
              <Paw color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerTitle: "Buscar",
          title: "Buscar",
          headerStyle: { backgroundColor: "#FE9B5C" },
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                // top: 3,
                height: 38,
                width: 38,
              }}
            >
              <SearchIcon color={color} size={24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
