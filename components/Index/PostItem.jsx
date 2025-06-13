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

export function PostItem({ data, id, index, onHidePost, onReportPost }) {
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

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!liked) {
        addNotification({
          title: `Te ha gustado la publicación de ${data.name}`,
          nombre: data.name,
          imagen: data.imagen,
          logo: data.logo,
          tipo: "like",
          fecha: new Date().toISOString(),
        });
      }
      setLiked((prev) => {
        setLikeCount((count) => (prev ? count - 1 : count + 1));
        return !prev;
      });
    } else {
      lastTap.current = now;
    }
  };

  const handleOneTapLike = () => {
    if (!liked) {
      addNotification({
        title: `Te ha gustado la publicación de ${data.name}`,
        nombre: data.name,
        imagen: data.imagen,
        logo: data.logo,
        tipo: "like",
        fecha: new Date().toISOString(),
      });
    }
    setLiked((prev) => {
      setLikeCount((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleOneTapBookmark = () => setBookmark((prev) => !prev);

  const onTextLayout = (e) => {
    setShowVerMas(e.nativeEvent.lines.length > 2);
  };

  const imagesArray = Array.isArray(data.post)
    ? data.post.flatMap((post) =>
        Array.isArray(post.media)
          ? post.media
              .filter((item) => !!item.source)
              .map((item) => ({
                type: item.type,
                source: item.source,
              }))
          : []
      )
    : [];

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from("post").select("*");
      if (error) console.log(error);
      else {
        setPosts(data);
      }
    };
    fetchPosts();
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
                nombre: data.name,
                descripcion: data.description,
                ubicacion: data.location,
                pet_id: id,
                // imagen: data.imagen,
                // logo: data.logo,
              },
            })
          }
        >
          <Image
            className="w-10 h-10 rounded-full"
            source={{ uri: `${data.logo}` }}
          />
          <View className="flex-col">
            <Text className="text-gray-700 font-medium">{data.name}</Text>
            {/* <Text className="text-gray-400 font-normal">Hace 5 dias</Text> */}
            <Text className="text-gray-400 font-normal">
              {tiempoTranscurrido(data.post[0].created_at)}
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
          <Text className="text-gray-600 font-medium text-lg">{likeCount}</Text>
        </Pressable>
        <Pressable
          className="flex-row gap-2 justify-center items-center"
          onPress={() =>
            router.push({
              pathname: "indexScreens/comment",
              params: {
                index: index,
                nombre: data.name,
                descripcion: data.description,
                ubicacion: data.location,
                pet_id: id,
                // created_at: data.created_at,
                logo: data.logo,
              },
            })
          }
        >
          <MessageIcon color={"#374151"} size={24} />
          <Text className="text-gray-600 font-medium text-lg">
            {commentCount}
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
          {data.description}
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
