import { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { Host, CircularProgress } from "@expo/ui/swift-ui";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { AccentCard } from "@/components/AccentCard";
import { EmptyState } from "@/components/EmptyState";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { searchProcedures, type SearchResult } from "@/lib/search";
import { useSearchQuery } from "./_layout";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  colors,
  CONTENT_PADDING_HORIZONTAL,
  theme,
} from "@/lib/constants";

export default function SearchIndex() {
  const { query, debouncedQuery, isSearching } = useSearchQuery();
  const data = useAchiData();
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  const results = useMemo(() => {
    if (debouncedQuery.length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchProcedures(data, debouncedQuery, SEARCH_MAX_RESULTS);
  }, [data, debouncedQuery]);

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return (
      <EmptyState
        icon="magnifyingglass"
        iconColor={colors.gray[400]}
        iconBackgroundColor="rgba(156, 163, 175, 0.2)"
        message={`Введіть щонайменше ${SEARCH_MIN_QUERY_LENGTH} символи для пошуку`}
      />
    );
  }

  if (isSearching) {
    return (
      <View className="flex-1 items-center justify-center px-8 bg-[#F0F2F5] dark:bg-[#0A0A0A]">
        <View className="items-center">
          <Host matchContents>
            <CircularProgress color={colors.sky[500]} />
          </Host>
          <Text style={{ fontSize: 14, color: t.textSecondary, marginTop: 16 }}>
            Пошук...
          </Text>
        </View>
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

  const resultText =
    results.length === 1
      ? "результат"
      : results.length < 5
        ? "результати"
        : "результатів";

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.code.code}
      className="flex-1 bg-[#F0F2F5] dark:bg-[#0A0A0A]"
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
        <Text style={{ fontSize: 14, color: t.textSecondary, marginBottom: 12 }}>
          {`Знайдено: ${results.length} ${resultText}`}
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
        iconBackground={
          isPinned ? "rgba(245, 158, 11, 0.15)" : "rgba(156, 163, 175, 0.1)"
        }
        iconSize={18}
        onIconPress={() => toggleFavorite(result.code)}
        iconAccessibilityLabel={isPinned ? "Видалити закладку" : "Додати закладку"}
        accessibilityLabel={`${result.code.code}: ${result.code.name_ua}`}
        accessibilityHint="Відкрити деталі процедури"
      />
    </Link>
  );
}
