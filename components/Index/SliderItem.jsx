import { Image, View, Dimensions, StyleSheet } from "react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";

export function SliderItem({ item }) {
  const screenWidth = Dimensions.get("window").width;
  const horizontalMargin = 16;
  const itemWidth = screenWidth - horizontalMargin * 2;

  const isVideo = item.type === "video";

  const player = useVideoPlayer(item.source, (player) => {
    player.loop = true;
    player.play();
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
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          startsPictureInPictureAutomatically
        />
      ) : (
        <Image
          source={{ uri: item.source }}
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
