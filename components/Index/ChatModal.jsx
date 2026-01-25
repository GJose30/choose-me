import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";

export function ChatModal({ visible, onClose, onBlock, onReport }) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(300)).current;

  const cerrarModalConAnimacion = () => {
    Animated.timing(slideAnim, {
      toValue: 800,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose && onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCreateGroup = () => {
    cerrarModalConAnimacion();
    // ajusta el path a donde vayas a crear la pantalla
    router.push("chat/createGroup");
  };

  const handleReport = () => {
    onReport && onReport();
    cerrarModalConAnimacion();
  };

  const handleBlock = () => {
    onBlock && onBlock();
    cerrarModalConAnimacion();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={cerrarModalConAnimacion}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={cerrarModalConAnimacion}>
          <View className="flex-1 bg-black/20 justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={{ transform: [{ translateY: slideAnim }] }}
                className="bg-white rounded-t-2xl w-full pb-6"
              >
                <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-3" />

                <View className="mt-2">
                  <Pressable className="px-4 py-3" onPress={handleCreateGroup}>
                    <Text className="text-red-500 font-semibold text-base">
                      Crear Grupo
                    </Text>
                  </Pressable>

                  <View className="h-[1px] bg-gray-200 mx-4" />

                  <Pressable className="px-4 py-3" onPress={handleBlock}>
                    <Text className="text-gray-800 font-semibold text-base">
                      Ajuste
                    </Text>
                  </Pressable>

                  <View className="h-[1px] bg-gray-200 mx-4 mt-2" />

                  <Pressable
                    className="px-4 py-3"
                    onPress={cerrarModalConAnimacion}
                  >
                    <Text className="text-gray-500 text-center text-base">
                      Cancelar
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
