import { useMemo, useRef, useCallback, useEffect } from "react";
import { Text, FlatList, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonList";
import { RecentSearches } from "@/components/RecentSearches";
import { useClassifier } from "@/lib/classifier-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useRecentSearches } from "@/lib/recent-searches-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { useTheme } from "@/lib/useTheme";
import { searchProcedures, type SearchResult } from "@/lib/search";
import { useSearchQuery } from "./_layout";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  getClassifierColors,
} from "@/lib/constants";

function pluralizeResults(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return "результатів";
  if (lastOne === 1) return "результат";
  if (lastOne >= 2 && lastOne <= 4) return "результати";
  return "результатів";
}

export default function SearchIndex() {
  const { query, debouncedQuery, isSearching, setQueryFromExternal } =
    useSearchQuery();
  const { activeClassifier, activeData: data } = useClassifier();
  const { colors: t } = useTheme();
  const backgroundColor = useBackgroundColor();
  const { recentSearches, lastSearchQuery, addRecentSearch } =
    useRecentSearches();

  // Track the last query that had results (for saving on session end)
  const lastSuccessfulQueryRef = useRef<string | null>(null);

  const prevClassifierRef = useRef(activeClassifier);
  useEffect(() => {
    if (prevClassifierRef.current !== activeClassifier) {
      prevClassifierRef.current = activeClassifier;
      lastSuccessfulQueryRef.current = null;
      setQueryFromExternal("");
    }
  }, [activeClassifier, setQueryFromExternal]);

  const results = useMemo(() => {
    if (debouncedQuery.length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchProcedures(data, debouncedQuery, SEARCH_MAX_RESULTS);
  }, [data, debouncedQuery]);

  // Update ref when we have results
  useEffect(() => {
    if (
      results.length > 0 &&
      debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH
    ) {
      lastSuccessfulQueryRef.current = debouncedQuery;
    }
  }, [results.length, debouncedQuery]);

  // Save when search is cleared (X button) - session end
  const prevDebouncedQueryRef = useRef<string>(debouncedQuery);
  useEffect(() => {
    const wasValid =
      prevDebouncedQueryRef.current.length >= SEARCH_MIN_QUERY_LENGTH;
    const isNowInvalid = debouncedQuery.length < SEARCH_MIN_QUERY_LENGTH;

    if (wasValid && isNowInvalid && lastSuccessfulQueryRef.current) {
      addRecentSearch(lastSuccessfulQueryRef.current);
      lastSuccessfulQueryRef.current = null;
    }
    prevDebouncedQueryRef.current = debouncedQuery;
  }, [debouncedQuery, addRecentSearch]);

  // Save search when leaving the screen - session end
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (lastSuccessfulQueryRef.current) {
          addRecentSearch(lastSuccessfulQueryRef.current);
          lastSuccessfulQueryRef.current = null;
        }
      };
    }, [addRecentSearch]),
  );

  const lastSearchResults = useMemo(() => {
    if (!lastSearchQuery || lastSearchQuery.length < SEARCH_MIN_QUERY_LENGTH)
      return [];
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
        <RecentSearches
          onSelectQuery={setQueryFromExternal}
          activeQuery={lastSearchQuery}
        />

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
              Результати для &ldquo;{lastSearchQuery}&rdquo;
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
    return <SkeletonList count={5} hasSubtitle={true} />;
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
          Знайдено: {results.length} {pluralizeResults(results.length)}
        </Text>
      }
      renderItem={({ item }) => <SearchResultCard result={item} />}
    />
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { activeClassifier } = useClassifier();
  const router = useRouter();
  const isPinned = isFavorite(result.code.code);
  const classifierColors = getClassifierColors(activeClassifier);

  return (
    <AccentCard
      onPress={() => router.push(`/procedure/${result.code.code}`)}
      accentColor={classifierColors.accent500}
      badge={result.code.code}
      badgeColor={classifierColors.accent600}
      title={result.code.name_ua}
      subtitle={result.code.name_en}
      icon="bookmark"
      isBookmarked={isPinned}
      iconColor={isPinned ? colors.amber[500] : colors.gray[400]}
      iconBackground={
        isPinned ? "rgba(245, 158, 11, 0.15)" : "rgba(156, 163, 175, 0.1)"
      }
      iconSize={18}
      onIconPress={() => toggleFavorite(result.code)}
      iconAccessibilityLabel={
        isPinned ? "Видалити закладку" : "Додати закладку"
      }
      accessibilityLabel={`${result.code.code}: ${result.code.name_ua}`}
      accessibilityHint="Відкрити деталі"
    />
  );
}
