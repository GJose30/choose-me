import {
  Modal,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Home,
  Calendar,
  Settings,
  Group,
  Newspaper,
  LogOut,
  Market,
} from "../Icon";
import { Link } from "expo-router";

export function SideBarModal({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const cerrarModalConAnimacion = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-300);
      Animated.timing(slideAnim, {
        toValue: 0,
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
      onRequestClose={cerrarModalConAnimacion}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <TouchableWithoutFeedback onPress={cerrarModalConAnimacion}>
            <View className="flex-1 bg-black/20 flex-row">
              <TouchableWithoutFeedback onPress={() => {}}>
                <Animated.View
                  style={{
                    transform: [{ translateX: slideAnim }],
                  }}
                  className="w-2/3"
                >
                  <View className="flex-1 bg-white">
                    {/* Contenido del sidebar */}
                    <View className="flex-1 px-3 pt-7">
                      {/* Perfil */}
                      <Link
                        href={{
                          pathname: "(tabs)/profile",
                        }}
                        asChild
                      >
                        <Pressable
                          className="flex-row items-center mb-4 px-3"
                          onPress={onClose}
                        >
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
                        </Pressable>
                      </Link>

                      {/* Menú de navegación */}
                      <View className="gap-2">
                        <Link
                          href={{
                            pathname: "(tabs)",
                          }}
                          asChild
                        >
                          <Pressable onPress={onClose}>
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
                        </Link>
                        <Link
                          href={{
                            pathname: "Sidebar/market/index",
                          }}
                          asChild
                        >
                          <Pressable onPress={onClose}>
                            {({ pressed }) => (
                              <View
                                className={`rounded-md flex-row items-center p-3 ${pressed ? "bg-gray-200" : ""}`}
                              >
                                <Market size={21} color="#4b5563" />
                                <Text className="text-gray-600 text-lg font-semibold ml-2">
                                  Tienda
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        </Link>
                        <Link
                          href={{
                            pathname: "Sidebar/events/index",
                          }}
                          asChild
                        >
                          <Pressable onPress={onClose}>
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
                        </Link>
                        <Link
                          href={{
                            pathname: "Sidebar/groups/index",
                          }}
                          asChild
                        >
                          <Pressable onPress={onClose}>
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
                        </Link>
                        <Link
                          href={{
                            pathname: "Sidebar/news/index",
                          }}
                          asChild
                        >
                          <Pressable onPress={onClose}>
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
                        </Link>
                        <Link
                          href={{
                            pathname: "Sidebar/configuration/index",
                          }}
                          asChild
                        >
                          <Pressable onPress={onClose}>
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
                        </Link>
                      </View>
                    </View>

                    {/* Botón de Cerrar sesión al fondo */}
                    <View className="px-6 mb-8">
                      <Pressable
                        onPress={cerrarModalConAnimacion}
                        className="flex-row items-center"
                      >
                        <LogOut size={21} color="#4b5563" />
                        <Text className="text-gray-600 text-lg font-semibold ml-2">
                          Cerrar sesión
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
