// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import { Stack, useRouter } from "expo-router";
// import { supabase } from "../../lib/supabase";
// import { useAuth } from "@clerk/clerk-expo"; // si usas Clerk
// import * as FileSystem from "expo-file-system";

// // Función para detectar tipo MIME basado en la extensión
// const getMimeType = (uri) => {
//   const extension = uri.split(".").pop().toLowerCase();
//   switch (extension) {
//     case "jpg":
//     case "jpeg":
//     case "png":
//       //   return "image/jpeg";
//       return "image";
//     case "gif":
//       //   return "image/gif";
//       return "image";
//     case "mp4":
//     case "mov":
//     case "avi":
//       //   return "video/mp4";
//       return "video";
//     default:
//       return "application/octet-stream";
//   }
// };

// export default function CreatePetProfile() {
//   const router = useRouter();
//   //   const { userId } = useAuth(); // Clerk
//   const userId = "5c16bcb5-489c-465e-8f42-186c6fe9061f";
//   const [name, setName] = useState("");
//   const [breed, setBreed] = useState("");
//   const [age, setAge] = useState("");
//   const [city, setCity] = useState("");
//   const [description, setDescription] = useState("");
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") return;
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images", "videos"],
//       allowsEditing: true,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0]);
//     }
//   };

//   const uploadToStorage = async (fileUri, fileName, mimeType) => {
//     // Lee el archivo como base64
//     const base64 = await FileSystem.readAsStringAsync(fileUri, {
//       encoding: FileSystem.EncodingType.Base64,
//     });

//     // Convierte base64 ➜ Uint8Array (aceptado por supabase-js)
//     const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

//     return supabase.storage.from("media").upload(fileName, byteArray, {
//       contentType: mimeType,
//       upsert: false,
//     });
//   };

//   const uploadImage = async (petId) => {
//     if (!image) return null;

//     // const ext = image.uri.split(".").pop();
//     // const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
//     // const filePath = `pets/${fileName}`;
//     // const mimeType = getMimeType(image.uri); // Asegúrate de que esta función retorne algo como "image/jpeg"

//     const fileUri = image.uri;
//     const ext = fileUri.split(".").pop();
//     const mimeType = getMimeType(fileUri);
//     const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

//     /* Sube a Storage */
//     const { error: storageError } = await uploadToStorage(
//       fileUri,
//       fileName,
//       mimeType
//     );
//     if (storageError) {
//       console.error("Error al subir a storage", storageError);
//       return null;
//     }

//     // console.log(image.uri);

//     // const response = await fetch(image.uri);
//     // const blob = await response.blob();

//     // if (!blob || blob.size === 0) {
//     //   console.error("El blob está vacío o inválido");
//     //   return null;
//     // }

//     // const { data: uploadData, error: uploadError } = await supabase.storage
//     //   .from("media")
//     //   .upload(filePath, blob, {
//     //     contentType: mimeType,
//     //     upsert: false,
//     //   });

//     // if (uploadError) {
//     //   console.error("Error al subir imagen:", uploadError);
//     //   return null;
//     // }

//     /* Obtiene URL pública */
//     const {
//       data: { publicUrl },
//     } = supabase.storage.from("media").getPublicUrl(fileName);

//     // const { data: publicUrlData } = supabase.storage
//     //   .from("media")
//     //   .getPublicUrl(filePath);

//     // const publicUrl = publicUrlData?.publicUrl;

//     if (!publicUrl) {
//       console.error("No se pudo obtener la URL pública");
//       return null;
//     }

//     // Insertar en media_pet
//     const { error: insertError } = await supabase.from("media_pet").insert([
//       {
//         source: publicUrl,
//         type: mimeType.startsWith("image") ? "image" : "video",
//         pet_id: petId,
//       },
//     ]);

//     if (insertError) {
//       console.error("Error al insertar en media_pet:", insertError);
//       return null;
//     }

//     return publicUrl;
//   };

//   const handleSubmit = async () => {
//     if (!name || !breed || !age || !city || !userId || !description) return;

//     setLoading(true);

//     const { data: petData, error } = await supabase
//       .from("pet")
//       .insert([
//         {
//           name: name,
//           description: description,
//           location: city,
//           likes: 0,
//           age: age,
//           breed: breed,
//           user_id: userId,
//         },
//       ])
//       .select()
//       .single();

//     if (error) {
//       console.error("Error al crear mascota:", error);
//       setLoading(false);
//       return;
//     }

//     await uploadImage(petData.id);

//     setLoading(false);
//     router.back(); // o navegar a otra pantalla
//   };

