import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";

export function PostModal({
  visible,
  onClose,
  selectedPostIndex,
  onSave,
  onHidePost,
  onReport,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/40 justify-center items-center">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-2xl p-7">
                <Text
                  className="text-gray-800 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onSave(selectedPostIndex);
                    onClose();
                  }}
                >
                  Guardar
                </Text>
                <Text
                  className="text-gray-800 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onHidePost(selectedPostIndex);
                    onClose();
                  }}
                >
                  Ocultar
                </Text>
                <Text
                  className="text-red-600 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onReport(selectedPostIndex);
                    onClose();
                  }}
                >
                  Reportar Publicacion
                </Text>
                <Text
                  className="text-gray-500 text-center py-3 text-base font-semibold"
                  onPress={onClose}
                >
                  Cancelar
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
