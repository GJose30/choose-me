import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Close, ArrowLeft } from "../../components/Icon";
import "react-native-url-polyfill/auto";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@clerk/clerk-expo";

const getMimeType = (uri) => {
  const extension = (uri.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (["mp4", "mov", "avi", "m4v"].includes(extension)) return "video";
  return "application/octet-stream";
};

export default function CreatePost() {
  const { pet_id } = useLocalSearchParams();
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;

  const { isLoaded, isSignedIn, user } = useUser();

  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  const [petInfo, setPetInfo] = useState(null);

  // ✅ user_id real (tabla public.user)
  const [viewerId, setViewerId] = useState(null);
  const [resolvingUser, setResolvingUser] = useState(true);

  const likes = 0;
  const comments = 0;
  const imageSize = (screenWidth - 40) / 3;

  // ========= RESOLVE VIEWER (tabla user por clerk_id) ==========
  const resolveViewer = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn || !user?.id) {
      setViewerId(null);
      setResolvingUser(false);
      return;
    }

    setResolvingUser(true);
    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error resolviendo viewerId:", error.message);
      setViewerId(null);
    } else {
      setViewerId(data?.id ? String(data.id) : null);
      if (!data?.id) {
        console.warn("No existe fila en user para este clerk_id");
      }
    }
    setResolvingUser(false);
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    resolveViewer();
  }, [resolveViewer]);

  // ========= FETCH PET INFO ==========
  const fetchPetInfo = useCallback(async () => {
    if (!pet_id) return;
    const { data, error } = await supabase
      .from("pet")
      .select("*, media_pet(*)")
      .eq("id", pet_id)
      .single();

    if (error) {
      console.error("Error fetchPetInfo:", error.message);
      return;
    }
    setPetInfo(data);
  }, [pet_id]);

  useEffect(() => {
    fetchPetInfo();
  }, [fetchPetInfo]);

  // ========= SELECT MEDIA ==========
  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaFiles((prev) => [...prev, ...(result.assets || [])]);
    }
  };

  const takeMedia = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaFiles((prev) => [...prev, ...(result.assets || [])]);
    }
  };

  const uploadToStorage = async (fileUri, fileName, mimeType) => {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    return supabase.storage.from("media").upload(fileName, byteArray, {
      contentType: mimeType,
      upsert: false,
    });
  };

  // ========= POST ==========
  const handlePost = async () => {
    if (isPosting) return;

    // ✅ obligatoria: al menos 1 media
    if (mediaFiles.length === 0) {
      Alert.alert(
        "Falta contenido",
        "Debes agregar al menos una imagen o video para poder publicar."
      );
      return;
    }

    // ✅ usuario resuelto
    if (!viewerId) {
      Alert.alert(
        "No se pudo publicar",
        "No se pudo identificar tu usuario. Intenta cerrar sesión y volver a entrar."
      );
      return;
    }

    setIsPosting(true);

    try {
      // 1) Crear post con user_id del usuario en sesión
      const { data: post, error: postError } = await supabase
        .from("post")
        .insert({
          description,
          pet_id,
          user_id: viewerId, // ✅ AQUÍ el cambio
          likes,
          comments,
        })
        .select()
        .single();

      if (postError) {
        console.error("postError:", postError);
        Alert.alert("Error", "No se pudo crear la publicación.");
        return;
      }

      const postId = post.id;

      // 2) Subir media
      for (const asset of mediaFiles) {
        try {
          const fileUri = asset.uri;
          if (!fileUri) continue;

          const ext = (fileUri.split(".").pop() || "jpg").toLowerCase();
          const mimeType = getMimeType(fileUri);

          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

          const { error: storageError } = await uploadToStorage(
            fileUri,
            fileName,
            mimeType
          );

          if (storageError) {
            console.error("storageError:", storageError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("media").getPublicUrl(fileName);

          await supabase.from("media_post").insert({
            source: publicUrl,
            type: mimeType === "video" ? "video" : "image",
            post_id: postId,
          });
        } catch (e) {
          console.error("Error subiendo asset:", e?.message || e);
        }
      }

      router.back();
    } finally {
      setIsPosting(false);
    }
  };

  // ========= RENDER MEDIA ==========
  const renderMediaItem = ({ item, index }) => (
    <View
      style={{
        width: imageSize,
        height: imageSize,
        marginBottom: 10,
        marginRight: 5,
      }}
    >
      <Image
        source={{ uri: item.uri }}
        style={{ width: "100%", height: "100%", borderRadius: 10 }}
      />

      <TouchableOpacity
        onPress={() =>
          setMediaFiles((prev) => prev.filter((_, i) => i !== index))
        }
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderRadius: 20,
          width: 24,
          height: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Close color="white" size={16} />
      </TouchableOpacity>
    </View>
  );

  const petPic = petInfo?.media_pet?.[0]?.source;

  const disablePublish =
    isPosting || mediaFiles.length === 0 || resolvingUser || !viewerId;

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => (
            <View className="justify-center">
              <Text className="text-white text-3xl font-bold ml-10 mt-1">
                Nuevo Post
              </Text>
            </View>
          ),
          headerLeft: () => (
            <View className="justify-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="ml-2 mt-1"
              >
                <ArrowLeft size={34} color="white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <LinearGradient
        colors={["#f97316", "#fb923c"]}
        className="h-52 px-5 pt-12 pb-3 rounded-b-3xl"
      >
        {petInfo && (
          <View className="flex-row items-center mt-7">
            <Image
              source={{ uri: petPic }}
              className="w-14 h-14 rounded-full mr-3 border-2 border-white"
            />
            <View>
              <Text className="text-white text-xl font-semibold">
                {petInfo.name}
              </Text>
              <Text className="text-white/80 text-sm">
                {petInfo.location ?? "Ubicación desconocida"}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-10 px-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="bg-white rounded-2xl p-4 shadow-2xl">
          <TextInput
            placeholder="¿Qué estás pensando?"
            multiline
            className="text-base text-gray-800"
            style={{ minHeight: 100, textAlignVertical: "top" }}
            value={description}
            onChangeText={setDescription}
          />

          <View className="mt-4 flex-row gap-x-3">
            <TouchableOpacity
              onPress={pickMedia}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-800 font-medium">
                Seleccionar de galería
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takeMedia}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-800 font-medium">
                Tomar foto/video
              </Text>
            </TouchableOpacity>
          </View>

          {mediaFiles.length > 0 && (
            <FlatList
              data={mediaFiles}
              renderItem={renderMediaItem}
              keyExtractor={(_, index) => index.toString()}
              numColumns={3}
              scrollEnabled={false}
              className="mt-4"
            />
          )}

          <TouchableOpacity
            onPress={handlePost}
            disabled={disablePublish}
            className={`mt-5 rounded-xl py-3 items-center justify-center ${
              disablePublish ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {isPosting || resolvingUser ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Publicar
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-3 py-2 border border-gray-300 rounded-xl items-center"
          >
            <Text className="text-gray-700">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
