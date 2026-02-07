import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClassifier } from "./classifier-provider";
import { RECENT_SEARCHES_MAX_COUNT } from "./constants";
import type { ClassifierType } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_recent_searches`;
}

interface RecentSearchesContextType {
  recentSearches: string[];
  lastSearchQuery: string | null;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  isLoading: boolean;
  isReady: boolean;
}

const RecentSearchesContext = createContext<RecentSearchesContextType | null>(
  null,
);

interface RecentSearchesProviderProps {
  children: ReactNode;
}

interface CachedSearches {
  searches: string[];
  lastQuery: string | null;
}

export function RecentSearchesProvider({
  children,
}: RecentSearchesProviderProps) {
  const { activeClassifier } = useClassifier();
  const [cache, setCache] = useState<Record<string, CachedSearches>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      try {
        const [achiStored, mkh10Stored] = await Promise.all([
          AsyncStorage.getItem(getStorageKey("achi")),
          AsyncStorage.getItem(getStorageKey("mkh10")),
        ]);

        if (isMounted) {
          const parse = (raw: string | null): CachedSearches => {
            if (!raw) return { searches: [], lastQuery: null };
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                return {
                  searches: parsed,
                  lastQuery: parsed.length > 0 ? parsed[0] : null,
                };
              }
            } catch {
              // ignore parse errors
            }
            return { searches: [], lastQuery: null };
          };
          setCache({
            achi: parse(achiStored),
            mkh10: parse(mkh10Stored),
          });
        }
      } catch (error) {
        console.error("Failed to load recent searches:", error);
        if (isMounted) {
          setCache({
            achi: { searches: [], lastQuery: null },
            mkh10: { searches: [], lastQuery: null },
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const cached = cache[activeClassifier] ?? { searches: [], lastQuery: null };
  const recentSearches = cached.searches;
  const lastSearchQuery = cached.lastQuery;

  const saveSearches = useCallback(
    (searches: string[]) => {
      AsyncStorage.setItem(
        getStorageKey(activeClassifier),
        JSON.stringify(searches),
      ).catch((error) => {
        console.error("Failed to save recent searches:", error);
      });
    },
    [activeClassifier],
  );

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setCache((prev) => {
        const current = prev[activeClassifier] ?? {
          searches: [],
          lastQuery: null,
        };
        const filtered = current.searches.filter((s) => s !== trimmed);
        const newSearches = [trimmed, ...filtered].slice(
          0,
          RECENT_SEARCHES_MAX_COUNT,
        );
        saveSearches(newSearches);
        return {
          ...prev,
          [activeClassifier]: { searches: newSearches, lastQuery: trimmed },
        };
      });
    },
    [activeClassifier, saveSearches],
  );

  const removeRecentSearch = useCallback(
    (query: string) => {
      setCache((prev) => {
        const current = prev[activeClassifier] ?? {
          searches: [],
          lastQuery: null,
        };
        const newSearches = current.searches.filter((s) => s !== query);
        saveSearches(newSearches);
        const newLastQuery =
          current.lastQuery === query
            ? (newSearches[0] ?? null)
            : current.lastQuery;
        return {
          ...prev,
          [activeClassifier]: {
            searches: newSearches,
            lastQuery: newLastQuery,
          },
        };
      });
    },
    [activeClassifier, saveSearches],
  );

  const clearRecentSearches = useCallback(() => {
    setCache((prev) => ({
      ...prev,
      [activeClassifier]: { searches: [], lastQuery: null },
    }));
    saveSearches([]);
  }, [activeClassifier, saveSearches]);

  const isReady = !isLoading;

  const value = useMemo(
    () => ({
      recentSearches,
      lastSearchQuery,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
      isLoading,
      isReady,
    }),
    [
      recentSearches,
      lastSearchQuery,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
      isLoading,
      isReady,
    ],
  );

  return (
    <RecentSearchesContext.Provider value={value}>
      {children}
    </RecentSearchesContext.Provider>
  );
}

export function useRecentSearches(): RecentSearchesContextType {
  const context = useContext(RecentSearchesContext);
  if (!context) {
    throw new Error(
      "useRecentSearches must be used within RecentSearchesProvider",
    );
  }
  return context;
}
