import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Animated,
  Image,
} from "react-native";
import { Close, Heart, Dots, Bookmark, MessageIcon } from "../Icon";
import { MessageOptions } from "./MessageOptions";
import { Slider } from "./Slider";
import { PostModal } from "./PostModal";
import { useRouter } from "expo-router";

export function MessageModal({
  visible,
  onClose,
  onCommentsChange,
  handleOneTapLike,
  handleDoubleTap,
  handleOneTapBookmark,
  data,
  index,
  liked,
  bookmark,
  onHidePost,
  onReportPost,
}) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVerMas, setShowVerMas] = useState(false);

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

    if (onCommentsChange) {
      onCommentsChange(updatedComments.length);
    }
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

    if (onCommentsChange) {
      onCommentsChange(updated.length);
    }
  };

  const reportarComentario = (index) => {
    const item = comments[index];
    alert(`Comentario reportado ${item.user}: "${item.text}"`);
  };

  const slideAnim = useRef(new Animated.Value(300)).current;

  const cerrarModalConAnimacion = () => {
    Animated.timing(slideAnim, {
      toValue: 800,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const onTextLayout = (e) => {
    setShowVerMas(e.nativeEvent.lines.length > 2);
  };

  const imagesArray = Array.isArray(data?.media)
    ? data.media.filter((item) => item && item.fuente)
    : data?.media?.fuente
      ? [{ tipo: data.media.tipo, fuente: data.media.fuente }]
      : [];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={cerrarModalConAnimacion}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={cerrarModalConAnimacion}>
          <View className="flex-1 bg-black/20 justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={{
                  transform: [{ translateY: slideAnim }],
                }}
                className="bg-white rounded-t-2xl max-h-[92%] w-full"
              >
                <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-4" />
                <View className="flex-row justify-between items-center mb-4 mx-4">
                  <Text className="text-lg font-semibold text-gray-800">
                    Comentarios
                  </Text>
                  <Pressable onPress={cerrarModalConAnimacion}>
                    <Close size={27} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  <View>
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
                              modal: true,
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
                          <Text className="text-gray-700 font-medium">
                            {data.nombre}
                          </Text>
                          <Text className="text-gray-400 font-normal">
                            Hace 5 dias
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
                      <Pressable
                        onPress={handleOneTapBookmark}
                        className="ml-auto"
                      >
                        <Bookmark
                          color={bookmark ? "orange" : "#374151"}
                          size={24}
                        />
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
                          <Text className="text-blue-600 font-semibold">
                            Enviar
                          </Text>
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
                              <Heart
                                size={18}
                                color={item.liked ? "red" : "#374151"}
                              />
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
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
