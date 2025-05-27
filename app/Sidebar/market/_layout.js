import { Tabs } from "expo-router";
import { Home, Menu, MessageIcon } from "../../../components/Icon";
import { View, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import "../../../global.css";

const DrawerButton = () => {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.openDrawer()}
      style={{ marginLeft: 16 }}
    >
      <Menu color={"#374151"} size={34} />
    </Pressable>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: "#FE9B5C",
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          height: 70,
        },
        tabBarItemStyle: {
          height: 60,
          paddingVertical: 5,
        },
        tabBarLabelStyle: {
          top: 10,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "",
          title: "Inicio",
          headerStyle: { backgroundColor: "white" },
          headerLeft: () => <DrawerButton />,
          headerRight: () => (
            <View className="flex-row gap-6 justify-center items-center">
              <MessageIcon color={"#374151"} size={34} />
              <Image
                className="h-12 w-12 rounded-full mr-4"
                source={{
                  uri: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
                }}
              />
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                top: 3,
                height: 38,
                width: 38,
              }}
            >
              <Home color={color} size={34} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
