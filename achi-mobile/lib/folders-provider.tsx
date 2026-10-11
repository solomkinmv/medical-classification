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
import { CLASSIFIERS } from "./code-index";
import type { ClassifierType, Folder } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_folders`;
}

interface FoldersContextType {
  folders: Folder[];
  getFolders: (classifier: ClassifierType) => Folder[];
  createFolder: (name: string, classifier?: ClassifierType) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  addToFolder: (folderId: string, code: string) => void;
  removeFromFolder: (folderId: string, code: string) => void;
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

  const getFolders = useCallback(
    (classifier: ClassifierType) => cache[classifier] ?? [],
    [cache],
  );

  const createFolder = useCallback(
    (name: string, classifier: ClassifierType = activeClassifier): Folder => {
      const folder: Folder = {
        id: randomUUID(),
        name: name.trim(),
        classifier,
        codeRefs: [],
      };
      setCache((prev) => {
        const current = prev[classifier];
        if (!current) return prev;
        const updated = [...current, folder];
        persist(classifier, updated);
        return { ...prev, [classifier]: updated };
      });
      return folder;
    },
    [activeClassifier, persist],
  );

  /** Apply a change to the bucket that holds the folder; null keeps it as is */
  const updateFolders = useCallback(
    (folderId: string, change: (current: Folder[]) => Folder[] | null) => {
      setCache((prev) => {
        for (const classifier of CLASSIFIERS) {
          const current = prev[classifier];
          if (!current?.some((f) => f.id === folderId)) continue;
          const updated = change(current);
          if (!updated) return prev;
          persist(classifier, updated);
          return { ...prev, [classifier]: updated };
        }
        return prev;
      });
    },
    [persist],
  );

  const deleteFolder = useCallback(
    (id: string) =>
      updateFolders(id, (current) => current.filter((f) => f.id !== id)),
    [updateFolders],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateFolders(id, (current) =>
        current.map((f) => (f.id === id ? { ...f, name: trimmed } : f)),
      );
    },
    [updateFolders],
  );

  const addToFolder = useCallback(
    (folderId: string, code: string) =>
      updateFolders(folderId, (current) =>
        current.some((f) => f.id === folderId && f.codeRefs.includes(code))
          ? null
          : current.map((f) =>
              f.id === folderId ? { ...f, codeRefs: [...f.codeRefs, code] } : f,
            ),
      ),
    [updateFolders],
  );

  const removeFromFolder = useCallback(
    (folderId: string, code: string) =>
      updateFolders(folderId, (current) =>
        current.some((f) => f.id === folderId && f.codeRefs.includes(code))
          ? current.map((f) =>
              f.id === folderId
                ? { ...f, codeRefs: f.codeRefs.filter((c) => c !== code) }
                : f,
            )
          : null,
      ),
    [updateFolders],
  );

  const isReady = !isLoading && cache[activeClassifier] !== undefined;

  const value = useMemo(
    () => ({
      folders,
      getFolders,
      createFolder,
      deleteFolder,
      renameFolder,
      addToFolder,
      removeFromFolder,
      isReady,
    }),
    [
      folders,
      getFolders,
      createFolder,
      deleteFolder,
      renameFolder,
      addToFolder,
      removeFromFolder,
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
