import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { CodeCard } from "@/components/CodeCard";
import { useClassifier } from "@/lib/classifier-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  resolveNavigationPath,
  getChildCategories,
  getLeafCodes,
} from "@/lib/navigation";
import {
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  getClassifierColors,
} from "@/lib/constants";
import type { CategoryNode, ClassifierType, LeafCode } from "@/lib/types";

export default function BrowseScreen() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const { activeClassifier, activeData: data } = useClassifier();
  const backgroundColor = useBackgroundColor();
  const classifierColors = getClassifierColors(activeClassifier);

  const pathSegments = Array.isArray(path) ? path : path ? [path] : [];
  const navState = resolveNavigationPath(data, pathSegments, activeClassifier);

  const titleSegment = navState.path.findLast((s) => s.key !== "_");
  const title = titleSegment
    ? titleSegment.name_ua
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
          title,
          headerTintColor: classifierColors.accent500,
        }}
      />

      {navState.isLeaf && procedureCodes ? (
        <ProcedureList codes={procedureCodes} classifier={activeClassifier} />
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
  classifier: ClassifierType;
}

function ProcedureList({ codes, classifier }: ProcedureListProps) {
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
        <CodeCard code={item} classifier={classifier} />
      )}
    />
  );
}
