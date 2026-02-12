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
import { useProStatus } from "./pro-provider";
import { BOOKMARK_LIMIT_FREE } from "./constants";
import type { ClassifierType, LeafCode } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_favorites`;
}

interface ToggleFavoriteResult {
  limitReached: boolean;
}

interface FavoritesContextType {
  favorites: LeafCode[];
  isFavorite: (code: string) => boolean;
  toggleFavorite: (item: LeafCode) => ToggleFavoriteResult;
  canAddFavorite: boolean;
  favoritesRemaining: number;
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

  const favorites = cache[activeClassifier] ?? [];

  const canAddFavorite = isPro || favorites.length < BOOKMARK_LIMIT_FREE;
  const favoritesRemaining = isPro
    ? Infinity
    : Math.max(0, BOOKMARK_LIMIT_FREE - favorites.length);

  const isFavorite = useCallback(
    (code: string) => {
      return favorites.some((f) => f.code === code);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (procedure: LeafCode): ToggleFavoriteResult => {
      const current = cache[activeClassifier] ?? [];
      const exists = current.some((f) => f.code === procedure.code);

      if (!exists && !isPro && current.length >= BOOKMARK_LIMIT_FREE) {
        return { limitReached: true };
      }

      setCache((prev) => {
        const currentInner = prev[activeClassifier] ?? [];
        const existsInner = currentInner.some(
          (f) => f.code === procedure.code,
        );
        const newFavorites = existsInner
          ? currentInner.filter((f) => f.code !== procedure.code)
          : [...currentInner, procedure];
        AsyncStorage.setItem(
          getStorageKey(activeClassifier),
          JSON.stringify(newFavorites),
        ).catch((error) => {
          console.error("Failed to save favorites:", error);
        });
        return { ...prev, [activeClassifier]: newFavorites };
      });
      return { limitReached: false };
    },
    [activeClassifier, cache, isPro],
  );

  const isReady = !isLoading;

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      canAddFavorite,
      favoritesRemaining,
      isLoading,
      isReady,
    }),
    [
      favorites,
      isFavorite,
      toggleFavorite,
      canAddFavorite,
      favoritesRemaining,
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
