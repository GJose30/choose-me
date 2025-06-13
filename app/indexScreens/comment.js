import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { Heart, Dots, Bookmark, MessageIcon } from "../../components/Icon";
import { MessageOptions } from "../../components/Index/MessageOptions";
import { Slider } from "../../components/Index/Slider";
import { PostModal } from "../../components/Index/PostModal";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useNotifications } from "../../contexts/NotificationContext";
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

export default function Message() {
  const { index, nombre, descripcion, ubicacion, pet_id, created_at, logo } =
    useLocalSearchParams();
  const router = useRouter();
  // const data = Post[index];
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVerMas, setShowVerMas] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmark, setBookmark] = useState(false);
  const lastTap = useRef(null);
  const { addNotification } = useNotifications();
  const [post, setPost] = useState([]);

  // const handleAddComment = () => {
  //   if (newComment.trim() === "") return;

  //   const updatedComments = [
  //     {
  //       user: "Tú",
  //       text: newComment.trim(),
  //       createdAt: new Date().toISOString(),
  //       liked: false,
  //       likedCount: 0,
  //     },
  //     ...comments,
  //   ];

  //   setComments(updatedComments);
  //   setNewComment("");
  // };

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;

    const user = await supabase.auth.getUser(); // Asegúrate de tener autenticación habilitada
    const userId = user.data?.user?.id;

    console.log(user);

    if (!userId) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }

    const { error } = await supabase.from("comment").insert([
      {
        content: newComment.trim(),
        post_id: post[0]?.id, // Asegúrate de que `post[0]` contiene el post correcto
        user_id: userId,
      },
    ]);

    if (error) {
      console.error("Error al agregar comentario:", error.message);
      alert("Hubo un error al enviar el comentario.");
      return;
    }

    setComments((prev) => [
      {
        user: "Tú", // O puedes traer el username del usuario
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
        liked: false,
        likedCount: 0,
      },
      ...prev,
    ]);

    setNewComment("");
  };

  useEffect(() => {
    fetchPost();
    // handleAddComment();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("es-PA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLike = (index) => {
    const updated = [...comments];
    updated[index].liked = !updated[index].liked;
    updated[index].likedCount = updated[index].liked
      ? updated[index].likedCount + 1
      : updated[index].likedCount - 1;
    setComments(updated);
  };

  const borrarComentario = (index) => {
    const updated = [...comments];
    updated.splice(index, 1);
    setComments(updated);
  };

  const reportarComentario = (index) => {
    const item = comments[index];
    alert(`Comentario reportado ${item.user}: "${item.text}"`);
  };

  const onTextLayout = (e) => {
    setShowVerMas(e.nativeEvent.lines.length > 2);
  };

  const imagesArray = Array.isArray(post[0]?.media)
    ? post[0]?.media.filter((item) => item && item.source)
    : post[0]?.media?.source
      ? [{ type: post[0]?.media.type, source: post[0]?.media.source }]
      : [];

  const onHidePost = (i) => {
    // const updated = [...data];
    // updated.splice(i, 1);
  };

  const onReportPost = (i) => {
    alert(`Publicación reportada: ${nombre}`);
  };

  const handleOneTapLike = () => {
    if (!liked) {
      addNotification({
        title: `Te ha gustado la publicación de ${nombre}`,
        nombre: nombre,
        // imagen: data.imagen,
        logo: logo,
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

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!liked) {
        addNotification({
          title: `Te ha gustado la publicación de ${nombre}`,
          nombre: logo,
          // imagen: data.imagen,
          logo: logo,
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

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("post")
      .select(
        `
        *,
        media(
          *
        ),
        comment(
          *
        )
      `
      )
      .eq("pet_id", pet_id);
    if (error) {
      console.error("Error fetching posts:", error.message);
    } else {
      setPost(data);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Comentarios",
        }}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="py-4">
          <View className="flex-row items-center mx-4">
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "indexScreens/petProfile/[id]",
                  params: {
                    index: index,
                    nombre: nombre,
                    descripcion: descripcion,
                    // imagen: data.imagen,
                    logo: logo,
                  },
                });
              }}
              className="flex-row gap-2 justify-center items-center"
            >
              <View>
                <Image
                  className="w-10 h-10 rounded-full"
                  source={{ uri: `${logo}` }}
                />
              </View>
              <View className="flex-col">
                <Text className="text-gray-700 font-medium">{nombre}</Text>
                <Text className="text-gray-400 font-normal">
                  {tiempoTranscurrido(post[0]?.created_at)}
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
            </Pressable>
            <Pressable className="flex-row gap-1 items-center">
              <MessageIcon color={"#374151"} size={24} />
            </Pressable>
            <Pressable onPress={handleOneTapBookmark} className="ml-auto">
              <Bookmark color={bookmark ? "orange" : "#374151"} size={24} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => setExpanded(!expanded)}
            className="mt-2 mx-4"
          >
            <Text
              numberOfLines={expanded ? undefined : 2}
              onTextLayout={onTextLayout}
              className="text-gray-800"
            >
              {descripcion}
            </Text>
            {showVerMas && (
              <Text className="text-gray-500 font-light">
                {expanded ? "Ver menos" : "Ver más..."}
              </Text>
            )}
          </Pressable>

          <ScrollView
            className="my-4 mx-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="flex-row items-center border-t border-gray-200 pt-2 mb-4">
              <TextInput
                placeholder="Agregar un comentario..."
                value={newComment}
                onChangeText={setNewComment}
                className="flex-1 text-base px-3 py-2 bg-gray-100 rounded-full mr-2"
              />
              <Pressable onPress={handleAddComment}>
                <Text className="text-blue-600 font-semibold">Enviar</Text>
              </Pressable>
            </View>
            {comments.map((item, index) => (
              <Pressable
                key={index}
                onLongPress={() => {
                  setSelectedIndex(index);
                  setOptionsVisible(true);
                }}
              >
                <View className="mb-3 flex-row items-center">
                  <View>
                    <Text className="text-gray-800 font-medium">
                      {item.user}
                    </Text>
                    <Text className="text-gray-600">{item.text}</Text>
                    <Text className="text-gray-400 text-sm">
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleLike(index)}
                    className="ml-auto flex-row gap-1 items-center justify-center"
                  >
                    <Heart size={18} color={item.liked ? "red" : "#374151"} />
                    <Text className="text-gray-600 font-medium">
                      {item.likedCount}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
            {/* Opciones del mensaje */}
            <MessageOptions
              visible={optionsVisible}
              onClose={() => setOptionsVisible(false)}
              selectedCommentIndex={selectedIndex}
              onDelete={borrarComentario}
              onReport={reportarComentario}
            />
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
