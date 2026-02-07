import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { useClassifier } from "@/lib/classifier-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  resolveNavigationPath,
  getChildCategories,
  getLeafCodes,
} from "@/lib/navigation";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  getClassifierColors,
} from "@/lib/constants";
import type { CategoryNode, LeafCode } from "@/lib/types";

export default function BrowseScreen() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const { activeClassifier, activeData: data } = useClassifier();
  const backgroundColor = useBackgroundColor();
  const classifierColors = getClassifierColors(activeClassifier);

  const pathSegments = Array.isArray(path) ? path : path ? [path] : [];
  const navState = resolveNavigationPath(data, pathSegments, activeClassifier);

  const title =
    navState.path.length > 0
      ? navState.path[navState.path.length - 1].name_ua
      : activeClassifier === "mkh10"
        ? "МКХ-10"
        : "АКМІ";

  const childCategories = navState.children
    ? getChildCategories(navState.children)
    : null;
  const procedureCodes = navState.children
    ? getLeafCodes(navState.children)
    : null;

  // Filter out underscore segments from URL path (they're auto-resolved)
  const currentPath = navState.path
    .filter((s) => s.key !== "_")
    .map((s) => encodeURIComponent(s.key));

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Stack.Screen
        options={{
          title: title.length > 25 ? title.substring(0, 25) + "..." : title,
          headerTintColor: classifierColors.accent500,
        }}
      />

      {navState.isLeaf && procedureCodes ? (
        <ProcedureList
          codes={procedureCodes}
          classifierColors={classifierColors}
        />
      ) : childCategories ? (
        <CategoryList
          categories={childCategories}
          basePath={currentPath}
          classifierColors={classifierColors}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">
            Нічого не знайдено
          </Text>
        </View>
      )}
    </View>
  );
}

interface ClassifierColors {
  accent500: string;
  accent600: string;
  iconBackground: string;
}

interface CategoryListProps {
  categories: [string, CategoryNode][];
  basePath: string[];
  classifierColors: ClassifierColors;
}

function formatBlockRange(node: CategoryNode): string | undefined {
  if (!node.blockRange) return undefined;
  const { min, max } = node.blockRange;
  return min === max ? `Блок: ${min}` : `Блоки: ${min}–${max}`;
}

function CategoryList({
  categories,
  basePath,
  classifierColors,
}: CategoryListProps) {
  return (
    <FlatList
      data={categories}
      keyExtractor={([key]) => key}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      renderItem={({ item: [key, node] }) => {
        const href =
          "/(tabs)/explore/" + [...basePath, encodeURIComponent(key)].join("/");
        return (
          <Link href={href as `/(tabs)/explore/${string}`} asChild>
            <AccentCard
              accentColor={classifierColors.accent500}
              badge={node.code}
              badgeColor={classifierColors.accent600}
              blockRange={formatBlockRange(node)}
              title={node.name_ua}
              icon="chevron-forward"
              iconColor={classifierColors.accent600}
              iconBackground={classifierColors.iconBackground}
              iconSize={16}
              accessibilityLabel={
                node.code ? `${node.code}: ${node.name_ua}` : node.name_ua
              }
              accessibilityHint="Відкрити категорію для перегляду підкатегорій"
            />
          </Link>
        );
      }}
    />
  );
}

interface ProcedureListProps {
  codes: LeafCode[];
  classifierColors: ClassifierColors;
}

function ProcedureList({ codes, classifierColors }: ProcedureListProps) {
  return (
    <FlatList
      data={codes}
      keyExtractor={(item) => item.code}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      renderItem={({ item }) => (
        <ProcedureCard procedure={item} classifierColors={classifierColors} />
      )}
    />
  );
}

function ProcedureCard({
  procedure,
  classifierColors,
}: {
  procedure: LeafCode;
  classifierColors: ClassifierColors;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(procedure.code);

  return (
    <Link href={`/procedure/${procedure.code}` as any} asChild>
      <AccentCard
        accentColor={classifierColors.accent500}
        badge={procedure.code}
        badgeColor={classifierColors.accent600}
        title={procedure.name_ua}
        subtitle={procedure.name_en}
        icon="bookmark"
        isBookmarked={isPinned}
        iconColor={isPinned ? colors.amber[500] : colors.gray[400]}
        iconBackground={
          isPinned ? "rgba(245, 158, 11, 0.15)" : "rgba(156, 163, 175, 0.1)"
        }
        iconSize={18}
        onIconPress={() => toggleFavorite(procedure)}
        iconAccessibilityLabel={
          isPinned ? "Видалити закладку" : "Додати закладку"
        }
        accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        accessibilityHint="Відкрити деталі процедури"
      />
    </Link>
  );
}
