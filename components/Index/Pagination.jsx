import { View } from "react-native";

export function Pagination({ item, paginationIndex }) {
  if (!item || item.length <= 1) return null;
  return (
    <View className="flex-row justify-center items-center mt-4">
      {item.map((_, index) => {
        return (
          <View
            key={index}
            className={`h-2 w-2 mx-1 rounded-full ${
              paginationIndex === index ? "bg-gray-800" : "bg-gray-300"
            }`}
          ></View>
        );
      })}
    </View>
  );
}
