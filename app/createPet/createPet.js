import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@clerk/clerk-expo"; // si usas Clerk
import * as FileSystem from "expo-file-system";

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

export default function CreatePetProfile() {
  const router = useRouter();
  //   const { userId } = useAuth(); // Clerk
  const userId = "5c16bcb5-489c-465e-8f42-186c6fe9061f";
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
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

  const uploadImage = async (petId) => {
    if (!image) return null;

    // const ext = image.uri.split(".").pop();
    // const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // const filePath = `pets/${fileName}`;
    // const mimeType = getMimeType(image.uri); // Asegúrate de que esta función retorne algo como "image/jpeg"

    const fileUri = image.uri;
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
      return null;
    }

    // console.log(image.uri);

    // const response = await fetch(image.uri);
    // const blob = await response.blob();

    // if (!blob || blob.size === 0) {
    //   console.error("El blob está vacío o inválido");
    //   return null;
    // }

    // const { data: uploadData, error: uploadError } = await supabase.storage
    //   .from("media")
    //   .upload(filePath, blob, {
    //     contentType: mimeType,
    //     upsert: false,
    //   });

    // if (uploadError) {
    //   console.error("Error al subir imagen:", uploadError);
    //   return null;
    // }

    /* Obtiene URL pública */
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(fileName);

    // const { data: publicUrlData } = supabase.storage
    //   .from("media")
    //   .getPublicUrl(filePath);

    // const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      console.error("No se pudo obtener la URL pública");
      return null;
    }

    // Insertar en media_pet
    const { error: insertError } = await supabase.from("media_pet").insert([
      {
        source: publicUrl,
        type: mimeType.startsWith("image") ? "image" : "video",
        pet_id: petId,
      },
    ]);

    if (insertError) {
      console.error("Error al insertar en media_pet:", insertError);
      return null;
    }

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!name || !breed || !age || !city || !userId || !description) return;

    setLoading(true);

    const { data: petData, error } = await supabase
      .from("pet")
      .insert([
        {
          name: name,
          description: description,
          location: city,
          likes: 0,
          age: age,
          breed: breed,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error al crear mascota:", error);
      setLoading(false);
      return;
    }

    await uploadImage(petData.id);

    setLoading(false);
    router.back(); // o navegar a otra pantalla
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Stack.Screen
        options={{
          title: "Crear perfil de mascota 🐶",
        }}
      />

      <Text className="text-lg font-semibold mb-2">Nombre</Text>
      <TextInput
        className="border p-2 rounded mb-3"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-lg font-semibold mb-2">Raza</Text>
      <TextInput
        className="border p-2 rounded mb-3"
        value={breed}
        onChangeText={setBreed}
      />

      <Text className="text-lg font-semibold mb-2">Edad</Text>
      <TextInput
        className="border p-2 rounded mb-3"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text className="text-lg font-semibold mb-2">Ciudad</Text>
      <TextInput
        className="border p-2 rounded mb-3"
        value={city}
        onChangeText={setCity}
      />

      <Text className="text-lg font-semibold mb-2">Descripcion</Text>
      <TextInput
        className="border p-2 rounded mb-3"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        onPress={pickImage}
        className="bg-gray-200 p-2 rounded mb-3"
      >
        <Text className="text-center">
          {image ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
        </Text>
      </TouchableOpacity>

      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 10,
            marginBottom: 10,
          }}
        />
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-blue-500 p-3 rounded"
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold">
            Crear perfil
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
