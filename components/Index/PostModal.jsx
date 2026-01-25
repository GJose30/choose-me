import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Animated,
  Pressable,
} from "react-native";

export function PostModal({
  visible,
  onClose,
  selectedPostIndex,
  onSave,
  onHidePost,
  onReport,

  // permisos + acciones
  canDelete,
  onDelete,

  // ✅ NUEVO
  canEdit,
  onEdit,
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  const cerrarModalConAnimacion = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
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
  }, [visible, slideAnim]);

  const Item = ({ text, danger, onPress }) => (
    <Pressable
      onPress={onPress}
      className="py-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
      }}
    >
      <Text
        className={`text-center text-base font-semibold ${
          danger ? "text-red-600" : "text-gray-800"
        }`}
      >
        {text}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="none"
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
                className="bg-white rounded-t-2xl px-4"
              >
                {/* ✅ NUEVO: Editar (solo dueño) */}
                {canEdit ? (
                  <Item
                    text="Editar publicación"
                    onPress={() => {
                      cerrarModalConAnimacion();
                      onEdit?.(selectedPostIndex);
                    }}
                  />
                ) : null}

                <Item
                  text="Guardar"
                  onPress={async () => {
                    try {
                      await onSave?.();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      cerrarModalConAnimacion();
                    }
                  }}
                />

                <Item
                  text="Ocultar"
                  onPress={() => {
                    onHidePost?.(selectedPostIndex);
                    cerrarModalConAnimacion();
                  }}
                />

                {canDelete ? (
                  <Item
                    text="Eliminar publicación"
                    danger
                    onPress={() => {
                      // tu confirm + delete lo hace onDelete
                      cerrarModalConAnimacion();
                      onDelete?.();
                    }}
                  />
                ) : null}

                <Item
                  text="Reportar Publicación"
                  danger
                  onPress={() => {
                    onReport?.(selectedPostIndex);
                    cerrarModalConAnimacion();
                  }}
                />

                <Pressable onPress={cerrarModalConAnimacion} className="py-4">
                  <Text className="text-gray-500 text-center text-base font-semibold">
                    Cancelar
                  </Text>
                </Pressable>

                <View className="h-4" />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
