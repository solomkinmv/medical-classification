import { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { AccentCard } from "@/components/AccentCard";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import {
  resolveNavigationPath,
  getChildCategories,
  getProcedureCodes,
} from "@/lib/navigation";
import { colors, theme, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";
import type { CategoryNode, ProcedureCode } from "@/lib/types";

export default function BrowseScreen() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const data = useAchiData();
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;
  const isLiquidGlass = useMemo(() => isLiquidGlassAvailable(), []);

  const pathSegments = Array.isArray(path) ? path : path ? [path] : [];
  const navState = resolveNavigationPath(data, pathSegments);

  const title =
    navState.path.length > 0
      ? navState.path[navState.path.length - 1].name_ua
      : "АКМІ";

  const childCategories = navState.children
    ? getChildCategories(navState.children)
    : null;
  const procedureCodes = navState.children
    ? getProcedureCodes(navState.children)
    : null;

  const currentPath = navState.path.map((s) => encodeURIComponent(s.key));
  const backgroundColor = isLiquidGlass ? "transparent" : t.background;

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Stack.Screen
        options={{
          title: title.length > 25 ? title.substring(0, 25) + "..." : title,
        }}
      />

      {navState.isLeaf && procedureCodes ? (
        <ProcedureList codes={procedureCodes} />
      ) : childCategories ? (
        <CategoryList categories={childCategories} basePath={currentPath} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">Нічого не знайдено</Text>
        </View>
      )}
    </View>
  );
}

interface CategoryListProps {
  categories: [string, CategoryNode][];
  basePath: string[];
}

function CategoryList({ categories, basePath }: CategoryListProps) {
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
              accentColor={colors.sky[500]}
              badge={node.code}
              badgeColor={colors.sky[600]}
              title={node.name_ua}
              icon="chevron-forward"
              iconColor={colors.sky[600]}
              iconBackground="rgba(14, 165, 233, 0.1)"
              iconSize={16}
              accessibilityLabel={node.code ? `${node.code}: ${node.name_ua}` : node.name_ua}
              accessibilityHint="Відкрити категорію для перегляду підкатегорій"
            />
          </Link>
        );
      }}
    />
  );
}


interface ProcedureListProps {
  codes: ProcedureCode[];
}

function ProcedureList({ codes }: ProcedureListProps) {
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
      renderItem={({ item }) => <ProcedureCard procedure={item} />}
    />
  );
}

function ProcedureCard({ procedure }: { procedure: ProcedureCode }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(procedure.code);

  return (
    <Link href={`/procedure/${procedure.code}` as any} asChild>
      <AccentCard
        accentColor={colors.sky[500]}
        badge={procedure.code}
        badgeColor={colors.sky[600]}
        title={procedure.name_ua}
        subtitle={procedure.name_en}
        icon="bookmark"
        isBookmarked={isPinned}
        iconColor={isPinned ? colors.amber[500] : colors.gray[400]}
        iconBackground={isPinned ? "rgba(245, 158, 11, 0.15)" : "rgba(156, 163, 175, 0.1)"}
        iconSize={18}
        onIconPress={() => toggleFavorite(procedure)}
        iconAccessibilityLabel={isPinned ? "Видалити закладку" : "Додати закладку"}
        accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        accessibilityHint="Відкрити деталі процедури"
      />
    </Link>
  );
}

