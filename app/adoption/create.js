import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";

function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-[#FE9B5C] border-[#FE9B5C]" : "bg-white border-gray-200"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CreateAdoptionScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const [userRow, setUserRow] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);

  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(null);

  const isFoundation =
    String(userRow?.account_type || "").toUpperCase() === "FOUNDATION";

  const fetchUserRow = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error("fetchUserRow:", error.message);
      setFatalError("No se pudo cargar tu perfil.");
      setLoading(false);
      return;
    }

    setUserRow(data);
    setFatalError(null);
    setLoading(false);
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchPets = useCallback(
    async (row) => {
      if (!row?.id) return;

      const { data, error } = await supabase
        .from("pet")
        .select("id,name,description") // traemos lo básico
        .eq("user_id", row.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("fetchPets:", error.message);
        setFatalError("No se pudieron cargar tus mascotas.");
        return;
      }

      setPets(data || []);
      if (!selectedPetId && (data || []).length > 0) {
        setSelectedPetId(data[0].id);
        // opcional: prefillear descripción desde la mascota
        setDescription(data[0]?.description || "");
      }
    },
    [selectedPetId],
  );

  useEffect(() => {
    fetchUserRow();
  }, [fetchUserRow]);

  useEffect(() => {
    if (!userRow?.id) return;
    fetchPets(userRow);
  }, [userRow?.id]);

  const canSubmit = useMemo(() => {
    return (
      !!selectedPetId &&
      description.trim().length >= 10 &&
      locationText.trim().length >= 2
    );
  }, [selectedPetId, description, locationText]);

  const onSubmit = useCallback(async () => {
    if (!userRow?.id) return;

    if (!selectedPetId) {
      Alert.alert("Atención", "Selecciona una mascota.");
      return;
    }

    if (!canSubmit) {
      Alert.alert(
        "Atención",
        "Completa descripción (mínimo 10 caracteres) y ubicación.",
      );
      return;
    }

    const petSelected = pets.find((p) => p.id === selectedPetId);

    setSubmitting(true);

    // ✅ Guardamos en adoption_pet usando tu esquema
    const payload = {
      user_id: userRow.id, // dueño (fundación/persona)
      pet_id: selectedPetId, // referencia a pet real (FK)
      name: petSelected?.name ?? null, // se usa para mostrar en adopción
      description: description.trim() || null,
      location: locationText.trim() || null,
      birthdate: petSelected?.birthdate ?? null,
      likes: 0,
      // created_at lo pone la DB
      // id lo pone la DB
    };

    const { error } = await supabase
      .from("adoption_pet")
      .upsert(payload, { onConflict: "pet_id" }); // ✅ evita duplicados

    setSubmitting(false);

    if (error) {
      console.error("adoption_pet upsert error:", error.message);
      Alert.alert("Error", "No se pudo publicar la adopción.");
      return;
    }

    Alert.alert("Listo", "Tu publicación ya está en adopción.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }, [
    userRow?.id,
    selectedPetId,
    canSubmit,
    pets,
    description,
    locationText,
    router,
  ]);

  if (!isLoaded || !isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (loading || !userRow) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (fatalError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-700 font-semibold text-lg text-center">
          Ocurrió un error
        </Text>
        <Text className="text-gray-500 text-center mt-2">{fatalError}</Text>

        <Pressable
          className="mt-5 bg-[#FE9B5C] px-5 py-3 rounded-full"
          onPress={() => {
            setFatalError(null);
            fetchUserRow();
          }}
        >
          <Text className="text-white font-semibold">Reintentar</Text>
        </Pressable>

        <Pressable
          className="mt-3 bg-gray-100 px-5 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-gray-700 font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle: isFoundation
            ? "Publicar adopción"
            : "Publicar en adopción",
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mascota */}
        <Text className="text-base font-semibold text-gray-800 mb-2">
          Selecciona la mascota
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-4">
          {pets.length === 0 ? (
            <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 w-full">
              <Text className="text-gray-600">
                No tienes mascotas creadas. Crea una mascota primero.
              </Text>

              <Pressable
                className="mt-3 bg-[#FE9B5C] px-4 py-3 rounded-full items-center"
                onPress={() => router.push("/createPet/createPet")}
              >
                <Text className="text-white font-semibold">Crear mascota</Text>
              </Pressable>
            </View>
          ) : (
            pets.map((p) => (
              <Pill
                key={p.id}
                label={p.name || "Mascota"}
                active={selectedPetId === p.id}
                onPress={() => {
                  setSelectedPetId(p.id);
                  // opcional: cargar descripción base al cambiar
                  setDescription(p?.description || "");
                }}
              />
            ))
          )}
        </View>

        {/* Descripción */}
        <Text className="text-base font-semibold text-gray-800 mb-2">
          Descripción para adopción
        </Text>
        <View className="border border-gray-300 rounded-xl p-3 mb-4">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ej: Es cariñosa, vacunada, se entrega con compromiso..."
            multiline
            className="text-base"
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />
        </View>

        {/* Ubicación */}
        <Text className="text-base font-semibold text-gray-800 mb-2">
          Ubicación
        </Text>
        <View className="border border-gray-300 rounded-xl p-3 mb-6">
          <TextInput
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Ej: Ciudad de Panamá, San Miguelito..."
            className="text-base"
            maxLength={60}
          />
        </View>

        {/* Botón */}
        <Pressable
          disabled={!canSubmit || submitting || pets.length === 0}
          onPress={onSubmit}
          className={`py-4 rounded-2xl items-center ${
            !canSubmit || submitting || pets.length === 0
              ? "bg-gray-300"
              : "bg-[#FE9B5C]"
          }`}
        >
          <Text className="text-white font-semibold">
            {submitting ? "Publicando..." : "Publicar en adopción"}
          </Text>
        </Pressable>

        <Pressable
          className="mt-3 py-4 rounded-2xl items-center bg-gray-100"
          onPress={() => router.back()}
        >
          <Text className="text-gray-700 font-semibold">Cancelar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
