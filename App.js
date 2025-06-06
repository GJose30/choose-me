import "react-native-url-polyfill/auto";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { Main } from "./components/Main";
import "react-native-gesture-handler";

export default function App() {
  return (
    <View>
      <StatusBar style="auto" />
      <Main />
    </View>
  );
}
