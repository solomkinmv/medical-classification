import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";
import { Link } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { ClassifierSwitcher } from "@/components/ClassifierSwitcher";
import { useAchiData } from "@/lib/data-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { getRootCategories } from "@/lib/navigation";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  CARD_HEIGHT_WITHOUT_SUBTITLE,
  EXPLORE_HEADER_HEIGHT,
  getClassifierColors,
} from "@/lib/constants";
import type { CategoryNode } from "@/lib/types";

const SUBTITLE: Record<string, string> = {
  achi: "Австралійська класифікація медичних інтервенцій",
  mkh10: "Міжнародна класифікація хвороб",
};

export default function ExploreScreen() {
  const data = useAchiData();
  const { activeClassifier } = useClassifier();
  const categories = getRootCategories(data);
  const backgroundColor = useBackgroundColor();
  const classifierColors = getClassifierColors(activeClassifier);

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
        <View>
          <ClassifierSwitcher />
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {SUBTITLE[activeClassifier]}
          </Text>
        </View>
      }
      renderItem={({ item: [key, node] }) => (
        <CategoryCard
          categoryKey={key}
          node={node}
          accentColor={classifierColors.accent500}
          badgeColor={classifierColors.accent600}
          iconColor={classifierColors.accent600}
          iconBackground={classifierColors.iconBackground}
        />
      )}
    />
  );
}

interface CategoryCardProps {
  categoryKey: string;
  node: CategoryNode;
  accentColor: string;
  badgeColor: string;
  iconColor: string;
  iconBackground: string;
}

function CategoryCard({
  categoryKey,
  node,
  accentColor,
  badgeColor,
  iconColor,
  iconBackground,
}: CategoryCardProps) {
  const href = "/(tabs)/explore/" + encodeURIComponent(categoryKey);

  return (
    <Link href={href as any} asChild>
      <AccentCard
        accentColor={accentColor}
        badge={node.clazz}
        badgeColor={badgeColor}
        title={node.name_ua}
        icon="chevron-forward"
        iconColor={iconColor}
        iconBackground={iconBackground}
        iconSize={16}
        accessibilityLabel={node.clazz ? `${node.clazz}: ${node.name_ua}` : node.name_ua}
        accessibilityHint="Відкрити категорію для перегляду підкатегорій"
      />
    </Link>
  );
}
