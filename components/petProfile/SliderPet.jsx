import { View, FlatList, StyleSheet } from "react-native";
import { useState, useRef } from "react";
import { SliderItemPet } from "../petProfile/SliderItemPet.jsx";
import { PaginationPet } from "./PaginationPet.jsx";

export function SliderPet({ images }) {
  const [paginationIndex, setPaginationIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewRef = useRef(({ changed }) => {
    if (changed && changed.length > 0) {
      setPaginationIndex(changed[0].index);
    }
  });

  const itemLength = images.length;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={styles.sliderContainer}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        ref={flatListRef}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <SliderItemPet item={item} index={index} />
        )}
      />
      <View style={styles.paginationOverlay}>
        <PaginationPet
          paginationIndex={paginationIndex}
          totalItems={itemLength}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    height: "55%",
    position: "relative",
  },
  paginationOverlay: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    zIndex: 10,
  },
});
