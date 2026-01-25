import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";

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

async function uploadToStorage(fileUri, storagePath, mimeType) {
  const res = await fetch(fileUri);
  const arrayBuffer = await res.arrayBuffer();

  return supabase.storage.from("media").upload(storagePath, arrayBuffer, {
    contentType: mimeType,
    upsert: false,
  });
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [myUser, setMyUser] = useState(null); // {id, username, profile_pic}
  const [users, setUsers] = useState([]); // SOLO los que sigo
  const [q, setQ] = useState("");

  // ✅ inputs del grupo
  const [groupTitle, setGroupTitle] = useState("");
  const [groupImageAsset, setGroupImageAsset] = useState(null);
  const [groupImagePreview, setGroupImagePreview] =
    useState(FALLBACK_GROUP_IMAGE);

  // ✅ seleccionados
  const [selected, setSelected] = useState({}); // { userId: true }

  // ---------- load current supa user + following users ----------
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    (async () => {
      setLoading(true);

      // 1) resolver mi user interno (tabla user)
      const { data: me, error: meErr } = await supabase
        .from("user")
        .select("id, username, profile_pic")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (meErr || !me?.id) {
        console.error("No se pudo resolver mi user:", meErr?.message);
        setLoading(false);
        return;
      }

      setMyUser(me);

      // 2) buscar a quién sigo (user_follows)
      const { data: follows, error: fErr } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", me.id);

      if (fErr) {
        console.error("Error cargando user_follows:", fErr.message);
        setUsers([]);
        setLoading(false);
        return;
      }

      const followingIds = (follows || [])
        .map((r) => String(r.following_id))
        .filter(Boolean)
        .filter((id) => String(id) !== String(me.id)); // por si acaso

      // si no sigo a nadie, lista vacía
      if (followingIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // 3) traer solo esos usuarios
      const { data: followingUsers, error: uErr } = await supabase
        .from("user")
        .select("id, username, profile_pic")
        .in("id", followingIds)
        .order("username", { ascending: true });

      if (uErr) {
        console.error("Error cargando usuarios seguidos:", uErr.message);
        setUsers([]);
      } else {
        setUsers(followingUsers || []);
      }

      setLoading(false);
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  // ---------- search ----------
  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      String(u.username || "")
        .toLowerCase()
        .includes(term)
    );
  }, [users, q]);

  const selectedIds = useMemo(() => {
    return Object.keys(selected).filter((id) => selected[id]);
  }, [selected]);

  const toggleUser = useCallback((id) => {
    setSelected((prev) => ({ ...prev, [String(id)]: !prev[String(id)] }));
  }, []);

  // ---------- pick image ----------
  const pickGroupImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setGroupImageAsset(asset);
    setGroupImagePreview(asset.uri);
  }, []);

  // ---------- create group ----------
  const createGroup = useCallback(async () => {
    if (creating) return;
    if (!myUser?.id) return;

    const title = groupTitle.trim();
    if (!title) {
      Alert.alert("Falta el título", "Escribe un nombre para el grupo.");
      return;
    }

    if (selectedIds.length < 1) {
      Alert.alert("Faltan miembros", "Selecciona al menos 1 usuario.");
      return;
    }

    setCreating(true);

    try {
      // 1) crear chat
      const { data: chat, error: chatErr } = await supabase
        .from("chats")
        .insert({ type: "group", created_by: myUser.id })
        .select("id")
        .single();

      if (chatErr || !chat?.id) {
        console.error("Error creando chat:", chatErr?.message);
        Alert.alert("Error", "No se pudo crear el grupo (chat).");
        return;
      }

      const chatId = chat.id;

      // 2) miembros (yo owner + seleccionados member)
      const rows = [
        { chat_id: chatId, user_id: myUser.id, role: "owner" },
        ...selectedIds.map((uid) => ({
          chat_id: chatId,
          user_id: uid,
          role: "member",
        })),
      ];

      const { error: memErr } = await supabase
        .from("chat_members")
        .insert(rows);

      if (memErr) {
        console.error("Error insert chat_members:", memErr.message);
        Alert.alert("Error", "No se pudieron agregar los miembros.");
        return;
      }

      // 3) subir imagen (opcional)
      let avatarUrl = FALLBACK_GROUP_IMAGE;

      if (groupImageAsset?.uri) {
        const fileUri = groupImageAsset.uri;
        const mimeType = getMimeType(fileUri);
        const ext = (fileUri.split(".").pop() || "jpg").toLowerCase();

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        // ✅ que empiece con groups/ para tu policy
        const storagePath = `groups/${chatId}/${fileName}`;

        const { error: upErr } = await uploadToStorage(
          fileUri,
          storagePath,
          mimeType
        );

        if (!upErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("media").getPublicUrl(storagePath);

          if (publicUrl) avatarUrl = publicUrl;
        } else {
          console.error("Error subiendo avatar:", upErr);
        }
      }

      // 4) crear chat_groups
      const { error: groupErr } = await supabase.from("chat_groups").insert({
        chat_id: chatId,
        title,
        avatar: avatarUrl,
      });

      if (groupErr) {
        console.error("Error insert chat_groups:", groupErr.message);
        Alert.alert(
          "Grupo creado",
          "Se creó el grupo, pero no se pudo guardar el título/imagen."
        );
      }

      // 5) navegar al chat
      router.push({
        pathname: "chatDetail/[id]",
        params: { userId: String(chatId) },
      });
    } finally {
      setCreating(false);
    }
  }, [creating, myUser?.id, groupTitle, selectedIds, groupImageAsset, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Cargando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "Crear grupo" }} />

      {/* Header: imagen + título */}
      <View className="px-4 pt-4">
        <View className="items-center">
          <Pressable onPress={pickGroupImage} disabled={creating}>
            <Image
              source={{ uri: groupImagePreview || FALLBACK_GROUP_IMAGE }}
              className="w-24 h-24 rounded-full"
            />
            <Text className="text-indigo-600 mt-2 text-sm text-center">
              Cambiar imagen
            </Text>
          </Pressable>
        </View>

        <Text className="mt-4 text-gray-500">Nombre del grupo</Text>
        <TextInput
          value={groupTitle}
          onChangeText={setGroupTitle}
          placeholder="Ej: Patitas Panamá 🐾"
          className="mt-2 border border-gray-200 rounded-xl px-3 py-2"
          editable={!creating}
        />

        <Text className="mt-4 text-gray-500">
          Agregar miembros (solo seguidos)
        </Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar usuario..."
          className="mt-2 border border-gray-200 rounded-xl px-3 py-2"
          editable={!creating}
        />

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-gray-700">
            Seleccionados:{" "}
            <Text className="font-semibold">{selectedIds.length}</Text>
          </Text>

          <Pressable
            onPress={createGroup}
            disabled={creating}
            className={`px-4 py-2 rounded-xl ${
              creating ? "bg-gray-300" : "bg-indigo-600"
            }`}
          >
            <Text className="text-white font-semibold">
              {creating ? "Creando..." : "Crear grupo"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Lista de usuarios seguidos */}
      {filteredUsers.length === 0 ? (
        <View className="px-4 mt-6">
          <Text className="text-gray-500">
            No estás siguiendo a nadie (o no hay usuarios disponibles).
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 20,
          }}
          renderItem={({ item }) => {
            const isSelected = !!selected[String(item.id)];
            return (
              <Pressable
                onPress={() => toggleUser(item.id)}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <Image
                  source={{ uri: item.profile_pic || FALLBACK_AVATAR }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {item.username || "Usuario"}
                  </Text>
                </View>

                <View
                  className={`h-5 w-5 rounded-full border ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  }`}
                />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
