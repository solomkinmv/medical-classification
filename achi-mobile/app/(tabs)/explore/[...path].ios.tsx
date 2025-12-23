import { View, Text, FlatList, useColorScheme } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import {
  resolveNavigationPath,
  getChildCategories,
  getProcedureCodes,
} from "@/lib/navigation";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM, theme } from "@/lib/constants";
import type { CategoryNode, ProcedureCode } from "@/lib/types";

export default function BrowseScreen() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const data = useAchiData();
  const colorScheme = useColorScheme() ?? "light";
  const t = colorScheme === "dark" ? theme.dark : theme.light;

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

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: title.length > 25 ? title.substring(0, 25) + "..." : title,
          headerStyle: { backgroundColor: t.background },
        }}
      />

      {navState.isLeaf && procedureCodes ? (
        <ProcedureList codes={procedureCodes} backgroundColor={t.background} />
      ) : childCategories ? (
        <CategoryList categories={childCategories} basePath={currentPath} backgroundColor={t.background} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text style={{ fontSize: 14, color: t.textSecondary }}>
            Нічого не знайдено
          </Text>
        </View>
      )}
    </View>
  );
}

interface CategoryListProps {
  categories: [string, CategoryNode][];
  basePath: string[];
  backgroundColor: string;
}

function CategoryList({ categories, basePath, backgroundColor }: CategoryListProps) {
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
  backgroundColor: string;
}

function ProcedureList({ codes, backgroundColor }: ProcedureListProps) {
  return (
    <FlatList
      data={codes}
      keyExtractor={(item) => item.code}
      style={{ flex: 1, backgroundColor }}
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
        icon={isPinned ? "bookmark" : "bookmark-outline"}
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
