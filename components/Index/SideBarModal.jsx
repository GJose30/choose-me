import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, Calendar, Settings, Group, Newspaper, LogOut } from "../Icon";

export function SideBarModal({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/40 flex-row">
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={{
                  transform: [{ translateX: slideAnim }],
                }}
                className="w-2/3"
              >
                <SafeAreaView className="flex-1 ">
                  <View className="flex-1 bg-white">
                    {/* Contenido del sidebar */}
                    <View className="flex-1 px-3 pt-7">
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Perfil */}
                        <View className="flex-row items-center mb-4 px-3">
                          <Image
                            source={{
                              uri: "https://randomuser.me/api/portraits/men/32.jpg",
                            }}
                            className="w-12 h-12 rounded-full"
                          />
                          <View className="ml-4">
                            <Text className="text-lg font-semibold text-gray-800">
                              Gil Araúz
                            </Text>
                            <Text className="text-base text-gray-500">
                              Ver perfil
                            </Text>
                          </View>
                        </View>

                        {/* Menú de navegación */}
                        <View className="gap-2">
                          <Pressable>
                            {({ pressed }) => (
                              <View
                                className={`rounded-md flex-row items-center p-3 ${pressed ? "bg-gray-200" : ""}`}
                              >
                                <Home size={21} color="#4b5563" />
                                <Text className="text-gray-600 text-lg font-semibold ml-2">
                                  Inicio
                                </Text>
                              </View>
                            )}
                          </Pressable>
                          <Pressable>
                            {({ pressed }) => (
                              <View
                                className={`rounded-md flex-row items-center p-3 ${pressed ? "bg-gray-200" : ""}`}
                              >
                                <Calendar size={21} color="#4b5563" />
                                <Text className="text-gray-600 text-lg font-semibold ml-2">
                                  Eventos
                                </Text>
                              </View>
                            )}
                          </Pressable>
                          <Pressable>
                            {({ pressed }) => (
                              <View
                                className={`rounded-md flex-row items-center p-3 ${pressed ? "bg-gray-200" : ""}`}
                              >
                                <Group size={21} color="#4b5563" />
                                <Text className="text-gray-600 text-lg font-semibold ml-2">
                                  Grupos
                                </Text>
                              </View>
                            )}
                          </Pressable>
                          <Pressable>
                            {({ pressed }) => (
                              <View
                                className={`rounded-md flex-row items-center p-3 ${pressed ? "bg-gray-200" : ""}`}
                              >
                                <Newspaper size={21} color="#4b5563" />
                                <Text className="text-gray-600 text-lg font-semibold ml-2">
                                  Noticias
                                </Text>
                              </View>
                            )}
                          </Pressable>
                          <Pressable>
                            {({ pressed }) => (
                              <View
                                className={`rounded-md flex-row items-center p-3 ${pressed ? "bg-gray-200" : ""}`}
                              >
                                <Settings size={21} color="#4b5563" />
                                <Text className="text-gray-600 text-lg font-semibold ml-2">
                                  Configuraciones
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        </View>
                      </ScrollView>
                    </View>

                    {/* Botón de Cerrar sesión al fondo */}
                    <View className="px-6 mb-8">
                      <Pressable
                        onPress={onClose}
                        className="flex-row items-center"
                      >
                        <LogOut size={21} color="#4b5563" />
                        <Text className="text-gray-600 text-lg font-semibold ml-2">
                          Cerrar sesión
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </SafeAreaView>
              </Animated.View>
            </TouchableWithoutFeedback>

            {/* Parte oscura que cierra */}
            <TouchableWithoutFeedback onPress={onClose}>
              <View className="flex-1" />
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
