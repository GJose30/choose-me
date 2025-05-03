import { Stack } from "expo-router";
import { NotificationProvider } from "../contexts/NotificationContext"; // ajusta la ruta si es necesario

export default function Layout() {
  return (
    <NotificationProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
  );
}

// import { Drawer } from "expo-router/drawer";
// import { Home, Newspaper, Calendar, Group } from "../components/Icon";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { CustomDrawerContent } from "../components/CustomDrawerContent";

// export default function _layout() {
//   return (
//     // <GestureHandlerRootView style={{ flex: 1 }}>
//     //   <Drawer>
//     //     <Drawer.Screen
//     //       name="(stack)/home"
//     //       options={{
//     //         drawerLabel: "Home",
//     //         headerShown: false, // el stack maneja el header
//     //       }}
//     //     />
//     //   </Drawer>
//     // </GestureHandlerRootView>
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Drawer
//         options={{
//           headerStyle: { backgroundColor: "#70EF34" },
//           headerLeft: () => {},
//           headerRight: () => {},
//         }}
//         // screenOptions={{
//         //   headerShown: false,
//         // }}
//         drawerContent={(props) => <CustomDrawerContent {...props} />}
//       >
//         <Drawer.Screen
//           name="index"
//           options={{
//             drawerItemStyle: { display: "none" },
//           }}
//         />
//         <Drawer.Screen
//           name="home"
//           screenOptions={{
//             headerShown: false,
//           }}
//           options={{
//             drawerLabel: "Home",
//             title: "Home",
//             headerShown: true,
//             drawerIcon: ({ size, color }) => <Home color={color} size={size} />,
//           }}
//         />
//         <Drawer.Screen
//           name="news"
//           options={{
//             drawerLabel: "Noticias",
//             title: "Noticias",
//             drawerIcon: ({ size, color }) => (
//               <Newspaper color={color} size={size} />
//             ),
//           }}
//         />
//         <Drawer.Screen
//           name="events"
//           options={{
//             drawerLabel: "Eventos",
//             title: "Eventos",
//             drawerIcon: ({ size, color }) => (
//               <Calendar color={color} size={size} />
//             ),
//           }}
//         />
//         <Drawer.Screen
//           name="groups"
//           options={{
//             drawerLabel: "Grupos",
//             title: "Grupos",
//             drawerIcon: ({ size, color }) => (
//               <Group color={color} size={size} />
//             ),
//           }}
//         />
//       </Drawer>
//     </GestureHandlerRootView>
//   );
// }
