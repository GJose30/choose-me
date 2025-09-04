import { Text, View, Image, Pressable } from "react-native";
import { Dots, Heart, MessageIcon, Bookmark } from "../Icon";
import { useState, useRef, useEffect } from "react";
import { PostModal } from "./PostModal";
import { useRouter } from "expo-router";
import { useNotifications } from "../../contexts/NotificationContext";
import { Slider } from "./Slider";
import { supabase } from "../../lib/supabase";

function tiempoTranscurrido(fechaISO) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const segundos = Math.floor((ahora - fecha) / 1000);

  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return "Hace unos segundos";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
  return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
}

export function PostItem({ dataPost, id, index, onHidePost, onReportPost }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const lastTap = useRef(null);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [bookmark, setBookmark] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVerMas, setShowVerMas] = useState(false);
  const { addNotification } = useNotifications();
  const [posts, setPosts] = useState([]);
  const notificationCount = 1;

  const fetchNotification = async () => {
    const { error } = await supabase.from("notification").insert([
      {
        user_id: dataPost.user_id,
        post_id: dataPost.id,
        notification_type: "like",
        message: "Tu mascota ha recibido un like",
        is_read: false,
      },
    ]);

    if (error) {
      console.error("Error al insertar la notificación:", error.message);
    } else {
      console.log("Notificación insertada correctamente:");
    }
  };

  const handleDoubleTap = async () => {
    try {
      if (!liked) {
        fetchNotification();

        // Obtener los likes actuales
        const { data, error } = await supabase
          .from("post")
          .select("likes")
          .eq("id", dataPost.id)
          .single();

        if (error) {
          console.error("Error obteniendo likes:", error.message);
          return;
        }

        // Actualizar con suma o resta
        const newLikes = data.likes + 1; // o -1

        const { error: updateError } = await supabase
          .from("post")
          .update({ likes: newLikes })
          .eq("id", dataPost.id);

        if (updateError) {
          console.error("Error actualizando likes:", updateError.message);
        }
      } else {
        // Obtener los likes actuales
        const { data, error } = await supabase
          .from("post")
          .select("likes")
          .eq("id", dataPost.id)
          .single();

        if (error) {
          console.error("Error obteniendo likes:", error.message);
          return;
        }

        // Actualizar con suma o resta
        const newLikes = data.likes - 1; // o -1

        const { error: updateError } = await supabase
          .from("post")
          .update({ likes: newLikes })
          .eq("id", dataPost.id);

        if (updateError) {
          console.error("Error actualizando likes:", updateError.message);
        }
      }

      setLiked(!liked);
    } catch (err) {
      console.error("Error actualizando likes:", err.message);
    }
  };

  const handleOneTapLike = async () => {
    try {
      if (!liked) {
        fetchNotification();

        // Obtener los likes actuales
        const { data, error } = await supabase
          .from("post")
          .select("likes")
          .eq("id", dataPost.id)
          .single();

        if (error) {
          console.error("Error obteniendo likes:", error.message);
          return;
        }

        // Actualizar con suma o resta
        const newLikes = data.likes + 1; // o -1

        const { error: updateError } = await supabase
          .from("post")
          .update({ likes: newLikes })
          .eq("id", dataPost.id);

        if (updateError) {
          console.error("Error actualizando likes:", updateError.message);
        }
      } else {
        // Obtener los likes actuales
        const { data, error } = await supabase
          .from("post")
          .select("likes")
          .eq("id", dataPost.id)
          .single();

        if (error) {
          console.error("Error obteniendo likes:", error.message);
          return;
        }

        // Actualizar con suma o resta
        const newLikes = data.likes - 1; // o -1

        const { error: updateError } = await supabase
          .from("post")
          .update({ likes: newLikes })
          .eq("id", dataPost.id);

        if (updateError) {
          console.error("Error actualizando likes:", updateError.message);
        }
      }

      setLiked(!liked);
    } catch (err) {
      console.error("Error actualizando likes:", err.message);
    }
  };

  const handleOneTapBookmark = () => setBookmark((prev) => !prev);

  const onTextLayout = (e) => {
    setShowVerMas(e.nativeEvent.lines.length > 2);
  };

  const imagesArray = Array.isArray(dataPost.media_post)
    ? dataPost.media_post.map((item) => ({
        type: item.type,
        source: item.source,
      }))
    : [];

  useEffect(() => {
    // console.log(data.likes);
    // console.log(dataPost.id);
  }, []);

  return (
    <View className="my-4">
      <View className="flex-row items-center mx-4">
        <Pressable
          className="flex-row gap-2 justify-center items-center"
          onPress={() =>
            router.push({
              pathname: "indexScreens/petProfile/[id]",
              params: {
                index: index,
                nombre: dataPost.pet.name,
                descripcion: dataPost.pet.description,
                ubicacion: dataPost.pet.location,
                profile_pic: dataPost.pet[0]?.media_pet.source,
                pet_id: id,
                // imagen: data.imagen,
                // logo: data.logo,
              },
            })
          }
        >
          <Image
            className="w-10 h-10 rounded-full"
            source={{ uri: `${dataPost.pet.logo}` }}
          />
          <View className="flex-col">
            <Text className="text-gray-700 font-medium">
              {dataPost.pet.name}
            </Text>
            <Text className="text-gray-400 font-normal">
              {tiempoTranscurrido(dataPost.created_at)}
            </Text>
          </View>
        </Pressable>
        <Pressable
          className="ml-auto"
          onPress={() => {
            setPostModalVisible(true);
          }}
        >
          <Dots color={"black"} size={22} />
        </Pressable>
        <PostModal
          visible={postModalVisible}
          onClose={() => setPostModalVisible(false)}
          selectedPostIndex={index}
          onSave={handleOneTapBookmark}
          onHidePost={onHidePost}
          onReport={onReportPost}
        />
      </View>
      <View className="mt-2">
        <Slider
          images={imagesArray}
          onHandleDoubleTap={() => handleDoubleTap()}
        />
      </View>
      <View className="flex-row gap-3 mt-2 mx-4">
        <Pressable
          onPress={handleOneTapLike}
          className="flex-row gap-1 items-center"
        >
          <Heart color={liked ? "red" : "#374151"} size={24} />
          <Text className="text-gray-600 font-medium text-lg">
            {dataPost.likes}
          </Text>
        </Pressable>
        <Pressable
          className="flex-row gap-2 justify-center items-center"
          onPress={() =>
            router.push({
              pathname: "indexScreens/comment",
              params: {
                index: dataPost.id,
                nombre: dataPost.pet.name,
                descripcion: dataPost.pet.description,
                ubicacion: dataPost.pet.location,
                pet_id: id,
                // created_at: data.created_at,
                logo: dataPost.pet.logo,
              },
            })
          }
        >
          <MessageIcon color={"#374151"} size={24} />
          <Text className="text-gray-600 font-medium text-lg">
            {dataPost.comments}
          </Text>
        </Pressable>

        <Pressable onPress={handleOneTapBookmark} className="ml-auto">
          <Bookmark color={bookmark ? "orange" : "#374151"} size={24} />
        </Pressable>
      </View>
      <Pressable onPress={() => setExpanded(!expanded)} className="mt-2 mx-4">
        <Text
          numberOfLines={expanded ? undefined : 2}
          onTextLayout={onTextLayout}
          className="text-gray-800"
        >
          {dataPost.description}
        </Text>
        {showVerMas && (
          <Text className="text-gray-500 font-light">
            {expanded ? "Ver menos" : "Ver más..."}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
