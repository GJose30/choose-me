import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Main } from "./components/Main";
import "react-native-gesture-handler";

export default function App() {
  return (
    <SafeAreaProvider>
      <View>
        <StatusBar style="auto" />
        <Main />
      </View>
    </SafeAreaProvider>
  );
}
