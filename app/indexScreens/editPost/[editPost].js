import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";
import { DeviceEventEmitter } from "react-native";

export default function EditPost() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const postIdArr = Array.isArray(postId) ? postId[0] : postId;

  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewerId, setViewerId] = useState(null);
  const [post, setPost] = useState(null);

  const [description, setDescription] = useState("");

  // ---------- resolver viewerId ----------
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from("user")
        .select("id")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (!error && data?.id) setViewerId(String(data.id));
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  // ---------- cargar post ----------
  const loadPost = useCallback(async () => {
    if (!postIdArr) {
      Alert.alert("Error", "No llegó el id del post a EditPost.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("post")
      .select("id, user_id, description, created_at, updated_at")
      .eq("id", postIdArr)
      .maybeSingle();

    if (error || !data?.id) {
      console.error("EditPost loadPost error:", error?.message);
      Alert.alert("Error", "No se pudo cargar la publicación.");
      setLoading(false);
      return;
    }

    setPost(data);
    setDescription(data.description || "");
    setLoading(false);
  }, [postIdArr]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const isOwner = useMemo(() => {
    if (!post || !viewerId) return false;
    return String(post.user_id) === String(viewerId);
  }, [post, viewerId]);

  // ---------- guardar ----------
  const handleSave = useCallback(async () => {
    if (saving) return;
    if (!postIdArr) return;

    const text = description.trim();
    if (!text) {
      Alert.alert("Descripción", "La descripción no puede estar vacía.");
      return;
    }

    if (!isOwner) {
      Alert.alert("Sin permiso", "No puedes editar esta publicación.");
      return;
    }

    setSaving(true);
    try {
      const updatedAt = new Date().toISOString();

      const { error } = await supabase
        .from("post")
        .update({ description: text, updated_at: updatedAt })
        .eq("id", postIdArr);

      if (error) {
        console.error("EditPost update error:", error.message);
        Alert.alert("Error", "No se pudo guardar la publicación.");
        return;
      }

      // 🔥 Notificar a Comment para que actualice rápido
      DeviceEventEmitter.emit("post:updated", {
        postId: String(postIdArr),
        description: text,
        updated_at: updatedAt,
      });

      router.back();
    } finally {
      setSaving(false);
    }
  }, [saving, postIdArr, description, isOwner, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Cargando...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-700 text-center">
          No se encontró la publicación.
        </Text>

        <Pressable
          className="mt-4 px-4 py-2 bg-gray-900 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-4">
      <Stack.Screen options={{ title: "Editar publicación" }} />

      {!isOwner ? (
        <View className="mt-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <Text className="text-yellow-800 font-semibold">Sin permiso</Text>
          <Text className="text-yellow-700 mt-1">
            Solo el dueño puede editar esta publicación.
          </Text>
        </View>
      ) : null}

      <Text className="mt-6 text-gray-600">Descripción</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        className="mt-2 border border-gray-200 rounded-2xl px-3 py-3 min-h-[120px]"
        multiline
        editable={!saving && isOwner}
        placeholder="Escribe la nueva descripción..."
      />

      <View className="flex-row gap-3 mt-6">
        <Pressable
          className="flex-1 py-3 rounded-2xl bg-gray-100"
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text className="text-center font-semibold text-gray-700">
            Cancelar
          </Text>
        </Pressable>

        <Pressable
          className={`flex-1 py-3 rounded-2xl ${saving || !isOwner ? "bg-gray-300" : "bg-indigo-600"}`}
          onPress={handleSave}
          disabled={saving || !isOwner}
        >
          <Text className="text-center font-semibold text-white">
            {saving ? "Guardando..." : "Guardar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
