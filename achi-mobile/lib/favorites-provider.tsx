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
import type { LeafCode } from "./types";

const STORAGE_KEY = "achi_favorites";

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
  const [favorites, setFavorites] = useState<LeafCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
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
  }, []);

  const saveFavorites = useCallback(async (newFavorites: LeafCode[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  }, []);

  const isFavorite = useCallback(
    (code: string) => {
      return favorites.some((f) => f.code === code);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (procedure: LeafCode) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.code === procedure.code);
        const newFavorites = exists
          ? prev.filter((f) => f.code !== procedure.code)
          : [...prev, procedure];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, isLoading }),
    [favorites, isFavorite, toggleFavorite, isLoading]
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
