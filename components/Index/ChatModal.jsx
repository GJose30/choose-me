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
import { Close } from "../Icon"; // ajusta la ruta según tu proyecto

export function ChatModal({ visible, onClose, onBlock, onReport }) {
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
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Fondo oscurecido */}
        <TouchableWithoutFeedback onPress={cerrarModalConAnimacion}>
          <View className="flex-1 bg-black/20 justify-end">
            {/* Contenedor del sheet: evita que el toque se propague */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={{
                  transform: [{ translateY: slideAnim }],
                }}
                className="bg-white rounded-t-2xl w-full pb-6"
              >
                {/* Handler superior */}
                <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-3" />

                {/* Título + botón cerrar */}
                {/* <View className="flex-row justify-between items-center px-4 mb-2">
                  <Text className="text-lg font-semibold text-gray-800">
                    Opciones del chat
                  </Text>
                  <Pressable onPress={cerrarModalConAnimacion}>
                    <Close size={24} />
                  </Pressable>
                </View> */}

                {/* Opciones */}
                <View className="mt-2">
                  <Pressable className="px-4 py-3" onPress={handleReport}>
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
