import { View, Text, Pressable, FlatList } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurCard } from "@/components/BlurCard";
import { useAchiData } from "@/lib/data-provider";
import { getRootCategories } from "@/lib/navigation";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";
import type { CategoryNode } from "@/lib/types";

export default function ExploreScreen() {
  const data = useAchiData();
  const categories = getRootCategories(data);

  return (
    <FlatList
      data={categories}
      keyExtractor={([key]) => key}
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
        paddingTop: 8,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
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
      <Pressable
        className="mb-3 rounded-2xl overflow-hidden"
        accessibilityLabel={node.clazz ? node.clazz + ": " + node.name_ua : node.name_ua}
        accessibilityRole="button"
        accessibilityHint="Відкрити категорію для перегляду підкатегорій"
      >
        <BlurCard>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              {node.clazz && (
                <View className="bg-sky-500/10 self-start px-2 py-1 rounded-lg mb-2">
                  <Text className="text-xs text-sky-600 font-semibold">
                    {node.clazz}
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
        </BlurCard>
      </Pressable>
    </Link>
  );
}
