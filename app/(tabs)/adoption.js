import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, Dimensions, Pressable } from "react-native";
import Swiper from "react-native-deck-swiper";
import { supabase } from "../../lib/supabase";
import { Stack, Link, useRouter } from "expo-router";
import { Heart, Close, Paw, Info } from "../../components/Icon";
import { LinearGradient } from "expo-linear-gradient";

export default function Adoption() {
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const swiperRef = useRef(null);
  const [swipeMessage, setSwipeMessage] = useState("");
  const [canSwipe, setCanSwipe] = useState(true);
  const isManualSwipe = useRef(false);

  const fetchAdoptionPet = async () => {
    const { data, error } = await supabase.from("adoption_pet").select(`
      *,
      media_pet(
              *
      )
    `);
    if (error) {
      console.error("Error fetching media:", error.message);
    } else {
      // Filtrar mascotas que tengan al menos una imagen en media_pet
      const imageData = data.filter((item) =>
        item.media_pet?.some((media) => media.type === "image")
      );
      setMedia(imageData);
    }
  };

  // const handleSwipe = (direction) => {
  //   if (!canSwipe) return;

  //   setSwipeMessage(direction === "right" ? "¡Lo quiero!" : "No me interesa");
  //   isManualSwipe.current = true;
  //   setCanSwipe(false);

  //   setTimeout(() => {
  //     if (direction === "right") {
  //       swiperRef.current?.swipeRight();
  //     } else {
  //       swiperRef.current?.swipeLeft();
  //     }
  //   }, 200);

  //   setTimeout(() => {
  //     setSwipeMessage("");
  //     setCanSwipe(true);
  //     isManualSwipe.current = false;
  //   }, 1000);
  // };

  const handleSwipe = async (direction) => {
    if (!canSwipe) return;

    setSwipeMessage(direction === "right" ? "¡Lo quiero!" : "No me interesa");
    isManualSwipe.current = true;
    setCanSwipe(false);

    // 👇 Hacer insert si es swipe derecho desde botón
    if (direction === "right" && media[index]) {
      const adoption_pet_id = media[index].id;
      const user_id = "9b4fc3c3-df95-4763-b2b9-8449c78e9b3a";

      const { error } = await supabase
        .from("adoption_likes_pet")
        .insert([{ adoption_pet_id, user_id }]);

      if (error) {
        console.error("Error insertando like desde botón:", error.message);
      } else {
        console.log("Like insertado desde botón");
      }
    }

    // Ejecutar swipe visual
    setTimeout(() => {
      if (direction === "right") {
        swiperRef.current?.swipeRight();
      } else {
        swiperRef.current?.swipeLeft();
      }
    }, 200);

    setTimeout(() => {
      setSwipeMessage("");
      setCanSwipe(true);
      isManualSwipe.current = false;
    }, 1000);
  };

  const getAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    fetchAdoptionPet();
  }, []);

  useEffect(() => {
    if (swipeMessage !== "") {
      const timeout = setTimeout(() => {
        setSwipeMessage("");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [swipeMessage]);

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
      <LinearGradient
        colors={["#f97316", "#facc15"]}
        className="pt-8 h-52 px-4"
        style={{
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-3xl font-bold">Descubre</Text>
          <Link
            href={{
              pathname: "adoptionLikes/[id]",
              // params: {
              //   name: item.name,
              //   avatar: item.avatar,
              //   time: item.time,
              // },
            }}
            asChild
          >
            <Pressable
              className="bg-white/20 p-2 rounded-full"
              style={{
                zIndex: 100,
              }}
            >
              <Heart size={24} color="white" />
            </Pressable>
          </Link>
        </View>
      </LinearGradient>
      {media.length > 0 ? (
        <View className="flex-1 items-center justify-between">
          {swipeMessage !== "" && (
            <View
              style={{
                position: "absolute",
                top: 200,
                alignSelf: "center",
                backgroundColor:
                  swipeMessage === "¡Lo quiero!" ? "#34D399" : "#F87171",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                zIndex: 200,
              }}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
              >
                {swipeMessage}
              </Text>
            </View>
          )}
          {/* Swiper ocupando espacio vertical */}
          <Swiper
            ref={(c) => {
              swiperRef.current = c;
            }}
            cards={media}
            renderCard={(mediaItem) => (
              <View className="gap-y-2">
                <View
                  className="bg-white rounded-3xl shadow-md"
                  style={{
                    width: screenWidth - 32,
                    height: screenHeight * 0.5,
                    alignSelf: "center",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    // source={{ uri: mediaItem[0].source }}
                    source={{ uri: mediaItem.media_pet[0]?.source }}
                    className="w-full h-[80%] rounded-tl-3xl"
                    resizeMode="cover"
                  />
                  <View className="flex-row px-4 py-2">
                    <View>
                      <Text className="text-xl font-semibold text-gray-700">
                        {/* Buster Hernandez */}
                        {mediaItem.name}
                      </Text>
                      <Text className="text-base text-gray-600">
                        {/* {mediaItem.age} años */}
                        {getAge(mediaItem.birthdate)} años
                      </Text>
                      <Text className="text-base text-gray-400">
                        {/* Ciudad de Panama */}
                        {mediaItem.location}
                      </Text>
                    </View>
                    <View className="ml-auto items-center justify-center">
                      <Info color="#6b7280" size={30} />
                    </View>
                  </View>
                </View>
                <View className="flex-row justify-between p-3 bg-white rounded-3xl shadow-md">
                  <View className=" bg-white rounded-full px-3 border border-red-400 items-center justify-center">
                    <Text className="text-red-400 text-lg font-semibold">
                      {mediaItem.likes} Likes
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-center gap-x-2">
                    <Text className="text-xl text-gray-600 font-semibold">
                      Gil Arauz
                    </Text>
                    <Image
                      source={{
                        uri: "https://t4.ftcdn.net/jpg/04/31/64/75/360_F_431647519_usrbQ8Z983hTYe8zgA7t1XVc5fEtqcpa.jpg",
                      }}
                      className="w-12 h-12 rounded-full border-4 border-white"
                    />
                  </View>
                </View>
              </View>
            )}
            containerStyle={{
              marginTop: -140,
              flexGrow: 0,
              alignSelf: "center",
              zIndex: 1,
            }}
            onSwiping={(x, y) => {
              if (x < -50) {
                setSwipeMessage("No me interesa");
              } else if (x > 50) {
                setSwipeMessage("¡Lo quiero!");
              } else {
                setSwipeMessage("");
              }
            }}
            // onSwipedRight={(i) => {
            //   console.log(
            //     `Te gusto la mascota con post_id: ${media[i]?.post_id}`
            //   );
            //   setSwipeMessage("");
            // }}
            // onSwipedRight={async (i) => {
            //   const adoption_pet_id = media[i]?.id; // Asegúrate que este sea el campo correcto
            //   const user_id = "9b4fc3c3-df95-4763-b2b9-8449c78e9b3a";

            //   console.log(`Te gustó la mascota con id: ${adoption_pet_id}`);

            //   // Insertar like en la tabla
            //   const { error } = await supabase
            //     .from("adoption_likes_pet")
            //     .insert([
            //       {
            //         adoption_pet_id,
            //         user_id,
            //       },
            //     ]);

            //   if (error) {
            //     console.error("Error insertando like:", error.message);
            //   } else {
            //     console.log("Like guardado correctamente.");
            //   }

            //   setSwipeMessage("");
            // }}
            onSwipedRight={async (i) => {
              // 👇 No hagas nada si ya insertaste desde botón
              if (isManualSwipe.current) return;

              const adoption_pet_id = media[i]?.id;
              const user_id = "9b4fc3c3-df95-4763-b2b9-8449c78e9b3a";

              const { error } = await supabase
                .from("adoption_likes_pet")
                .insert([{ adoption_pet_id, user_id }]);

              if (error) {
                console.error(
                  "Error insertando like desde swipe:",
                  error.message
                );
              } else {
                console.log("Like guardado correctamente desde swipe.");
              }

              setSwipeMessage("");
            }}
            onSwipedLeft={(i) => {
              console.log(`Pasaste mascota con post_id: ${media[i]?.post_id}`);
              setSwipeMessage("");
            }}
            onSwipedTop={(i) => {
              console.log(
                `Adoptaste la mascota con post_id: ${media[i]?.post_id}`
              );
              alert("Me adoptaste");
              setSwipeMessage("");
            }}
            cardIndex={0}
            backgroundColor="transparent"
            stackSize={1}
            stackSeparation={0}
            animateCardOpacity
            disableBottomSwipe
            onSwiped={(i) => {
              setSwipeMessage("");
              setIndex(i + 1);
            }}
          />

          {/* Botones debajo del Swiper */}

          <View
            className="flex-row items-center justify-center gap-x-5"
            style={{
              position: "absolute",
              bottom: 50,
              left: 0,
              right: 0,
              zIndex: 100,
            }}
          >
            <Pressable
              className="bg-red-500 rounded-full shadow-md items-center justify-center size-20"
              onPress={() => handleSwipe("left")}
            >
              <Close size={40} color="white" />
            </Pressable>

            <Pressable
              className="bg-[#FE9B5C] rounded-full shadow-md items-center justify-center size-24"
              onPress={() => alert("Me adoptaste")}
            >
              <Paw size={42} color="white" />
            </Pressable>

            {/* <Pressable
              className="bg-yellow-400 rounded-full shadow-md items-center justify-center size-20"
              onPress={() => handleSwipe("right")}
            >
              <Heart size={40} color="white" />
            </Pressable> */}
            <Pressable
              className="bg-yellow-400 rounded-full shadow-md items-center justify-center size-20"
              onPress={() => handleSwipe("right")}
            >
              <Heart size={40} color="white" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Text className="text-gray-500 text-lg text-center mt-6">
          Cargando mascotas...
        </Text>
      )}
    </View>
  );
}
