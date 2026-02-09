import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useSignIn, useClerk } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { Mail, EyeSlash } from "../../components/Icon";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();

  const [identifier, setIdentifier] = useState(""); // username o email
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      // Limpia sesión previa si existía
      await signOut();
    } catch (e) {}

    try {
      const result = await signIn.create({
        identifier,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // ✅ IMPORTANTE: manda al "router guard"
        router.replace("/(tabs)");
      } else {
        Alert.alert("Atención", "Debes completar el proceso de login.");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err?.errors?.[0]?.message || "Error al iniciar sesión",
      );
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Fondo */}
      <Image
        source={require("../../assets/FondoLogin.png")}
        className="absolute top-0 left-0 w-full h-64"
        resizeMode="cover"
      />

      {/* Logo */}
      <Image
        source={require("../../assets/Logo.png")}
        className="absolute top-12 left-1/2 -translate-x-1/2 w-40 h-36"
        resizeMode="cover"
      />

      <View className="flex-1 p-5 pt-64">
        <View className="items-center justify-center">
          <Text className="text-4xl font-semibold mb-1 text-gray-600">
            WELCOME
          </Text>
          <Text className="text-base font-normal mb-10 text-gray-600">
            Sign in to accesss your account
          </Text>
        </View>

        {/* Email/Username */}
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <Mail color="black" size={20} />
          <TextInput
            placeholder="Email o username"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
            className="flex-1"
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <EyeSlash color="black" size={20} />
          <TextInput
            placeholder="Contraseña"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            className="flex-1"
          />
        </View>

        {/* Remember + Forgot */}
        <View className="flex-row items-center my-4">
          <TouchableOpacity onPress={() => setChecked(!checked)}>
            <View
              className={`w-5 h-5 border-2 rounded mr-2 ${
                checked
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-gray-400"
              } items-center justify-center`}
            >
              {checked && <Text className="text-white text-xs">✓</Text>}
            </View>
          </TouchableOpacity>

          <Text className="text-base text-gray-700">Recordarme</Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Info", "Aquí puedes implementar 'Forgot password'.")
            }
            className="ml-auto"
          >
            <Text className="text-base text-red-500">Forget password?</Text>
          </TouchableOpacity>
        </View>

        {/* Socials */}
        <View className="flex-row items-center justify-center my-4 gap-4">
          <View className="h-1 w-20 bg-gray-400 my-4" />
          <Text className="text-base text-gray-700">or sign in with</Text>
          <View className="h-1 w-20 bg-gray-400 my-4" />
        </View>

        <View className="flex-row justify-center gap-x-10 mb-20">
          <Image
            source={require("../../assets/SocialsLogos/GoogleLogo.png")}
            className="w-10 h-10"
          />
          <Image
            source={require("../../assets/SocialsLogos/FacebookLogo.png")}
            className="w-10 h-10"
          />
          <Image
            source={require("../../assets/SocialsLogos/XLogo.png")}
            className="w-10 h-10"
          />
        </View>

        {/* Bottom */}
        <View className="absolute bottom-20 left-0 right-0 p-5 bg-white">
          <TouchableOpacity
            className="bg-[#FE9B5C] p-3 rounded-2xl items-center"
            onPress={onSignInPress}
          >
            <Text className="text-white font-semibold">Iniciar sesión</Text>
          </TouchableOpacity>

          <View className="flex-row mt-4 justify-center gap-x-2">
            <Text className="text-gray-600">Dont have an account</Text>
            <Link href="/sign-up">
              <Text className="text-[#FE9B5C]">Sign up</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
