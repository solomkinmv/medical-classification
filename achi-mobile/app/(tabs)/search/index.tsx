import { useMemo, useEffect } from "react";
import { View, Text, FlatList, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { AccentCard } from "@/components/AccentCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RecentSearches } from "@/components/RecentSearches";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useRecentSearches } from "@/lib/recent-searches-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { searchProcedures, type SearchResult } from "@/lib/search";
import { useSearchQuery } from "./_layout";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  theme,
} from "@/lib/constants";

export default function SearchIndex() {
  const { query, debouncedQuery, isSearching, setQueryFromExternal } = useSearchQuery();
  const data = useAchiData();
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;
  const backgroundColor = useBackgroundColor();
  const { recentSearches, lastSearchQuery, addRecentSearch } = useRecentSearches();

  const results = useMemo(() => {
    if (debouncedQuery.length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchProcedures(data, debouncedQuery, SEARCH_MAX_RESULTS);
  }, [data, debouncedQuery]);

  const resultsCount = results.length;
  useEffect(() => {
    if (resultsCount > 0 && debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH) {
      addRecentSearch(debouncedQuery);
    }
  }, [resultsCount, debouncedQuery, addRecentSearch]);

  const lastSearchResults = useMemo(() => {
    if (!lastSearchQuery || lastSearchQuery.length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchProcedures(data, lastSearchQuery, SEARCH_MAX_RESULTS);
  }, [data, lastSearchQuery]);

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    const hasRecentSearches = recentSearches.length > 0;
    const hasLastResults = lastSearchResults.length > 0;

    if (!hasRecentSearches && !hasLastResults) {
      return (
        <EmptyState
          icon="magnifyingglass"
          iconColor={colors.gray[400]}
          iconBackgroundColor="rgba(156, 163, 175, 0.2)"
          message={`Введіть щонайменше ${SEARCH_MIN_QUERY_LENGTH} символи для пошуку`}
        />
      );
    }

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          paddingBottom: CONTENT_PADDING_BOTTOM,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RecentSearches onSelectQuery={setQueryFromExternal} activeQuery={lastSearchQuery} />

        {hasLastResults && lastSearchQuery && (
          <>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: t.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Результати для "{lastSearchQuery}"
            </Text>
            {lastSearchResults.map((result) => (
              <SearchResultCard key={result.code.code} result={result} />
            ))}
          </>
        )}
      </ScrollView>
    );
  }

  if (isSearching) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor }}>
        <LoadingSpinner color={colors.sky[500]} />
        <Text style={{ color: t.textMuted, marginTop: 16 }}>Пошук...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon="exclamationmark.circle"
        iconColor={colors.gray[400]}
        iconBackgroundColor="rgba(156, 163, 175, 0.2)"
        title="Нічого не знайдено"
        message="Спробуйте інший пошуковий запит"
      />
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.code.code}
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      windowSize={5}
      ListHeaderComponent={
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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
    <Link href={`/procedure/${result.code.code}` as any} asChild>
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
        accessibilityHint="Відкрити деталі процедури"
      />
    </Link>
  );
}
