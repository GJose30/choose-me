import React from "react";
import { Image, View, Dimensions, StyleSheet } from "react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";

export function SliderItem({ item }) {
  const screenWidth = Dimensions.get("window").width;
  const horizontalMargin = 16;
  const itemWidth = screenWidth - horizontalMargin * 2;

  const isVideo = item.tipo === "video";

  const player = useVideoPlayer(item.fuente, (player) => {
    player.loop = true;
    player.play(); // evita autoplay
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  return (
    <View
      style={{
        width: itemWidth,
        marginHorizontal: horizontalMargin,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isVideo ? (
        <VideoView
          style={styles.video}
          //   className="shadow-2xl"
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          startsPictureInPictureAutomatically
        />
      ) : (
        <Image
          source={{ uri: item.fuente }}
          className="w-full h-[400px] rounded-2xl"
          resizeMode="cover"
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: 400,
    borderRadius: 16,
  },
});
