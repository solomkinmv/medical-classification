import { View, Text, FlatList } from "react-native";
import { Host, CircularProgress } from "@expo/ui/swift-ui";
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
      <View className="flex-1 items-center justify-center bg-[#F0F2F5] dark:bg-[#0A0A0A]">
        <View className="items-center">
          <Host matchContents>
            <CircularProgress color={colors.sky[500]} />
          </Host>
          <Text style={{ fontSize: 14, color: t.textMuted, marginTop: 16 }}>
            Завантаження...
          </Text>
        </View>
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
      className="flex-1 bg-[#F0F2F5] dark:bg-[#0A0A0A]"
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
        iconAccessibilityLabel="Видалити закладку"
        accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        accessibilityHint="Відкрити деталі процедури"
      />
    </Link>
  );
}
