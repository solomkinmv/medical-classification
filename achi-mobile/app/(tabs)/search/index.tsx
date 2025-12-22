import { useMemo, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AccentCard } from "@/components/AccentCard";
import { ProcedureDetailModal } from "@/components/ProcedureDetailModal";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { searchProcedures, type SearchResult } from "@/lib/search";
import { findProcedurePath } from "@/lib/navigation";
import { useSearchQuery } from "./_layout";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  colors,
  CONTENT_PADDING_HORIZONTAL
} from "@/lib/constants";
import type { ProcedureCode } from "@/lib/types";

export default function SearchIndex() {
  const { query, debouncedQuery, isSearching } = useSearchQuery();
  const data = useAchiData();
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureCode | null>(null);

  const results = useMemo(() => {
    if (debouncedQuery.length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchProcedures(data, debouncedQuery, SEARCH_MAX_RESULTS);
  }, [data, debouncedQuery]);

  const procedurePath = selectedProcedure
    ? findProcedurePath(data, selectedProcedure.code) ?? []
    : [];

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: '#FAFBFC' }}>
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
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: '#FAFBFC' }}>
        <ActivityIndicator size="large" color={colors.sky[500]} />
        <Text className="text-gray-500 text-center mt-4">Пошук...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: '#FAFBFC' }}>
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
    <>
      <FlatList
        data={results}
        keyExtractor={(item) => item.code.code}
        className="flex-1"
        style={{ backgroundColor: '#FAFBFC' }}
        contentContainerStyle={{
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          paddingTop: 12,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
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
        renderItem={({ item }) => (
          <SearchResultCard
            result={item}
            onPress={() => setSelectedProcedure(item.code)}
          />
        )}
      />
      <ProcedureDetailModal
        visible={selectedProcedure !== null}
        procedure={selectedProcedure}
        path={procedurePath}
        onClose={() => setSelectedProcedure(null)}
      />
    </>
  );
}

function SearchResultCard({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress?: () => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(result.code.code);

  return (
    <AccentCard
      accentColor={colors.sky[500]}
      badge={result.code.code}
      badgeColor={colors.sky[600]}
      title={result.code.name_ua}
      subtitle={result.code.name_en}
      icon={isPinned ? "bookmark" : "bookmark-outline"}
      iconColor={isPinned ? colors.amber[500] : colors.gray[400]}
      iconBackground={isPinned ? "rgba(245, 158, 11, 0.15)" : "rgba(156, 163, 175, 0.1)"}
      iconSize={18}
      onIconPress={() => toggleFavorite(result.code)}
      iconAccessibilityLabel={isPinned ? "Видалити закладку" : "Додати закладку"}
      accessibilityLabel={`${result.code.code}: ${result.code.name_ua}`}
      onPress={onPress}
      accessibilityHint="Відкрити деталі процедури"
    />
  );
}
