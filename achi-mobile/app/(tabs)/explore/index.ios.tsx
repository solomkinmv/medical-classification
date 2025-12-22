import { View, Text, FlatList } from "react-native";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { AccentCard } from "@/components/AccentCard";
import { useAchiData } from "@/lib/data-provider";
import { getRootCategories } from "@/lib/navigation";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM, theme } from "@/lib/constants";
import type { CategoryNode } from "@/lib/types";

export default function ExploreScreen() {
  const data = useAchiData();
  const categories = getRootCategories(data);
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  return (
    <FlatList
      data={categories}
      keyExtractor={([key]) => key}
      className="flex-1 bg-[#F0F2F5] dark:bg-[#0A0A0A]"
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
        paddingTop: 12,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      ListHeaderComponent={
        <Text style={{ fontSize: 14, color: t.textSecondary, marginBottom: 16 }}>
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
