import { Stack } from "expo-router";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ClerkProvider } from '@clerk/clerk-expo'; // Importa Clerk
import Constants from "expo-constants";
import InitialLayout from "../components/InitialLayout"

export default function Layout() {
  return (
    <ClerkProvider publishableKey={Constants.expoConfig?.extra?.clerkPublishableKey}>
      <NotificationProvider>
      <InitialLayout />
      </NotificationProvider>
    </ClerkProvider>
  );
}
// import { Stack, useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";
// import { NotificationProvider } from "../contexts/NotificationContext";
// import { ActivityIndicator, View } from "react-native";

// export default function Layout() {
//   const router = useRouter();
//   const [checkingSession, setCheckingSession] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (session) {
//         router.replace("/"); // <- Redirige al home
//       } else {
//         setCheckingSession(false); // <- continúa con el login
//       }
//     };

//     checkAuth();
//   }, []);

//   if (checkingSession) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <NotificationProvider>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//       </Stack>
//     </NotificationProvider>
//   );
// }
