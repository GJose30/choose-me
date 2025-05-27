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
