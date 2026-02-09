import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Mail, EyeSlash, Phone, User } from "../../components/Icon";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [accountType, setAccountType] = useState("PERSON"); // PERSON | FOUNDATION
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);

  const saveUserToSupabase = async (
    clerkId,
    email,
    username,
    fullname,
    phoneNumber,
    accountType,
  ) => {
    const { error } = await supabase.from("user").upsert([
      {
        clerk_id: clerkId,
        email,
        username,
        fullname,
        followers: 0,
        following: 0,
        phone_number: phoneNumber,
        account_type: accountType,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      Alert.alert("Error", "No se pudo guardar el usuario en Supabase");
      console.error("Supabase error:", error);
      throw error;
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!checked) {
      Alert.alert("Atención", "Debes aceptar los términos y condiciones.");
      return;
    }

    if (!email || !username || !password) {
      Alert.alert("Atención", "Completa email, username y contraseña.");
      return;
    }

    try {
      await signUp.create({
        emailAddress: email,
        username,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err) {
      Alert.alert("Error", err?.errors?.[0]?.message || "Error al registrarse");
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        const clerkId = signUp.user?.id || result?.createdUserId || "";
        if (!clerkId) {
          Alert.alert(
            "Error",
            "No se pudo obtener el ID del usuario de Clerk.",
          );
          return;
        }

        await saveUserToSupabase(
          clerkId,
          email,
          username,
          fullname,
          phoneNumber,
          accountType,
        );

        router.replace("/(tabs)");
      } else {
        Alert.alert("Info", "Completa todos los pasos del registro.");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err?.errors?.[0]?.message || "Error de verificación",
      );
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-white p-5 justify-center">
        <Text className="text-2xl font-semibold mb-2 text-gray-700">
          Verifica tu email
        </Text>
        <Text className="text-gray-600 mb-4">
          Te enviamos un código. Escríbelo aquí para completar tu registro.
        </Text>

        <TextInput
          value={code}
          placeholder="Código de verificación"
          onChangeText={setCode}
          keyboardType="number-pad"
          className="border border-gray-300 rounded p-3 mb-4"
        />

        <TouchableOpacity
          onPress={onVerifyPress}
          className="bg-[#FE9B5C] p-3 rounded-2xl items-center"
        >
          <Text className="text-white font-semibold">Verificar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPendingVerification(false)}
          className="mt-4 items-center"
        >
          <Text className="text-gray-500">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Fondo */}
      <Image
        source={require("../../assets/FondoLogin.png")}
        className="w-full h-64"
        resizeMode="cover"
      />

      {/* Logo centrado */}
      <View className="-mt-40 items-center">
        <Image
          source={require("../../assets/Logo.png")}
          className="w-40 h-36"
          resizeMode="cover"
        />
      </View>

      {/* Contenido */}
      <View className="px-5 pt-6">
        <View className="items-center justify-center">
          <Text className="text-4xl font-semibold mb-1 text-gray-600">
            Get Started
          </Text>
          <Text className="text-base font-normal mb-6 text-gray-600">
            By creating a free account
          </Text>
        </View>

        {/* Selector Persona/Fundación */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => setAccountType("PERSON")}
            className={`flex-1 p-3 rounded-xl border ${
              accountType === "PERSON"
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                accountType === "PERSON" ? "text-white" : "text-gray-700"
              }`}
            >
              Persona
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAccountType("FOUNDATION")}
            className={`flex-1 p-3 rounded-xl border ${
              accountType === "FOUNDATION"
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                accountType === "FOUNDATION" ? "text-white" : "text-gray-700"
              }`}
            >
              Fundación
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <User color="black" size={20} />
          <TextInput
            placeholder="Full Name"
            autoCapitalize="words"
            value={fullname}
            onChangeText={setFullname}
            className="flex-1"
          />
        </View>

        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <Mail color="black" size={20} />
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
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
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className="flex-1"
          />
        </View>

        <View className="flex-row items-center border border-gray-300 mb-3 p-2 rounded gap-2">
          <User color="black" size={20} />
          <TextInput
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            className="flex-1"
          />
        </View>

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

        {/* Terms */}
        <View className="flex-row items-center my-4 flex-wrap">
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

          <Text className="text-base text-gray-700">
            By checking the box you agree to our{" "}
          </Text>

          <TouchableOpacity onPress={() => Alert.alert("Terms", "Abrir Terms")}>
            <Text className="text-base text-[#FE9B5C]">Terms </Text>
          </TouchableOpacity>

          <Text className="text-base text-gray-700">and </Text>

          <TouchableOpacity
            onPress={() => Alert.alert("Conditions", "Abrir Conditions")}
          >
            <Text className="text-base text-[#FE9B5C]">Conditions</Text>
          </TouchableOpacity>
        </View>

        {/* Botón */}
        <TouchableOpacity
          className="bg-[#FE9B5C] p-3 rounded-2xl items-center mt-2"
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
    </ScrollView>
  );
}
