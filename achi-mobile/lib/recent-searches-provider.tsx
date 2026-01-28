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

const STORAGE_KEY = "achi_recent_searches";

interface RecentSearchesContextType {
  recentSearches: string[];
  lastSearchQuery: string | null;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  isLoading: boolean;
}

const RecentSearchesContext = createContext<RecentSearchesContextType | null>(null);

interface RecentSearchesProviderProps {
  children: ReactNode;
}

export function RecentSearchesProvider({ children }: RecentSearchesProviderProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed);
            if (parsed.length > 0) {
              setLastSearchQuery(parsed[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecentSearches();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveRecentSearches = async (searches: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Failed to save recent searches:", error);
    }
  };

  const addRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const newSearches = [trimmed, ...filtered].slice(0, RECENT_SEARCHES_MAX_COUNT);
      saveRecentSearches(newSearches).catch((error) => {
        console.error("Failed to save recent search:", error);
      });
      return newSearches;
    });
    setLastSearchQuery(trimmed);
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((s) => s !== query);
      saveRecentSearches(newSearches).catch((error) => {
        console.error("Failed to save recent searches:", error);
      });
      // Update lastSearchQuery: if removed query was active, switch to next available
      setLastSearchQuery((prevQuery) =>
        prevQuery === query ? (newSearches[0] ?? null) : prevQuery
      );
      return newSearches;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    setLastSearchQuery(null);
    saveRecentSearches([]).catch((error) => {
      console.error("Failed to clear recent searches:", error);
    });
  }, []);

  const value = useMemo(
    () => ({
      recentSearches,
      lastSearchQuery,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
      isLoading,
    }),
    [recentSearches, lastSearchQuery, addRecentSearch, removeRecentSearch, clearRecentSearches, isLoading]
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
    throw new Error("useRecentSearches must be used within RecentSearchesProvider");
  }
  return context;
}
