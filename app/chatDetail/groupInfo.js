import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

const FALLBACK_GROUP_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/681/681494.png";

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const getMimeType = (uri) => {
  const ext = (uri.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
};

export default function GroupInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // chatId
  const chatId = Array.isArray(id) ? id[0] : id;

  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(FALLBACK_GROUP_IMAGE);

  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ usuario actual en tu tabla "user"
  const [myUserId, setMyUserId] = useState(null);

  // ✅ role del usuario actual dentro del grupo
  const myRole = useMemo(() => {
    if (!myUserId) return null;
    const me = members.find((m) => String(m.id) === String(myUserId));
    return me?.role || null;
  }, [members, myUserId]);

  const isOwner = myRole === "owner";

  const uploadToStorage = async (fileUri, storagePath, mimeType) => {
    const res = await fetch(fileUri);
    const arrayBuffer = await res.arrayBuffer();

    return supabase.storage.from("media").upload(storagePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });
  };

  /* ---------- Resolver myUserId (tabla user) ---------- */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from("user")
        .select("id")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error resolviendo myUserId:", error.message);
        return;
      }
      setMyUserId(data?.id ?? null);
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  /* ---------- Load group info ---------- */
  const loadGroup = useCallback(async () => {
    if (!chatId) return;

    setLoading(true);

    // 1) chat_groups (title + avatar)
    const { data: group, error: gErr } = await supabase
      .from("chat_groups")
      .select("title, avatar")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (gErr) console.error("Error cargando chat_groups:", gErr.message);

    setGroupName(group?.title || "Grupo");
    setGroupImage(group?.avatar || FALLBACK_GROUP_IMAGE);

    // 2) miembros
    const { data: mems, error: memErr } = await supabase
      .from("chat_members")
      .select("role, user:user_id(id,username,profile_pic)")
      .eq("chat_id", chatId);

    if (memErr) console.error("Error cargando miembros:", memErr.message);

    setMembers((mems || []).map((m) => ({ ...m.user, role: m.role })));

    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  /* ---------- Save name ---------- */
  const saveGroupName = useCallback(async () => {
    const name = groupName.trim();
    if (!name) {
      Alert.alert(
        "Nombre inválido",
        "El nombre del grupo no puede estar vacío."
      );
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("chat_groups")
        .update({ title: name, updated_at: new Date().toISOString() })
        .eq("chat_id", chatId);

      if (error) {
        console.error("Error actualizando chat_groups:", error.message);
        Alert.alert("Error", "No se pudo guardar el nombre del grupo.");
        return;
      }

      setEditingName(false);
    } finally {
      setSaving(false);
    }
  }, [groupName, chatId]);

  /* ---------- Pick image (gallery) ---------- */
  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return null;

    return result.assets?.[0] || null;
  }, []);

  /* ---------- Upload group image ---------- */
  const changeGroupImage = useCallback(async () => {
    if (!chatId || saving) return;

    try {
      const asset = await pickFromGallery();
      if (!asset?.uri) return;

      setSaving(true);

      const fileUri = asset.uri;
      const mimeType = getMimeType(fileUri);
      const ext = (fileUri.split(".").pop() || "jpg").toLowerCase();

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `groups/${chatId}/${fileName}`;

      const { error: storageError } = await uploadToStorage(
        fileUri,
        storagePath,
        mimeType
      );

      if (storageError) {
        console.error("Error subiendo imagen de grupo:", storageError);
        Alert.alert("Error", "No se pudo subir la imagen del grupo.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(storagePath);

      if (!publicUrl) return;

      const { error: updErr } = await supabase
        .from("chat_groups")
        .update({ avatar: publicUrl, updated_at: new Date().toISOString() })
        .eq("chat_id", chatId);

      if (updErr) {
        console.error("Error guardando avatar en chat_groups:", updErr);
        Alert.alert("Error", "No se pudo guardar la imagen del grupo.");
        return;
      }

      setGroupImage(publicUrl);
    } catch (e) {
      console.error("changeGroupImage exception:", e);
      Alert.alert("Error", "Ocurrió un error cambiando la imagen.");
    } finally {
      setSaving(false);
    }
  }, [chatId, pickFromGallery, saving]);

  /* ---------- Salir del grupo ---------- */
  const leaveGroup = useCallback(async () => {
    if (!chatId || !myUserId || saving) return;

    Alert.alert("Salir del grupo", "¿Seguro que quieres salir de este grupo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);

            const { error } = await supabase
              .from("chat_members")
              .delete()
              .eq("chat_id", chatId)
              .eq("user_id", myUserId);

            if (error) {
              console.error("Error saliendo del grupo:", error.message);
              Alert.alert("Error", "No se pudo salir del grupo.");
              return;
            }

            // volver a lista de chats
            router.replace("/chat"); // si tu tab se llama "chat"
            // si no, usa router.back();
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }, [chatId, myUserId, saving, router]);

  /* ---------- Eliminar grupo (solo owner) ---------- */
  const deleteGroup = useCallback(async () => {
    if (!chatId || !myUserId || saving) return;

    Alert.alert(
      "Eliminar grupo",
      "Esto eliminará el grupo para todos (mensajes, miembros e información). ¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);

              // ✅ orden recomendado
              const { error: msgErr } = await supabase
                .from("chat_messages")
                .delete()
                .eq("chat_id", chatId);

              if (msgErr) {
                console.error("delete chat_messages:", msgErr.message);
                Alert.alert(
                  "Error",
                  "No se pudo eliminar el historial del grupo."
                );
                return;
              }

              const { error: memErr } = await supabase
                .from("chat_members")
                .delete()
                .eq("chat_id", chatId);

              if (memErr) {
                console.error("delete chat_members:", memErr.message);
                Alert.alert("Error", "No se pudieron eliminar los miembros.");
                return;
              }

              const { error: grpErr } = await supabase
                .from("chat_groups")
                .delete()
                .eq("chat_id", chatId);

              if (grpErr) {
                console.error("delete chat_groups:", grpErr.message);
                Alert.alert(
                  "Error",
                  "No se pudo eliminar la información del grupo."
                );
                return;
              }

              const { error: chatErr } = await supabase
                .from("chats")
                .delete()
                .eq("id", chatId);

              if (chatErr) {
                console.error("delete chats:", chatErr.message);
                Alert.alert("Error", "No se pudo eliminar el chat del grupo.");
                return;
              }

              router.replace("/chat"); // volver a lista de chats
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [chatId, myUserId, saving, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Cargando grupo...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "Información del grupo" }} />

      {/* Imagen + nombre */}
      <View className="items-center pt-6">
        <Pressable onPress={changeGroupImage} disabled={saving}>
          <Image
            source={{ uri: groupImage || FALLBACK_GROUP_IMAGE }}
            className="w-28 h-28 rounded-full"
          />
          <Text className="text-indigo-600 mt-2 text-sm text-center">
            {saving ? "Guardando..." : "Cambiar imagen"}
          </Text>
        </Pressable>

        {editingName ? (
          <>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              className="mt-4 text-lg font-semibold border-b border-gray-300 px-2"
              editable={!saving}
            />
            <Pressable
              onPress={saveGroupName}
              disabled={saving}
              className="mt-2"
            >
              <Text className="text-indigo-600 font-semibold">
                {saving ? "Guardando..." : "Guardar"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setEditingName(false)}
              disabled={saving}
              className="mt-2"
            >
              <Text className="text-gray-500">Cancelar</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="mt-4 text-xl font-semibold">{groupName}</Text>
            <Pressable onPress={() => setEditingName(true)} disabled={saving}>
              <Text className="text-indigo-600 mt-1">Editar nombre</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Miembros */}
      <View className="mt-6 px-4 flex-1">
        <Text className="text-gray-500 mb-2">Miembros ({members.length})</Text>

        <FlatList
          data={members}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Image
                source={{ uri: item.profile_pic || FALLBACK_AVATAR }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View>
                <Text className="font-semibold text-gray-900">
                  {item.username || "Usuario"}
                </Text>
                {item.role === "owner" ? (
                  <Text className="text-xs text-gray-400">Administrador</Text>
                ) : null}
              </View>
            </View>
          )}
          ListFooterComponent={
            <View className="py-6">
              <Pressable
                onPress={leaveGroup}
                disabled={saving || !myUserId}
                className="py-3 rounded-xl border border-red-200 bg-red-50"
              >
                <Text className="text-center text-red-600 font-semibold">
                  {saving ? "Procesando..." : "Salir del grupo"}
                </Text>
              </Pressable>

              {/* ✅ Solo owner ve eliminar grupo */}
              {isOwner ? (
                <Pressable
                  onPress={deleteGroup}
                  disabled={saving || !myUserId}
                  className="mt-3 py-3 rounded-xl bg-red-600"
                >
                  <Text className="text-center text-white font-semibold">
                    {saving ? "Eliminando..." : "Eliminar grupo"}
                  </Text>
                </Pressable>
              ) : null}

              {/* Nota tipo WhatsApp */}
              {isOwner ? (
                <Text className="text-gray-400 text-xs text-center mt-3">
                  Como administrador puedes eliminar el grupo para todos.
                </Text>
              ) : (
                <Text className="text-gray-400 text-xs text-center mt-3">
                  Al salir, ya no podrás ver ni enviar mensajes en este grupo.
                </Text>
              )}
            </View>
          }
        />
      </View>
    </View>
  );
}
