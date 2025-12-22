import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { useState } from "react";
import { AccentCard } from "@/components/AccentCard";
import { ProcedureDetailModal } from "@/components/ProcedureDetailModal";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import {
  resolveNavigationPath,
  getChildCategories,
  getProcedureCodes,
} from "@/lib/navigation";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";
import type { CategoryNode, ProcedureCode, PathSegment } from "@/lib/types";

export default function BrowseScreen() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const data = useAchiData();

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
    <View className="flex-1" style={{ backgroundColor: '#FAFBFC' }}>
      <Stack.Screen
        options={{
          title: title.length > 25 ? title.substring(0, 25) + "..." : title,
        }}
      />

      {navState.isLeaf && procedureCodes ? (
        <ProcedureList codes={procedureCodes} path={navState.path} />
      ) : childCategories ? (
        <CategoryList categories={childCategories} basePath={currentPath} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Нічого не знайдено</Text>
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
        paddingTop: 12,
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
  path: PathSegment[];
}

function ProcedureList({ codes, path }: ProcedureListProps) {
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureCode | null>(null);

  return (
    <>
      <FlatList
        data={codes}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          paddingBottom: CONTENT_PADDING_BOTTOM,
          paddingTop: 12,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        renderItem={({ item }) => (
          <ProcedureCard
            procedure={item}
            onPress={() => setSelectedProcedure(item)}
          />
        )}
      />
      <ProcedureDetailModal
        visible={selectedProcedure !== null}
        procedure={selectedProcedure}
        path={path}
        onClose={() => setSelectedProcedure(null)}
      />
    </>
  );
}

function ProcedureCard({
  procedure,
  onPress,
}: {
  procedure: ProcedureCode;
  onPress?: () => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(procedure.code);

  return (
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
      onPress={onPress}
      accessibilityHint="Відкрити деталі процедури"
    />
  );
}

