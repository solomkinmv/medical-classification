import { useCallback } from "react";
import { FlatList, Text } from "react-native";
import { Link } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { useAchiData } from "@/lib/data-provider";
import { getRootCategories } from "@/lib/navigation";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  CARD_HEIGHT_WITHOUT_SUBTITLE,
  EXPLORE_HEADER_HEIGHT,
} from "@/lib/constants";
import type { CategoryNode } from "@/lib/types";

export default function ExploreScreen() {
  const data = useAchiData();
  const categories = getRootCategories(data);
  const backgroundColor = useBackgroundColor();

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: CARD_HEIGHT_WITHOUT_SUBTITLE,
      offset: EXPLORE_HEADER_HEIGHT + CARD_HEIGHT_WITHOUT_SUBTITLE * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={categories}
      keyExtractor={([key]) => key}
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      getItemLayout={getItemLayout}
      ListHeaderComponent={
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Австралійська класифікація медичних інтервенцій
        </Text>
      }
      renderItem={({ item: [key, node] }) => (
        <CategoryCard categoryKey={key} node={node} />
      )}
    />
  );
}

interface CategoryCardProps {
  categoryKey: string;
  node: CategoryNode;
}

function CategoryCard({ categoryKey, node }: CategoryCardProps) {
  const href = "/(tabs)/explore/" + encodeURIComponent(categoryKey);

  return (
    <Link href={href as any} asChild>
      <AccentCard
        accentColor={colors.sky[500]}
        badge={node.clazz}
        badgeColor={colors.sky[600]}
        title={node.name_ua}
        icon="chevron-forward"
        iconColor={colors.sky[600]}
        iconBackground="rgba(14, 165, 233, 0.1)"
        iconSize={16}
        accessibilityLabel={node.clazz ? `${node.clazz}: ${node.name_ua}` : node.name_ua}
        accessibilityHint="Відкрити категорію для перегляду підкатегорій"
      />
    </Link>
  );
}