//   return (
//     <View className="flex-1 bg-white p-4">
//       <Stack.Screen
//         options={{
//           title: "Crear perfil de mascota 🐶",
//         }}
//       />

//       <Text className="text-lg font-semibold mb-2">Nombre</Text>
//       <TextInput
//         className="border p-2 rounded mb-3"
//         value={name}
//         onChangeText={setName}
//       />

//       <Text className="text-lg font-semibold mb-2">Raza</Text>
//       <TextInput
//         className="border p-2 rounded mb-3"
//         value={breed}
//         onChangeText={setBreed}
//       />

//       <Text className="text-lg font-semibold mb-2">Edad</Text>
//       <TextInput
//         className="border p-2 rounded mb-3"
//         value={age}
//         onChangeText={setAge}
//         keyboardType="numeric"
//       />

//       <Text className="text-lg font-semibold mb-2">Ciudad</Text>
//       <TextInput
//         className="border p-2 rounded mb-3"
//         value={city}
//         onChangeText={setCity}
//       />

//       <Text className="text-lg font-semibold mb-2">Descripcion</Text>
//       <TextInput
//         className="border p-2 rounded mb-3"
//         value={description}
//         onChangeText={setDescription}
//       />

//       <TouchableOpacity
//         onPress={pickImage}
//         className="bg-gray-200 p-2 rounded mb-3"
//       >
//         <Text className="text-center">
//           {image ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
//         </Text>
//       </TouchableOpacity>

//       {image && (
//         <Image
//           source={{ uri: image.uri }}
//           style={{
//             width: 100,
//             height: 100,
//             borderRadius: 10,
//             marginBottom: 10,
//           }}
//         />
//       )}

//       <TouchableOpacity
//         onPress={handleSubmit}
//         className="bg-blue-500 p-3 rounded"
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text className="text-white text-center font-semibold">
//             Crear perfil
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// }

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop";

const getMimeType = (uri) => {
  const ext = (uri.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "mp4") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  return "application/octet-stream";
};

