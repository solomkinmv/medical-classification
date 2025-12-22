import { useMemo } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurCard } from "@/components/BlurCard";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { searchProcedures, type SearchResult } from "@/lib/search";
import { useSearchQuery } from "./_layout";
import { SEARCH_MIN_QUERY_LENGTH, SEARCH_MAX_RESULTS, colors } from "@/lib/constants";

export default function SearchIndex() {
  const { query, debouncedQuery, isSearching } = useSearchQuery();
  const data = useAchiData();

  const results = useMemo(() => {
    if (debouncedQuery.length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchProcedures(data, debouncedQuery, SEARCH_MAX_RESULTS);
  }, [data, debouncedQuery]);

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-4">
          <Ionicons name="search-outline" size={40} color={colors.gray[400]} />
        </View>
        <Text className="text-gray-500 text-center">
          Введіть щонайменше {SEARCH_MIN_QUERY_LENGTH} символи для пошуку
        </Text>
      </View>
    );
  }

  if (isSearching) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center px-8">
        <ActivityIndicator size="large" color={colors.sky[500]} />
        <Text className="text-gray-500 text-center mt-4">Пошук...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={40} color={colors.gray[400]} />
        </View>
        <Text className="text-xl font-semibold text-gray-700 text-center">
          Нічого не знайдено
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          Спробуйте інший пошуковий запит
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.code.code}
      className="flex-1 bg-gray-100"
      contentContainerStyle={{ padding: 16 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      ListHeaderComponent={
        <Text className="text-sm text-gray-500 mb-3">
          Знайдено: {results.length}{" "}
          {results.length === 1
            ? "результат"
            : results.length < 5
            ? "результати"
            : "результатів"}
        </Text>
      }
      renderItem={({ item }) => <SearchResultCard result={item} />}
    />
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(result.code.code);

  return (
    <View className="mb-3 rounded-2xl overflow-hidden">
      <BlurCard>
        <View
          className="flex-row items-start justify-between"
          accessible
          accessibilityLabel={`${result.code.code}: ${result.code.name_ua}`}
        >
          <View className="flex-1 pr-3">
            <View className="bg-sky-500/10 self-start px-3 py-1.5 rounded-lg mb-3">
              <Text className="text-base text-sky-600 font-bold">
                {result.code.code}
              </Text>
            </View>
            <Text className="text-base text-gray-800 font-medium mb-2">
              {result.code.name_ua}
            </Text>
            <Text className="text-sm text-gray-500 italic" numberOfLines={2}>
              {result.code.name_en}
            </Text>
          </View>
          <Pressable
            onPress={() => toggleFavorite(result.code)}
            accessibilityLabel={isPinned ? "Видалити закладку" : "Додати закладку"}
            accessibilityRole="button"
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
      </BlurCard>
    </View>
  );
}
