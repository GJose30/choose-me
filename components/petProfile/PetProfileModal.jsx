import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";

export function PetProfileModal({
  visible,
  onClose,
  selectedProfileIndex,
  onReport,
  onDeletePet, // <-- NUEVO
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  const cerrarModalConAnimacion = () => {
    Animated.timing(slideAnim, {
      toValue: 600,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={cerrarModalConAnimacion}
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
                className="bg-white rounded-t-2xl p-4"
              >
                {/* Existente: Reportar */}
                <Text
                  className="text-red-600 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onReport(selectedProfileIndex);
                    cerrarModalConAnimacion();
                  }}
                >
                  Reportar Comentario
                </Text>

                {/* Cancelar */}
                <Text
                  className="text-gray-500 text-center py-3 text-base font-semibold"
                  onPress={cerrarModalConAnimacion}
                >
                  Cancelar
                </Text>

                {/* NUEVO: Eliminar mascota */}
                <Text
                  className="text-red-700 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onDeletePet?.(selectedProfileIndex); // <-- llama al callback
                    cerrarModalConAnimacion();
                  }}
                >
                  Eliminar mascota
                </Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
