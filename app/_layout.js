import { Stack } from "expo-router";
import { NotificationProvider } from "../contexts/NotificationContext";

export default function Layout() {
  return (
    <NotificationProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
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
