import { View, Text } from "react-native";

export function PaginationPet({ paginationIndex, totalItems }) {
  if (totalItems <= 1) return null;

  return (
    <View className="bg-black/50 px-3 py-1 rounded-xl">
      <Text className="text-white font-semibold text-sm">
        {paginationIndex + 1} / {totalItems}
      </Text>
    </View>
  );
}
