// import { View, FlatList, Pressable } from "react-native";
// import { useState, useRef, useEffect } from "react";
// import { SliderItem } from "./SliderItem";
// import { Pagination } from "./Pagination";

// export function Slider({ images, onHandleDoubleTap }) {
//   const [paginationIndex, setPaginationIndex] = useState(0);

//   const flatListRef = useRef(null);

//   const onViewRef = useRef(({ changed }) => {
//     if (changed && changed.length > 0) {
//       setPaginationIndex(changed[0].index);
//     }
//   });

//   const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

//   useEffect(() => {
//     // console.log(images);
//   }, []);

//   return (
//     <View>
//       <FlatList
//         data={images}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         pagingEnabled
//         onViewableItemsChanged={onViewRef.current}
//         viewabilityConfig={viewConfigRef.current}
//         ref={flatListRef}
//         keyExtractor={(item, index) => index.toString()}
//         renderItem={({ item, index }) => (
//           <Pressable onPress={onHandleDoubleTap}>
//             <SliderItem item={item} index={index} />
//           </Pressable>
//         )}
//       />

//       <Pagination item={images} paginationIndex={paginationIndex} />
//     </View>
//   );
// }

import { View, FlatList, Pressable } from "react-native";
import { useState, useRef, useEffect } from "react";
import { SliderItem } from "./SliderItem";
import { Pagination } from "./Pagination";

export function Slider({ images, onHandleDoubleTap }) {
  const [paginationIndex, setPaginationIndex] = useState(0);
  const flatListRef = useRef(null);
  const lastTapRef = useRef(null);
  const DOUBLE_TAP_DELAY = 300; // ms

  const onViewRef = useRef(({ changed }) => {
    if (changed && changed.length > 0) setPaginationIndex(changed[0].index);
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const onPressWithDoubleTap = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = null;
      onHandleDoubleTap?.(); // 👈 ejecuta tu toggle/like
    } else {
      lastTapRef.current = now; // primer toque: solo marca tiempo
    }
  };

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
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Pressable onPress={onPressWithDoubleTap}>
            <SliderItem item={item} index={index} />
          </Pressable>
        )}
      />
      <Pagination item={images} paginationIndex={paginationIndex} />
    </View>
  );
}
