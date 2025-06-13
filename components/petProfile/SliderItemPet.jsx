import { Image, View, Dimensions, StyleSheet } from "react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";

export function SliderItemPet({ item }) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const isVideo = item.type === "video";

  const player = useVideoPlayer(item.source, (player) => {
    player.loop = true;
    player.play();
  });

  useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  return (
    <View style={{ width: screenWidth, height: screenHeight * 0.5 }}>
      {isVideo ? (
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          startsPictureInPictureAutomatically
        />
      ) : (
        <Image
          source={{ uri: item.source }}
          className="w-full h-full"
          resizeMode="cover"
        />
      )}

      {/* Difuminado en la parte superior */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        className="absolute top-0 w-full h-24 z-10"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: "100%",
  },
});
