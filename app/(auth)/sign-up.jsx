import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Mail, EyeSlash, Phone, User } from "../../components/Icon";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);

  // Guardar usuario en Supabase (con clerk_id)
  const saveUserToSupabase = async (clerkId, email, username) => {
    console.log("Voy a guardar en Supabase:", { clerkId, email, username });
    const { error } = await supabase.from("user").upsert([
      {
        clerk_id: clerkId,
        email,
        username,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      Alert.alert("Error", "No se pudo guardar el usuario en Supabase");
      console.error("Supabase error:", error);
    }
  };

  // Registro inicial con Clerk
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    try {
      await signUp.create({ emailAddress: email, username, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      Alert.alert("Error", err.errors?.[0]?.message || "Error al registrarse");
    }
  };

  // Verificar el código de email
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // OBTIENE EL CLERK ID SEGURO Y GUARDA EN SUPABASE
        const clerkId = signUp.user?.id || result?.createdUserId || "";
        console.log(
          "Clerk ID obtenido:",
          clerkId,
          "signUp.user:",
          signUp.user,
          "result:",
          result
        );

        if (!clerkId) {
          Alert.alert(
            "Error",
            "No se pudo obtener el ID del usuario de Clerk."
          );
          return;
        }
        await saveUserToSupabase(clerkId, email, username);
        router.replace("/");
      } else {
        Alert.alert("Info", "Completa todos los pasos del registro");
      }
    } catch (err) {
      Alert.alert("Error", err.errors?.[0]?.message || "Error de verificación");
    }
  };

  if (pendingVerification) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Verifica tu email</Text>
        <TextInput
          value={code}
          placeholder="Código de verificación"
          onChangeText={setCode}
          keyboardType="number-pad"
          style={{ borderWidth: 1, marginBottom: 16 }}
        />
        <TouchableOpacity onPress={onVerifyPress}>
          <Text>Verificar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Image
        source={require("../../assets/FondoLogin.png")}
        className="absolute top-0 left-0 w-full h-64"
        resizeMode="cover"
      />

      <Image
        source={require("../../assets/Logo.png")}
        className="absolute top-12 left-1/2 -translate-x-1/2 w-40 h-36"
        resizeMode="cover"
      />

      <View className="flex-1 p-5 pt-64">
        <View className="items-center justify-center">
          <Text className="text-4xl font-semibold mb-1 text-gray-600">
            Get Started
          </Text>
          <Text className="text-base font-normal mb-10 text-gray-600">
            By creating a free account
          </Text>
        </View>

        {/* <Text style={{ fontSize: 24, marginBottom: 12 }}>Registrarse</Text> */}
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <User color="black" size={20} />
          <TextInput
            placeholder="Full Name"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="flex-1"
          />
        </View>
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <Mail color="black" size={20} />
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="flex-1"
          />
        </View>
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <Phone color="black" size={20} />
          <TextInput
            placeholder="Phone Number"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="flex-1"
          />
        </View>
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <User color="black" size={20} />
          <TextInput
            placeholder="Username"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="flex-1"
          />
        </View>
        {/* <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      /> */}
        {/* <TextInput
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      /> */}
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
        {/* <TextInput
        placeholder="Contraseña"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      /> */}
        {/* <TouchableOpacity onPress={onSignUpPress}>
        <Text>Registrarse</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <Text>¿Ya tienes cuenta? </Text>
        <Link href="/sign-in">
          <Text style={{ color: "blue" }}>Inicia sesión</Text>
        </Link>
      </View> */}

        <View className="flex-row items-center justify-center my-4">
          <TouchableOpacity onPress={() => setChecked(!checked)}>
            {/* Cuadro del checkbox */}
            <View
              className={`w-5 h-5 border-2 rounded mr-2 ${
                checked
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-gray-400"
              } items-center justify-center`}
            >
              {checked && <Text className="text-white text-xs">✓</Text>}
            </View>

            {/* Texto */}
          </TouchableOpacity>
          <Text className="text-base text-gray-700">
            By checking the box you agree to our
          </Text>
          <Text className="text-base text-[#FE9B5C]">Terms </Text>
          <Text className="text-base text-gray-700">and </Text>
          <Text className="text-base text-[#FE9B5C]">Conditions</Text>
        </View>

        {/* <TouchableOpacity
          className="bg-[#FE9B5C] p-3 rounded-2xl items-center"
          onPress={onSignUpPress}
        >
          <Text className="text-white font-semibold">Registrate</Text>
        </TouchableOpacity>

        <View className="flex-row mt-4 justify-center gap-x-2">
          <Text>¿Ya tienes cuenta? </Text>
          <Link href="/sign-in">
            <Text className="text-[#FE9B5C]">Login</Text>
          </Link>
        </View> */}

        <View className="absolute bottom-20 left-0 right-0 p-5 bg-white">
          <TouchableOpacity
            className="bg-[#FE9B5C] p-3 rounded-2xl items-center"
            onPress={onSignUpPress}
          >
            <Text className="text-white font-semibold">Registrate</Text>
          </TouchableOpacity>

          <View className="flex-row mt-4 justify-center gap-x-2">
            <Text>¿Ya tienes cuenta? </Text>
            <Link href="/sign-in">
              <Text className="text-[#FE9B5C]">Login</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
