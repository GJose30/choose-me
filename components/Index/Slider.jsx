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

      {/* <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          //   <Pressable className="w-full" onPress={() => {}}>
          //     <Image
          //       source={{ uri: item }}
          //       className={`w-[${width}px] h-[400px] rounded-2xl`}
          //       resizeMode="cover"
          //     />
          //   </Pressable>
          //   <Pressable className="w-full">
          <Image
            source={{ uri: item }}
            className="mt-2"
            style={{ width: width, height: 400, borderRadius: 16 }}
            resizeMode="cover"
          />
          //   </Pressable>
        )}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
      />

      <View className="flex-row justify-center mt-2">
        {images.map((_, idx) => (
          <View
            key={idx}
            className={`h-2 w-2 rounded-full mx-1 ${idx === activeIndex ? "bg-gray-800" : "bg-gray-300"}`}
          />
        ))}
      </View> */}
    </View>
  );
}