export default function CreatePetProfile() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  // id interno de tu tabla "user"
  const [currentUserId, setCurrentUserId] = useState(null);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  const [media, setMedia] = useState(null); // { uri, ... }
  const [loading, setLoading] = useState(false);

  // 1) Resolver currentUserId (tabla user) desde Clerk user.id
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const fetchCurrentUserId = async () => {
      const { data, error } = await supabase
        .from("user")
        .select("id")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error obteniendo user interno:", error.message);
        return;
      }
      if (!data?.id) {
        console.warn("No existe fila en user para este clerk_id");
        return;
      }
      setCurrentUserId(data.id);
    };

    fetchCurrentUserId();
  }, [isLoaded, isSignedIn, user?.id]);

  const canSubmit = useMemo(() => {
    return (
      !!currentUserId &&
      name.trim().length > 0 &&
      breed.trim().length > 0 &&
      String(age).trim().length > 0 &&
      city.trim().length > 0 &&
      description.trim().length > 0 &&
      !loading
    );
  }, [currentUserId, name, breed, age, city, description, loading]);

  const askGalleryPerms = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return false;
    }
    return true;
  };

  const askCameraPerms = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara.");
      return false;
    }
    return true;
  };

  const pickFromGallery = useCallback(async () => {
    const ok = await askGalleryPerms();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // solo imagen para foto de perfil
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      setMedia(result.assets?.[0] || null);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const ok = await askCameraPerms();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      setMedia(result.assets?.[0] || null);
    }
  }, []);

  const uploadToStorage = async (fileUri, pathInBucket, mimeType) => {
    // Evita base64/atob: sube como ArrayBuffer
    const res = await fetch(fileUri);
    const arrayBuffer = await res.arrayBuffer();

    return supabase.storage.from("media").upload(pathInBucket, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });
  };

  const uploadPetProfileImage = async (petId) => {
    if (!media?.uri) return null;

    const fileUri = media.uri;
    const mimeType = getMimeType(fileUri);
    const ext = (fileUri.split(".").pop() || "jpg").toLowerCase();

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // Ruta ordenada en el bucket
    const storagePath = `pets/${currentUserId}/${petId}/${fileName}`;

    const { error: storageError } = await uploadToStorage(
      fileUri,
      storagePath,
      mimeType
    );

    if (storageError) {
      console.error("Error subiendo a storage:", storageError);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(storagePath);

    if (!publicUrl) return null;

    const { error: insertError } = await supabase.from("media_pet").insert([
      {
        source: publicUrl,
        type: mimeType.startsWith("image/") ? "image" : "video",
        pet_id: petId,
      },
    ]);

    if (insertError) {
      console.error("Error insertando en media_pet:", insertError);
      return null;
    }

    return publicUrl;
  };

  const handleSubmit = useCallback(async () => {
    if (!currentUserId) {
      Alert.alert("Error", "No se pudo obtener tu usuario en sesión.");
      return;
    }

    if (!name || !breed || !age || !city || !description) {
      Alert.alert("Faltan datos", "Completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      const { data: petData, error } = await supabase
        .from("pet")
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            location: city.trim(),
            likes: 0,
            age: String(age).trim(),
            breed: breed.trim(),
            user_id: currentUserId,
          },
        ])
        .select()
        .single();

      if (error || !petData?.id) {
        console.error("Error creando mascota:", error);
        Alert.alert("Error", "No se pudo crear la mascota.");
        return;
      }

      // subir imagen si hay
      await uploadPetProfileImage(petData.id);

      Alert.alert("Listo ✅", "Mascota creada correctamente.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [currentUserId, name, breed, age, city, description, media, router]);

  // loaders de auth
  if (!isLoaded) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Cargando usuario...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Debes iniciar sesión.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          title: "Nueva mascota",
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero / Card imagen */}
        <View className="mx-4 mt-4 bg-white rounded-3xl overflow-hidden shadow-sm">
          <Image
            source={{ uri: media?.uri || FALLBACK_IMAGE }}
            style={{ width: "100%", height: 220 }}
            resizeMode="cover"
          />
          <View className="p-4">
            <Text className="text-xl font-bold text-slate-800">
              Crea el perfil de tu mascota 🐾
            </Text>
            <Text className="text-slate-500 mt-1">
              Agrega foto y datos básicos para empezar.
            </Text>

            <View className="flex-row gap-x-3 mt-4">
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-1 bg-slate-900 rounded-2xl py-3"
                activeOpacity={0.9}
              >
                <Text className="text-center text-white font-semibold">
                  Tomar foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFromGallery}
                className="flex-1 bg-slate-200 rounded-2xl py-3"
                activeOpacity={0.9}
              >
                <Text className="text-center text-slate-800 font-semibold">
                  Elegir de galería
                </Text>
              </TouchableOpacity>
            </View>

            {!!media?.uri && (
              <Text className="text-xs text-slate-500 mt-3">
                Foto seleccionada ✅
              </Text>
            )}
          </View>
        </View>

        {/* Form */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm">
          <Text className="text-sm text-slate-500 mb-2">
            Información de la mascota
          </Text>

          {/* Nombre */}
          <Text className="text-sm font-semibold text-slate-700">Nombre</Text>
          <TextInput
            className="bg-slate-100 rounded-2xl px-4 py-3 mt-2 mb-3 text-slate-800"
            value={name}
            onChangeText={setName}
            placeholder="Ej: Rocky"
            placeholderTextColor="#94a3b8"
          />

          {/* Raza */}
          <Text className="text-sm font-semibold text-slate-700">Raza</Text>
          <TextInput
            className="bg-slate-100 rounded-2xl px-4 py-3 mt-2 mb-3 text-slate-800"
            value={breed}
            onChangeText={setBreed}
            placeholder="Ej: Labrador"
            placeholderTextColor="#94a3b8"
          />

          <View className="flex-row gap-x-3">
            {/* Edad */}
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700">Edad</Text>
              <TextInput
                className="bg-slate-100 rounded-2xl px-4 py-3 mt-2 mb-3 text-slate-800"
                value={age}
                onChangeText={setAge}
                placeholder="Ej: 3"
                placeholderTextColor="#94a3b8"
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              />
            </View>

            {/* Ciudad */}
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700">
                Ciudad
              </Text>
              <TextInput
                className="bg-slate-100 rounded-2xl px-4 py-3 mt-2 mb-3 text-slate-800"
                value={city}
                onChangeText={setCity}
                placeholder="Ej: Panamá"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Descripción */}
          <Text className="text-sm font-semibold text-slate-700">
            Descripción
          </Text>
          <TextInput
            className="bg-slate-100 rounded-2xl px-4 py-3 mt-2 text-slate-800"
            value={description}
            onChangeText={setDescription}
            placeholder="Cuéntanos algo de tu mascota..."
            placeholderTextColor="#94a3b8"
            multiline
            style={{ minHeight: 110, textAlignVertical: "top" }}
          />

          {/* Botón submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.9}
            className={`mt-4 rounded-2xl py-4 ${
              canSubmit ? "bg-orange-500" : "bg-orange-300"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-bold text-base">
                Crear perfil
              </Text>
            )}
          </TouchableOpacity>

          {!currentUserId && (
            <Text className="text-xs text-slate-500 mt-3">
              Preparando sesión… (resolviendo tu usuario)
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
