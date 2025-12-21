import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Помилка" }} />
      <View className="flex-1 items-center justify-center p-5 bg-gray-50">
        <Text className="text-xl font-bold text-gray-800">
          Сторінку не знайдено
        </Text>
        <Link href="/(tabs)/explore" className="mt-4 py-4">
          <Text className="text-sky-600">На головну</Text>
        </Link>
      </View>
    </>
  );
}
