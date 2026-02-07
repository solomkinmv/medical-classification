import { useState, useCallback, memo } from "react";
import { FlatList, RefreshControl, ScrollView } from "react-native";
import { Link } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { ClassifierSwitcher } from "@/components/ClassifierSwitcher";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonList";
import { useFavorites } from "@/lib/favorites-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  REFRESH_FEEDBACK_DELAY_MS,
} from "@/lib/constants";
import type { LeafCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();
  const { activeClassifier } = useClassifier();
  const backgroundColor = useBackgroundColor();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Brief visual feedback - favorites are already in memory
    setTimeout(() => setRefreshing(false), REFRESH_FEEDBACK_DELAY_MS);
  }, []);

  if (isLoading) {
    return <SkeletonList count={5} hasSubtitle={true} />;
  }

  if (favorites.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ClassifierSwitcher />
        <EmptyState
          icon="bookmark"
          iconColor={colors.amber[500]}
          iconBackgroundColor="rgba(245, 158, 11, 0.15)"
          title="Немає збережених"
          message={
            activeClassifier === "mkh10"
              ? "Натисніть на закладку біля діагнозу, щоб зберегти його тут"
              : "Натисніть на закладку біля процедури, щоб зберегти її тут"
          }
        />
      </ScrollView>
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
      ListHeaderComponent={<ClassifierSwitcher />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.amber[500]}
        />
      }
      renderItem={({ item }) => (
        <PinnedCard procedure={item} toggleFavorite={toggleFavorite} />
      )}
    />
  );
}

interface PinnedCardProps {
  procedure: LeafCode;
  toggleFavorite: (item: LeafCode) => void;
}

const PinnedCard = memo(function PinnedCard({
  procedure,
  toggleFavorite,
}: PinnedCardProps) {
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
        onIconPress={() => toggleFavorite(procedure)}
        isBookmarked={true}
        iconAccessibilityLabel="Видалити закладку"
        accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        accessibilityHint="Відкрити деталі"
      />
    </Link>
  );
});
