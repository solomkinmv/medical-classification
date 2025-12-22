import { View, Text, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurCard } from "@/components/BlurCard";
import { useFavorites } from "@/lib/favorites-provider";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";
import type { ProcedureCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Завантаження...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-4">
          <Ionicons name="bookmark-outline" size={40} color={colors.amber[500]} />
        </View>
        <Text className="text-xl font-semibold text-gray-700 text-center">
          Немає збережених
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          Натисніть на закладку біля процедури, щоб зберегти її тут
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.code}
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
        paddingTop: 8,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      renderItem={({ item }) => (
        <PinnedCard procedure={item} onToggle={() => toggleFavorite(item)} />
      )}
    />
  );
}

interface PinnedCardProps {
  procedure: ProcedureCode;
  onToggle: () => void;
}

function PinnedCard({ procedure, onToggle }: PinnedCardProps) {
  return (
    <View className="mb-3 rounded-2xl overflow-hidden">
      <BlurCard>
        <View
          className="flex-row items-start justify-between"
          accessible
          accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        >
          <View className="flex-1 pr-3">
            <View className="bg-amber-500/10 self-start px-2 py-1 rounded-lg mb-2">
              <Text className="text-sm text-amber-600 font-bold">
                {procedure.code}
              </Text>
            </View>
            <Text className="text-base text-gray-800 font-medium mb-1">
              {procedure.name_ua}
            </Text>
            <Text className="text-sm text-gray-500 italic">
              {procedure.name_en}
            </Text>
          </View>
          <Pressable
            onPress={onToggle}
            accessibilityLabel="Видалити закладку"
            accessibilityRole="button"
            accessibilityHint="Видаляє процедуру зі збережених"
            accessibilityState={{ selected: true }}
            className="w-10 h-10 rounded-full bg-amber-500/10 items-center justify-center"
          >
            <Ionicons name="bookmark" size={20} color={colors.amber[500]} />
          </Pressable>
        </View>
      </BlurCard>
    </View>
  );
}
