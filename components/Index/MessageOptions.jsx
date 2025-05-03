import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";

export function MessageOptions({
  visible,
  onClose,
  selectedCommentIndex,
  onDelete,
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
          <View className="flex-1 bg-black/40 justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-2xl p-4">
                <Text
                  className="text-gray-800 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onDelete(selectedCommentIndex);
                    onClose();
                  }}
                >
                  Eliminar
                </Text>
                <Text
                  className="text-red-600 text-center py-3 text-base font-semibold"
                  onPress={() => {
                    onReport(selectedCommentIndex);
                    onClose();
                  }}
                >
                  Reportar Comentario
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
