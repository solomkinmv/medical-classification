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
import { RECENT_SEARCHES_MAX_COUNT } from "./constants";
import type { ClassifierType } from "./types";

const STORAGE_KEY = "recent_searches";

// Search used to be per classifier; seed the shared list from both old ones
function getLegacyStorageKey(classifier: ClassifierType): string {
  return `${classifier}_recent_searches`;
}

function parseSearches(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function mergeLegacySearches(lists: string[][]): string[] {
  const merged: string[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const query = list[i];
      if (query !== undefined && !merged.includes(query)) merged.push(query);
    }
  }
  return merged.slice(0, RECENT_SEARCHES_MAX_COUNT);
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

export function RecentSearchesProvider({
  children,
}: RecentSearchesProviderProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let searches = parseSearches(stored);
        if (stored === null) {
          const legacy = await Promise.all(
            (["achi", "mkh10"] as const).map((classifier) =>
              AsyncStorage.getItem(getLegacyStorageKey(classifier)),
            ),
          );
          searches = mergeLegacySearches(legacy.map(parseSearches));
          if (searches.length > 0) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
          }
        }
        if (isMounted) {
          setRecentSearches(searches);
          setLastSearchQuery(searches[0] ?? null);
        }
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveSearches = useCallback((searches: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches)).catch(
      (error) => {
        console.error("Failed to save recent searches:", error);
      },
    );
  }, []);

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setRecentSearches((current) => {
        const newSearches = [
          trimmed,
          ...current.filter((s) => s !== trimmed),
        ].slice(0, RECENT_SEARCHES_MAX_COUNT);
        saveSearches(newSearches);
        return newSearches;
      });
      setLastSearchQuery(trimmed);
    },
    [saveSearches],
  );

  const removeRecentSearch = useCallback(
    (query: string) => {
      setRecentSearches((current) => {
        const newSearches = current.filter((s) => s !== query);
        saveSearches(newSearches);
        setLastSearchQuery((last) =>
          last === query ? (newSearches[0] ?? null) : last,
        );
        return newSearches;
      });
    },
    [saveSearches],
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    setLastSearchQuery(null);
    saveSearches([]);
  }, [saveSearches]);

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
