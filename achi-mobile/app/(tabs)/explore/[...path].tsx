import { View, Text, FlatList, Pressable, Platform } from "react-native";
import { useLocalSearchParams, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import {
  resolveNavigationPath,
  getChildCategories,
  getProcedureCodes,
} from "@/lib/navigation";
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
    <View className="flex-1 bg-gray-100">
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
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: [key, node] }) => {
        const href =
          "/(tabs)/explore/" + [...basePath, encodeURIComponent(key)].join("/");
        return (
          <Link href={href as `/(tabs)/explore/${string}`} asChild>
            <Pressable className="mb-3 rounded-2xl overflow-hidden">
              {Platform.OS === "ios" ? (
                <BlurView intensity={60} tint="light" className="p-4">
                  <CategoryCardContent node={node} />
                </BlurView>
              ) : (
                <View className="p-4 bg-white/90">
                  <CategoryCardContent node={node} />
                </View>
              )}
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
        <Ionicons name="chevron-forward" size={18} color="#0ea5e9" />
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
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <ProcedureCard procedure={item} />}
    />
  );
}

function ProcedureCard({ procedure }: { procedure: ProcedureCode }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(procedure.code);

  return (
    <View className="mb-3 rounded-2xl overflow-hidden">
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint="light" className="p-4">
          <ProcedureCardContent
            procedure={procedure}
            isPinned={isPinned}
            onToggle={() => toggleFavorite(procedure)}
          />
        </BlurView>
      ) : (
        <View className="p-4 bg-white/90">
          <ProcedureCardContent
            procedure={procedure}
            isPinned={isPinned}
            onToggle={() => toggleFavorite(procedure)}
          />
        </View>
      )}
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
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{
          backgroundColor: isPinned ? "rgba(245, 158, 11, 0.15)" : "rgba(156, 163, 175, 0.1)",
        }}
      >
        <Ionicons
          name={isPinned ? "bookmark" : "bookmark-outline"}
          size={22}
          color={isPinned ? "#f59e0b" : "#9ca3af"}
        />
      </Pressable>
    </View>
  );
}
