import React, { useState } from "react";
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
} from "react-native";
import { Close, Heart } from "../Icon";
import { MessageOptions } from "./MessageOptions";

export function MessageModal({ visible, onClose, onCommentsChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const updatedComments = [
      ...comments,
      {
        user: "Tú",
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
        liked: false,
        likedCount: 0,
      },
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        onClose();
      }}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              {/* <View className="flex-1 justify-end bg-black/50"> */}
              <View className="bg-white rounded-t-2xl p-4 max-h-[80%] w-full">
                <View>
                  <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-semibold text-gray-800">
                      Comentarios
                    </Text>
                    <Pressable onPress={onClose}>
                      <Close size={27} />
                    </Pressable>
                  </View>
                  <ScrollView
                    className="mb-4"
                    showsVerticalScrollIndicator={false}
                  >
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
                  <View className="flex-row items-center border-t border-gray-200 pt-2">
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
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
          {/* </View> */}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
