import { View, FlatList, Pressable } from "react-native";
import { useState, useRef } from "react";
import { SliderItem } from "./SliderItem";
import { Pagination } from "./Pagination";

export function Slider({ images, onHandleDoubleTap }) {
  const [paginationIndex, setPaginationIndex] = useState(0);

  const flatListRef = useRef(null);

  const onViewRef = useRef(({ changed }) => {
    if (changed && changed.length > 0) {
      setPaginationIndex(changed[0].index);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View>
      <FlatList
        data={images}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        ref={flatListRef}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Pressable onPress={onHandleDoubleTap}>
            <SliderItem item={item} index={index} />
          </Pressable>
        )}
      />

      <Pagination item={images} paginationIndex={paginationIndex} />
    </View>
  );
}
