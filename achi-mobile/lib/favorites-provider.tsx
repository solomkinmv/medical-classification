import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useClassifier } from "./classifier-provider";
import { useProStatus } from "./pro-provider";
import { BOOKMARK_LIMIT_FREE } from "./constants";
import { findCode } from "./code-index";
import type { ClassifierType, LeafCode } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_favorites`;
}

interface ToggleFavoriteResult {
  limitReached: boolean;
}

interface FavoritesContextType {
  /** Bookmarks of the active classifier with names from the current data */
  favorites: LeafCode[];
  getFavorites: (classifier: ClassifierType) => LeafCode[];
  isFavorite: (code: string) => boolean;
  /** Bookmarked code that is missing from the current classifier data */
  isRemoved: (code: string) => boolean;
  /** Saved snapshot of a bookmark, for codes missing from the current data */
  getSavedCode: (code: string) => LeafCode | null;
  toggleFavorite: (
    item: LeafCode,
    classifier?: ClassifierType,
  ) => ToggleFavoriteResult;
  isLoading: boolean;
  isReady: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { activeClassifier } = useClassifier();
  const { isPro } = useProStatus();
  const [cache, setCache] = useState<Record<string, LeafCode[]>>({});
  const cacheRef = useRef(cache);
  cacheRef.current = cache;
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
          const parse = (raw: string | null): LeafCode[] => {
            if (!raw) return [];
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          };
          setCache({
            achi: parse(achiStored),
            mkh10: parse(mkh10Stored),
          });
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
        if (isMounted) {
          setCache({ achi: [], mkh10: [] });
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

  const getFavorites = useCallback(
    (classifier: ClassifierType) =>
      (cache[classifier] ?? []).map((f) => findCode(f.code)?.leaf ?? f),
    [cache],
  );
  const favorites = useMemo(
    () => getFavorites(activeClassifier),
    [getFavorites, activeClassifier],
  );

  const isFavorite = useCallback(
    (code: string) =>
      Object.values(cache).some((list) => list.some((f) => f.code === code)),
    [cache],
  );

  const getSavedCode = useCallback(
    (code: string) => {
      for (const list of Object.values(cache)) {
        const found = list.find((f) => f.code === code);
        if (found) return found;
      }
      return null;
    },
    [cache],
  );

  const isRemoved = useCallback(
    (code: string) => getSavedCode(code) !== null && findCode(code) === null,
    [getSavedCode],
  );

  const toggleFavorite = useCallback(
    (
      procedure: LeafCode,
      classifier: ClassifierType = activeClassifier,
    ): ToggleFavoriteResult => {
      const current = cacheRef.current[classifier] ?? [];
      const exists = current.some((f) => f.code === procedure.code);

      if (!exists && !isPro && current.length >= BOOKMARK_LIMIT_FREE) {
        return { limitReached: true };
      }

      setCache((prev) => {
        const latest = prev[classifier] ?? [];
        const stillExists = latest.some((f) => f.code === procedure.code);

        if (!stillExists && !isPro && latest.length >= BOOKMARK_LIMIT_FREE) {
          return prev;
        }

        const newFavorites = stillExists
          ? latest.filter((f) => f.code !== procedure.code)
          : [...latest, procedure];
        const next = { ...prev, [classifier]: newFavorites };
        cacheRef.current = next;
        AsyncStorage.setItem(
          getStorageKey(classifier),
          JSON.stringify(newFavorites),
        ).catch((error) => {
          console.error("Failed to save favorites:", error);
        });
        return next;
      });
      return { limitReached: false };
    },
    [activeClassifier, isPro],
  );

  const isReady = !isLoading;

  const value = useMemo(
    () => ({
      favorites,
      getFavorites,
      isFavorite,
      isRemoved,
      getSavedCode,
      toggleFavorite,
      isLoading,
      isReady,
    }),
    [
      favorites,
      getFavorites,
      isFavorite,
      isRemoved,
      getSavedCode,
      toggleFavorite,
      isLoading,
      isReady,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
