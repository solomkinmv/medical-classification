import { View, Text, FlatList } from "react-native";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { AccentCard } from "@/components/AccentCard";
import { EmptyState } from "@/components/EmptyState";
import { useFavorites } from "@/lib/favorites-provider";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM, theme } from "@/lib/constants";
import type { ProcedureCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: t.background }}>
        <Text style={{ color: t.textMuted }}>Завантаження...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="bookmark"
        iconColor={colors.amber[500]}
        iconBackgroundColor="rgba(245, 158, 11, 0.15)"
        title="Немає збережених"
        message="Натисніть на закладку біля процедури, щоб зберегти її тут"
      />
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.code}
      style={{ flex: 1, backgroundColor: t.background }}
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
    <Link href={`/procedure/${procedure.code}` as any} asChild>
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
        isBookmarked={true}
        iconAccessibilityLabel="Видалити закладку"
        accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        accessibilityHint="Відкрити деталі процедури"
      />
    </Link>
  );
}
