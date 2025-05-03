import { View, Text } from "react-native";

export function ProfileMetric({ label, value }) {
  return (
    <View className="items-center mx-2">
      <Text className="text-xl font-bold text-gray-800">{value}</Text>
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  );
}
