import { useMemo, useRef, useCallback, useEffect } from "react";
import { Text, ScrollView, SectionList, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { CodeCard } from "@/components/CodeCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonList";
import { RecentSearches } from "@/components/RecentSearches";
import { useClassifier } from "@/lib/classifier-provider";
import { useRecentSearches } from "@/lib/recent-searches-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { useTheme } from "@/lib/useTheme";
import { CLASSIFIER_EDITIONS, getCodeContext } from "@/lib/code-index";
import {
  searchAll,
  type ClassifierSearchResults,
  type SearchResult,
} from "@/lib/search";
import { useSearchQuery } from "./_layout";
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  getClassifierColors,
} from "@/lib/constants";
import type { ClassifierType } from "@/lib/types";

const SECTION_TITLES: Record<ClassifierType, string> = {
  achi: "Процедури · АКМІ",
  mkh10: "Діагнози · МКХ-10",
};

function useSections(query: string): ClassifierSearchResults[] {
  const { activeClassifier } = useClassifier();
  return useMemo(() => {
    if (query.trim().length < SEARCH_MIN_QUERY_LENGTH) return [];
    return searchAll(query, SEARCH_MAX_RESULTS, activeClassifier);
  }, [query, activeClassifier]);
}

export default function SearchIndex() {
  const { query, debouncedQuery, isSearching, setQueryFromExternal } =
    useSearchQuery();
  const backgroundColor = useBackgroundColor();
  const { recentSearches, lastSearchQuery, addRecentSearch } =
    useRecentSearches();

  // The last query that had results, saved when the search session ends
  const lastSuccessfulQueryRef = useRef<string | null>(null);

  const sections = useSections(debouncedQuery);
  const lastSections = useSections(lastSearchQuery ?? "");

  useEffect(() => {
    if (sections.length > 0) lastSuccessfulQueryRef.current = debouncedQuery;
  }, [sections, debouncedQuery]);

  // Save when the search is cleared (X button)
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

  // Save when leaving the screen
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

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    if (recentSearches.length === 0 && lastSections.length === 0) {
      return (
        <ScrollView
          style={{ flex: 1, backgroundColor }}
          contentContainerStyle={{
            paddingTop: 48,
            paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <EmptyState
            icon="magnifyingglass"
            iconColor={colors.gray[400]}
            iconBackgroundColor="rgba(156, 163, 175, 0.2)"
            title="Пошук процедур і діагнозів"
            message={`Введіть код (30443-00, K80.0) або назву. Пошук працює офлайн за ${CLASSIFIER_EDITIONS.achi} (АКМІ) та ${CLASSIFIER_EDITIONS.mkh10} (МКХ-10).`}
          />
        </ScrollView>
      );
    }

    return (
      <ResultList
        sections={lastSections}
        header={
          <>
            <RecentSearches
              onSelectQuery={setQueryFromExternal}
              activeQuery={lastSearchQuery}
            />
            {lastSections.length > 0 && lastSearchQuery && (
              <ListTitle title={`Результати для “${lastSearchQuery}”`} />
            )}
          </>
        }
      />
    );
  }

  if (isSearching) {
    return <SkeletonList count={5} hasSubtitle={true} />;
  }

  if (sections.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{
          paddingTop: 48,
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <EmptyState
          icon="exclamationmark.circle"
          iconColor={colors.gray[400]}
          iconBackgroundColor="rgba(156, 163, 175, 0.2)"
          title="Нічого не знайдено"
          message="Перевірте написання, спробуйте коротше слово або введіть код, наприклад 30443-00 чи K80.0."
        />
      </ScrollView>
    );
  }

  return <ResultList sections={sections} />;
}

function ResultList({
  sections,
  header,
}: {
  sections: ClassifierSearchResults[];
  header?: React.ReactElement;
}) {
  const backgroundColor = useBackgroundColor();
  const listSections = useMemo(
    () =>
      sections.map((section) => ({
        key: section.classifier,
        section,
        data: section.results,
      })),
    [sections],
  );

  return (
    <SectionList
      sections={listSections}
      keyExtractor={(item: SearchResult) => item.code.code}
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      windowSize={5}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) => (
        <SectionHeader section={section.section} />
      )}
      renderItem={({ item }) => (
        <CodeCard
          code={item.code}
          classifier={item.classifier}
          context={getCodeContext(item.code, item.path)}
        />
      )}
    />
  );
}

function SectionHeader({ section }: { section: ClassifierSearchResults }) {
  const { colors: t } = useTheme();
  const shown = section.results.length;
  const count =
    shown < section.total ? `${shown} з ${section.total}` : `${section.total}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginTop: 8,
        marginBottom: 12,
      }}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${SECTION_TITLES[section.classifier]}, знайдено ${count}`}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: getClassifierColors(section.classifier).accent600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {SECTION_TITLES[section.classifier]}
      </Text>
      <Text style={{ fontSize: 13, color: t.textSecondary }}>{count}</Text>
    </View>
  );
}

function ListTitle({ title }: { title: string }) {
  const { colors: t } = useTheme();
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "600",
        color: t.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
      }}
    >
      {title}
    </Text>
  );
}
