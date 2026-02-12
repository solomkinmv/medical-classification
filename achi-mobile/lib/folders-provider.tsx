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
import { randomUUID } from "expo-crypto";
import { useClassifier } from "./classifier-provider";
import type { ClassifierType, Folder } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_folders`;
}

interface FoldersContextType {
  folders: Folder[];
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  addToFolder: (folderId: string, code: string) => void;
  removeFromFolder: (folderId: string, code: string) => void;
  getFolderForCode: (code: string) => Folder | null;
  isReady: boolean;
}

const FoldersContext = createContext<FoldersContextType | null>(null);

interface FoldersProviderProps {
  children: ReactNode;
}

export function FoldersProvider({ children }: FoldersProviderProps) {
  const { activeClassifier } = useClassifier();
  const [cache, setCache] = useState<Record<string, Folder[]>>({});
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
          const parse = (raw: string | null): Folder[] => {
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
        console.error("Failed to load folders:", error);
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

  const folders = cache[activeClassifier] ?? [];

  const persist = useCallback(
    (classifier: ClassifierType, newFolders: Folder[]) => {
      AsyncStorage.setItem(
        getStorageKey(classifier),
        JSON.stringify(newFolders),
      ).catch((error) => {
        console.error("Failed to save folders:", error);
      });
    },
    [],
  );

  const createFolder = useCallback(
    (name: string): Folder => {
      const folder: Folder = {
        id: randomUUID(),
        name,
        classifier: activeClassifier,
        codeRefs: [],
      };
      setCache((prev) => {
        const current = prev[activeClassifier] ?? [];
        const updated = [...current, folder];
        persist(activeClassifier, updated);
        return { ...prev, [activeClassifier]: updated };
      });
      return folder;
    },
    [activeClassifier, persist],
  );

  const deleteFolder = useCallback(
    (id: string) => {
      setCache((prev) => {
        const current = prev[activeClassifier] ?? [];
        const updated = current.filter((f) => f.id !== id);
        persist(activeClassifier, updated);
        return { ...prev, [activeClassifier]: updated };
      });
    },
    [activeClassifier, persist],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      setCache((prev) => {
        const current = prev[activeClassifier] ?? [];
        const updated = current.map((f) =>
          f.id === id ? { ...f, name } : f,
        );
        persist(activeClassifier, updated);
        return { ...prev, [activeClassifier]: updated };
      });
    },
    [activeClassifier, persist],
  );

  const addToFolder = useCallback(
    (folderId: string, code: string) => {
      setCache((prev) => {
        const current = prev[activeClassifier] ?? [];
        const updated = current.map((f) => {
          if (f.id !== folderId) return f;
          if (f.codeRefs.includes(code)) return f;
          return { ...f, codeRefs: [...f.codeRefs, code] };
        });
        persist(activeClassifier, updated);
        return { ...prev, [activeClassifier]: updated };
      });
    },
    [activeClassifier, persist],
  );

  const removeFromFolder = useCallback(
    (folderId: string, code: string) => {
      setCache((prev) => {
        const current = prev[activeClassifier] ?? [];
        const updated = current.map((f) => {
          if (f.id !== folderId) return f;
          return { ...f, codeRefs: f.codeRefs.filter((c) => c !== code) };
        });
        persist(activeClassifier, updated);
        return { ...prev, [activeClassifier]: updated };
      });
    },
    [activeClassifier, persist],
  );

  const getFolderForCode = useCallback(
    (code: string): Folder | null => {
      return folders.find((f) => f.codeRefs.includes(code)) ?? null;
    },
    [folders],
  );

  const isReady = !isLoading;

  const value = useMemo(
    () => ({
      folders,
      createFolder,
      deleteFolder,
      renameFolder,
      addToFolder,
      removeFromFolder,
      getFolderForCode,
      isReady,
    }),
    [
      folders,
      createFolder,
      deleteFolder,
      renameFolder,
      addToFolder,
      removeFromFolder,
      getFolderForCode,
      isReady,
    ],
  );

  return (
    <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>
  );
}

export function useFolders(): FoldersContextType {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error("useFolders must be used within FoldersProvider");
  }
  return context;
}
