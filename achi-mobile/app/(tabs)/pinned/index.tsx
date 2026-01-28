import { useState, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { Link } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonList";
import { useFavorites } from "@/lib/favorites-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  CARD_HEIGHT_WITH_SUBTITLE,
  REFRESH_FEEDBACK_DELAY_MS,
} from "@/lib/constants";
import type { ProcedureCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();
  const backgroundColor = useBackgroundColor();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Brief visual feedback - favorites are already in memory
    setTimeout(() => setRefreshing(false), REFRESH_FEEDBACK_DELAY_MS);
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: CARD_HEIGHT_WITH_SUBTITLE,
      offset: CARD_HEIGHT_WITH_SUBTITLE * index,
      index,
    }),
    []
  );

  if (isLoading) {
    return <SkeletonList count={5} hasSubtitle={true} />;
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
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      getItemLayout={getItemLayout}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.amber[500]}
        />
      }
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
    <Link href={`/procedure/${procedure.code}?accent=amber` as any} asChild>
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
