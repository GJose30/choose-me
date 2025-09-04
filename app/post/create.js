import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Button,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Close } from "../../components/Icon";
import "react-native-url-polyfill/auto";
import { Dimensions } from "react-native";

// Función para detectar tipo MIME basado en la extensión
const getMimeType = (uri) => {
  const extension = uri.split(".").pop().toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
      //   return "image/jpeg";
      return "image";
    case "gif":
      //   return "image/gif";
      return "image";
    case "mp4":
    case "mov":
    case "avi":
      //   return "video/mp4";
      return "video";
    default:
      return "application/octet-stream";
  }
};

export default function CreatePost() {
  const { pet_id } = useLocalSearchParams();
  const screenWidth = Dimensions.get("window").width;
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const router = useRouter();
  const user_id = "5c16bcb5-489c-465e-8f42-186c6fe9061f"; // Reemplaza con el user_id real desde Clerk
  const likes = 0;
  const comments = 0;

  //Comienza
  const renderMediaItem = ({ item, index }) => (
    <View
      key={index}
      style={
        {
          // width: (screenWidth - 40) / 3, // 10 (left) + 10 (right) + 10*2 entre columnas
          // height: (screenWidth - 40) / 3,
          // justifyContent: "space-between",
          // marginBottom: 10,
          // position: "relative",
        }
      }
    >
      {/* {item.type === "image" ? ( */}
      <Image
        source={{ uri: item.uri }}
        style={{
          width: 100,
          height: 100,
          borderRadius: 10,
        }}
      />
      {/* ) : (
        <VideoView
          source={{ uri: item.uri }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 10,
          }}
          useNativeControls
          resizeMode="cover"
          isLooping
        />
      )} */}
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
        <Close color={"white"} size={16} />
      </TouchableOpacity>
    </View>
  );

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaTypeOptions.All,
      mediaTypes: ["images", "videos"],
      // allowsEditing: true,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaFiles((prev) => [...prev, ...result.assets]);
    }
  };

  /* --------‑‑‑ 2. Tomar foto o video ‑‑‑--------- */
  const takeMedia = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      // mediaTypes: ImagePicker.MediaTypeOptions.All,
      mediaTypes: ["images", "videos"],
      // allowsEditing: true,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaFiles((prev) => [...prev, ...result.assets]);
    }
  };

  const uploadToStorage = async (fileUri, fileName, mimeType) => {
    // Lee el archivo como base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convierte base64 ➜ Uint8Array (aceptado por supabase-js)
    const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    return supabase.storage.from("media").upload(fileName, byteArray, {
      contentType: mimeType,
      upsert: false,
    });
  };

  const handlePost = async () => {
    /* 4.1  Guarda el registro del post */
    const { data: post, error: postError } = await supabase
      .from("post")
      .insert({
        likes: likes,
        comments: comments,
        description: description,
        pet_id: pet_id, // pon tu valor real
        user_id: user_id, // pon tu valor real
      })
      .select()
      .single();

    if (postError || !post) {
      console.error("Error al insertar el post", postError);
      return;
    }

    const postId = post.id;

    /* 4.2  Recorre los archivos seleccionados */
    for (const asset of mediaFiles) {
      try {
        const fileUri = asset.uri;
        const ext = fileUri.split(".").pop();
        const mimeType = getMimeType(fileUri);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        /* Sube a Storage */
        const { error: storageError } = await uploadToStorage(
          fileUri,
          fileName,
          mimeType
        );
        if (storageError) {
          console.error("Error al subir a storage", storageError);
          continue;
        }

        /* Obtiene URL pública */
        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(fileName);

        /* Guarda la fila en tabla `media` */
        const type = mimeType.startsWith("video") ? "video" : "image";
        const { error: mediaError } = await supabase.from("media_post").insert({
          source: publicUrl,
          type,
          post_id: postId,
        });

        if (mediaError) {
          console.error("Error al insertar en media", mediaError);
        }
      } catch (err) {
        console.error("Error procesando archivo", err);
      }
    }

    // router.back(); // vuelve a la pantalla anterior
    router.back();
  };

  useEffect(() => {
    // console.log(pet_id);
  }, [pet_id]);

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      {/* <Text className="text-xl font-bold mb-2">Nuevo Post</Text> */}

      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: () => (
            <View className="flex-row items-center">
              {/* <Image
                  source={{ uri: avatar || "https://via.placeholder.com/40" }}
                  className="w-10 h-10 rounded-full mr-2"
                /> */}
              <Text className="text-gray-800 font-semibold text-xl">
                Nuevo Post
              </Text>
            </View>
          ),
        }}
      />

      <TextInput
        placeholder="¿Qué estás pensando?"
        multiline
        className="border border-gray-300 rounded p-3 mb-4"
        style={{ minHeight: 100 }}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        onPress={pickMedia}
        className="bg-gray-200 rounded p-2 mb-2 items-center"
      >
        <Text>Seleccionar de galería</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={takeMedia}
        className="bg-gray-200 rounded p-2 mb-4 items-center"
      >
        <Text>Tomar foto o video</Text>
      </TouchableOpacity>

      {/* <ScrollView horizontal>
        {mediaFiles.map((file, idx) => (
          <Image
            key={idx}
            source={{ uri: file.uri }}
            style={{
              width: 100,
              height: 100,
              marginRight: 10,
              borderRadius: 10,
            }}
          />
        ))}
      </ScrollView> */}

      {/* <ScrollView horizontal>
        {mediaFiles.map((file, idx) => (
          <View key={idx} style={{ position: "relative", marginRight: 10 }}>
            <Image
              source={{ uri: file.uri }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 10,
              }}
            />
            <TouchableOpacity
              onPress={() =>
                setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
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
              
              <Close color={"white"} size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView> */}

      {/* <FlatList
        data={mediaFiles}
        renderItem={renderMediaItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      /> */}

      <View
        style={{
          width: "100%",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {mediaFiles.map((item, index) => renderMediaItem({ item, index }))}
      </View>

      <TouchableOpacity
        onPress={handlePost}
        className="bg-blue-600 rounded p-3 mt-5"
      >
        <Text className="text-white text-center font-semibold">Publicar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-3 p-2 border rounded items-center"
      >
        <Text>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
