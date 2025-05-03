import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  FlatList,
  ScrollView,
} from "react-native";

const mockUsers = [
  { id: 1, name: "Gil Arauz", avatar: "https://i.pravatar.cc/100?img=1" },
  { id: 2, name: "Happy Feet", avatar: "https://i.pravatar.cc/100?img=2" },
  { id: 3, name: "Michi Lover", avatar: "https://i.pravatar.cc/100?img=3" },
];

const socialNetworks = [
  {
    id: 1,
    name: "Facebook",
    icon: "https://cdn-icons-png.flaticon.com/512/124/124010.png",
  },
  {
    id: 2,
    name: "Messenger",
    icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png",
  },
  {
    id: 3,
    name: "WhatsApp",
    icon: "https://cdn-icons-png.flaticon.com/512/124/124034.png",
  },
  {
    id: 4,
    name: "Twitter",
    icon: "https://cdn-icons-png.flaticon.com/512/124/124021.png",
  },
];

export function PetShareModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/40 justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-3xl p-6 pb-10 w-full">
                {/* Título */}
                <Text className="text-center text-lg font-bold mb-6 text-gray-800">
                  Compartir publicación
                </Text>

                {/* Usuarios */}
                <FlatList
                  data={mockUsers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-4">
                        <Image
                          source={{ uri: item.avatar }}
                          className="w-10 h-10 rounded-full"
                        />
                        <Text className="text-gray-700 font-medium text-base">
                          {item.name}
                        </Text>
                      </View>
                      <Pressable className="bg-[#0095f6] px-5 py-2 rounded-full">
                        <Text className="text-white font-bold">Enviar</Text>
                      </Pressable>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                />

                {/* Divider */}
                <View className="h-[1px] bg-gray-300 my-4" />

                {/* Redes Sociales */}
                <Text className="text-gray-500 text-base font-medium mb-4">
                  Compartir en...
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-6"
                >
                  {socialNetworks.map((network) => (
                    <View key={network.id} className="items-center mr-6">
                      <Pressable className="bg-gray-100 p-3 rounded-full">
                        <Image
                          source={{ uri: network.icon }}
                          className="w-10 h-10"
                        />
                      </Pressable>
                      <Text className="text-sm mt-2 text-gray-600">
                        {network.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Cancelar */}
                <Pressable
                  className="mt-8 w-full py-4 bg-gray-200 rounded-full items-center"
                  onPress={onClose}
                >
                  <Text className="text-gray-600 font-semibold text-base">
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
