import { View, Text, FlatList, Pressable } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurCard } from "@/components/BlurCard";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import {
  resolveNavigationPath,
  getChildCategories,
  getProcedureCodes,
} from "@/lib/navigation";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";
import type { CategoryNode, ProcedureCode } from "@/lib/types";

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
    <View className="flex-1 bg-white">
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
        paddingTop: 8,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      renderItem={({ item: [key, node] }) => {
        const href =
          "/(tabs)/explore/" + [...basePath, encodeURIComponent(key)].join("/");
        return (
          <Link href={href as `/(tabs)/explore/${string}`} asChild>
            <Pressable
              className="mb-3 rounded-2xl overflow-hidden"
              accessibilityLabel={node.code ? `${node.code}: ${node.name_ua}` : node.name_ua}
              accessibilityRole="button"
              accessibilityHint="Відкрити категорію для перегляду підкатегорій"
            >
              <BlurCard>
                <CategoryCardContent node={node} />
              </BlurCard>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

function CategoryCardContent({ node }: { node: CategoryNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        {node.code && (
          <View className="bg-sky-500/10 self-start px-2 py-1 rounded-lg mb-2">
            <Text className="text-xs text-sky-600 font-semibold">
              {node.code}
            </Text>
          </View>
        )}
        <Text className="text-base text-gray-800 font-medium" numberOfLines={2}>
          {node.name_ua}
        </Text>
      </View>
      <View className="w-8 h-8 rounded-full bg-sky-500/10 items-center justify-center">
        <Ionicons name="chevron-forward" size={18} color={colors.sky[500]} />
      </View>
    </View>
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
        paddingTop: 8,
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
    <View
      className="mb-3 rounded-2xl overflow-hidden"
      accessible
      accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
    >
      <BlurCard>
        <ProcedureCardContent
          procedure={procedure}
          isPinned={isPinned}
          onToggle={() => toggleFavorite(procedure)}
        />
      </BlurCard>
    </View>
  );
}

function ProcedureCardContent({
  procedure,
  isPinned,
  onToggle,
}: {
  procedure: ProcedureCode;
  isPinned: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <View className="bg-sky-500/10 self-start px-3 py-1.5 rounded-lg mb-3">
          <Text className="text-base text-sky-600 font-bold">
            {procedure.code}
          </Text>
        </View>
        <Text className="text-base text-gray-800 font-medium mb-2">
          {procedure.name_ua}
        </Text>
        <Text className="text-sm text-gray-500 italic">{procedure.name_en}</Text>
      </View>
      <Pressable
        onPress={onToggle}
        accessibilityLabel={isPinned ? "Видалити закладку" : "Додати закладку"}
        accessibilityRole="button"
        accessibilityHint={
          isPinned
            ? "Видаляє процедуру зі збережених"
            : "Додає процедуру до збережених"
        }
        accessibilityState={{ selected: isPinned }}
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{
          backgroundColor: isPinned
            ? "rgba(245, 158, 11, 0.15)"
            : "rgba(156, 163, 175, 0.1)",
        }}
      >
        <Ionicons
          name={isPinned ? "bookmark" : "bookmark-outline"}
          size={22}
          color={isPinned ? colors.amber[500] : colors.gray[400]}
        />
      </Pressable>
    </View>
  );
}
