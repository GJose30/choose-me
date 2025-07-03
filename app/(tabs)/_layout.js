import { Tabs, Link } from "expo-router";
import { useState, useMemo } from "react";
import {
  Home,
  Paw,
  SearchIcon,
  Menu,
  MessageIcon,
  NotificationIcon,
  Plus,
} from "../../components/Icon";
import { View, Image, Pressable } from "react-native";
import "../../global.css";
import { SideBarModal } from "../../components/Index/SideBarModal";

export default function TabsLayout() {
  const [sideBarModarVisible, setSideBarModarVisible] = useState(false);
  // const headerLeft = useMemo(() => () => <DrawerButton />, []);
  const DrawerButton = () => {
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
          backgroundColor: "#FF8B41",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          height: 50,
        },
        tabBarItemStyle: {
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "",
          title: "",
          headerStyle: { backgroundColor: "white", height: 50 },
          headerLeft: () => <DrawerButton />,
          // headerLeft,
          headerRight: () => (
            <View className="flex-row gap-5 justify-center items-center mr-4">
              <Link
                href={{
                  pathname: "/indexScreens/notification",
                }}
                asChild
              >
                <Pressable>
                  <NotificationIcon color={"#374151"} size={24} />
                </Pressable>
              </Link>
              <Link
                href={{
                  pathname: "/indexScreens/search",
                }}
                asChild
              >
                <Pressable>
                  <SearchIcon color={"#374151"} size={24} />
                </Pressable>
              </Link>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 4,
                height: 38,
                width: 38,
              }}
            >
              <Home color={"white"} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="adoption"
        options={{
          // headerTitle: "",
          // title: "",
          // headerStyle: { backgroundColor: "#FE9B5C" },
          // tabBarIcon: ({ color }) => (
          //   <View
          //     style={{
          //       alignItems: "center",
          //       justifyContent: "center",
          //       top: 4,
          //       height: 38,
          //       width: 38,
          //     }}
          //   >
          //     <Paw color={"white"} size={24} />
          //   </View>
          // ),
          // headerTitle: "Adopcion",
          headerTitle: "",
          title: "",
          // headerStyle: { backgroundColor: "white", height: 50 },
          // headerLeft: () => <View></View>,
          // headerLeft,
          // headerRight: () => (
          //   <View className="flex-row gap-5 justify-center items-center mr-4">
          //     {/* <Link
          //       href={{
          //         // pathname: "/indexScreens/notification",
          //       }}
          //       asChild
          //     > */}
          //     <Pressable>
          //       <Heart color={"#374151"} size={24} />
          //     </Pressable>
          //     {/* </Link> */}
          //     <Link
          //       href={{
          //         pathname: "/indexScreens/search",
          //       }}
          //       asChild
          //     >
          //       <Pressable>
          //         <SearchIcon color={"#374151"} size={24} />
          //       </Pressable>
          //     </Link>
          //   </View>
          // ),
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 4,
                height: 38,
                width: 38,
              }}
            >
              <Paw color={"white"} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          headerTitle: "",
          title: "",
          headerStyle: { backgroundColor: "#FE9B5C" },
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 4,
                height: 50,
                width: 50,
              }}
            >
              <Plus color={"white"} size={37} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerTitle: "",
          title: "",
          headerStyle: { backgroundColor: "#FE9B5C" },
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 4,
                height: 38,
                width: 38,
              }}
            >
              <MessageIcon color={"white"} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "",
          title: "",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 4,
                height: 38,
                width: 38,
              }}
            >
              <Image
                className="h-8 w-8 rounded-full"
                source={{
                  uri: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
