import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProcedureCode } from "./types";

const STORAGE_KEY = "achi_favorites";

interface FavoritesContextType {
  favorites: ProcedureCode[];
  isFavorite: (code: string) => boolean;
  toggleFavorite: (procedure: ProcedureCode) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<ProcedureCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: ProcedureCode[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  };

  const isFavorite = useCallback(
    (code: string) => {
      return favorites.some((f) => f.code === code);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (procedure: ProcedureCode) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.code === procedure.code);
        const newFavorites = exists
          ? prev.filter((f) => f.code !== procedure.code)
          : [...prev, procedure];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    []
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, isLoading }}
    >
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
