import { View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AccentCard } from "@/components/AccentCard";
import { useFavorites } from "@/lib/favorites-provider";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";
import type { ProcedureCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FAFBFC' }}>
        <Text className="text-gray-400">Завантаження...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: '#FAFBFC' }}>
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
      className="flex-1"
      style={{ backgroundColor: '#FAFBFC' }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
        paddingTop: 12,
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
    <AccentCard
      accentColor={colors.amber[500]}
      badge={procedure.code}
      badgeColor={colors.amber[600]}
      title={procedure.name_ua}
      subtitle={procedure.name_en}
      icon="bookmark"
      iconColor={colors.amber[500]}
      iconBackground="rgba(245, 158, 11, 0.15)"
      iconSize={18}
      onIconPress={onToggle}
      iconAccessibilityLabel="Видалити закладку"
      accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
    />
  );
}
