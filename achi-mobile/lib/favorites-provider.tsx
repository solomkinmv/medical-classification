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
import type { ClassifierType, LeafCode } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_favorites`;
}

interface FavoritesContextType {
  favorites: LeafCode[];
  isFavorite: (code: string) => boolean;
  toggleFavorite: (item: LeafCode) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { activeClassifier } = useClassifier();
  const [favorites, setFavorites] = useState<LeafCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadFavorites = async () => {
      try {
        const key = getStorageKey(activeClassifier);
        const stored = await AsyncStorage.getItem(key);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          } else {
            setFavorites([]);
          }
        } else if (isMounted) {
          setFavorites([]);
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
        if (isMounted) {
          setFavorites([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, [activeClassifier]);

  const saveFavorites = useCallback(
    async (newFavorites: LeafCode[]) => {
      try {
        const key = getStorageKey(activeClassifier);
        await AsyncStorage.setItem(key, JSON.stringify(newFavorites));
      } catch (error) {
        console.error("Failed to save favorites:", error);
      }
    },
    [activeClassifier],
  );

  const isFavorite = useCallback(
    (code: string) => {
      return favorites.some((f) => f.code === code);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (procedure: LeafCode) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.code === procedure.code);
        const newFavorites = exists
          ? prev.filter((f) => f.code !== procedure.code)
          : [...prev, procedure];
        saveFavorites(newFavorites).catch((error) => {
          console.error("Failed to save favorites:", error);
        });
        return newFavorites;
      });
    },
    [saveFavorites],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, isLoading }),
    [favorites, isFavorite, toggleFavorite, isLoading],
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
