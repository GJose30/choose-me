import { useRef, useState } from "react";
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

const Post = [
  {
    nombre: "Buster Hernandez",
    descripcion:
      "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad. Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
    logo: "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
    media: [
      {
        tipo: "image",
        fuente:
          "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
      },
      {
        tipo: "image",
        fuente:
          "https://images.ctfassets.net/denf86kkcx7r/76LfU7b9ixCa7W2Wj579AZ/9b80697718ff08853ad7388e08c4bfd6/shutterstock_2502183265.jpg?fm=webp&w=550",
      },
      {
        tipo: "video",
        fuente:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ],
  },
  {
    nombre: "Kitty Garcia",
    descripcion:
      "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
    logo: "https://urgenciesveterinaries.com/wp-content/uploads/2023/09/survet-gato-caida-pelo-01.jpeg",
    media: [
      {
        tipo: "image",
        fuente:
          "https://urgenciesveterinaries.com/wp-content/uploads/2023/09/survet-gato-caida-pelo-01.jpeg",
      },
    ],
  },
  {
    nombre: "Leo Panthera",
    descripcion:
      "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
    logo: "https://purina.com.pa/sites/default/files/2022-11/purina-brand-cuanto-vive-un-gato-nota_03.jpg",
    media: [
      {
        tipo: "image",
        fuente:
          "https://purina.com.pa/sites/default/files/2022-11/purina-brand-cuanto-vive-un-gato-nota_03.jpg",
      },
    ],
  },
  {
    nombre: "Charly Anthonio",
    descripcion:
      "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
    logo: "https://okdiario.com/img/2025/04/08/el-significado-de-que-tu-perro-te-chupe-los-pies-sin-parar-635x358.jpg",
    media: [
      {
        tipo: "image",
        fuente:
          "https://okdiario.com/img/2025/04/08/el-significado-de-que-tu-perro-te-chupe-los-pies-sin-parar-635x358.jpg",
      },
    ],
  },
  {
    nombre: "Benito Sanchez",
    descripcion:
      "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
    logo: "https://vitakraft.es/wp-content/uploads/2020/12/Blog_HistoriaPerros-1110x600.jpg",
    media: [
      {
        tipo: "image",
        fuente:
          "https://vitakraft.es/wp-content/uploads/2020/12/Blog_HistoriaPerros-1110x600.jpg",
      },
    ],
  },
];

export default function Message() {
  const { index } = useLocalSearchParams();
  const router = useRouter();
  const data = Post[index];
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

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const updatedComments = [
      {
        user: "Tú",
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
        liked: false,
        likedCount: 0,
      },
      ...comments,
    ];

    setComments(updatedComments);
    setNewComment("");
  };

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

  const imagesArray = Array.isArray(data?.media)
    ? data.media.filter((item) => item && item.fuente)
    : data?.media?.fuente
      ? [{ tipo: data.media.tipo, fuente: data.media.fuente }]
      : [];

  const onHidePost = (i) => {
    const updated = [...data];
    updated.splice(i, 1);
  };

  const onReportPost = (i) => {
    alert(`Publicación reportada: ${data.nombre}`);
  };

  const handleOneTapLike = () => {
    if (!liked) {
      addNotification({
        title: `Te ha gustado la publicación de ${data.nombre}`,
        nombre: data.nombre,
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

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!liked) {
        addNotification({
          title: `Te ha gustado la publicación de ${data.nombre}`,
          nombre: data.nombre,
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
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    imagen: data.imagen,
                    logo: data.logo,
                  },
                });
              }}
              className="flex-row gap-2 justify-center items-center"
            >
              <View>
                <Image
                  className="w-10 h-10 rounded-full"
                  source={{ uri: `${data.logo}` }}
                />
              </View>
              <View className="flex-col">
                <Text className="text-gray-700 font-medium">{data.nombre}</Text>
                <Text className="text-gray-400 font-normal">Hace 5 dias</Text>
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
              {data.descripcion}
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
