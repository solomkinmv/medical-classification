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
import type { ClassifierType } from "./types";

function getStorageKey(classifier: ClassifierType): string {
  return `${classifier}_notes`;
}

interface NotesContextType {
  getNote: (code: string) => string | null;
  setNote: (code: string, text: string, classifier?: ClassifierType) => void;
  deleteNote: (code: string, classifier?: ClassifierType) => void;
  hasNote: (code: string) => boolean;
  isReady: boolean;
}

const NotesContext = createContext<NotesContextType | null>(null);

interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const { activeClassifier } = useClassifier();
  const [cache, setCache] = useState<Record<string, Record<string, string>>>(
    {},
  );
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
          const parse = (raw: string | null): Record<string, string> => {
            if (!raw) return {};
            try {
              const parsed = JSON.parse(raw);
              return typeof parsed === "object" &&
                parsed !== null &&
                !Array.isArray(parsed)
                ? parsed
                : {};
            } catch {
              return {};
            }
          };
          setCache({
            achi: parse(achiStored),
            mkh10: parse(mkh10Stored),
          });
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
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

  // Codes never overlap between classifiers, so lookups search every bucket
  const notes = useMemo(() => {
    const merged: Record<string, string> = {};
    for (const bucket of Object.values(cache)) Object.assign(merged, bucket);
    return merged;
  }, [cache]);

  const persist = useCallback(
    (classifier: ClassifierType, newNotes: Record<string, string>) => {
      AsyncStorage.setItem(
        getStorageKey(classifier),
        JSON.stringify(newNotes),
      ).catch((error) => {
        console.error("Failed to save notes:", error);
      });
    },
    [],
  );

  const getNote = useCallback(
    (code: string): string | null => {
      return notes[code] ?? null;
    },
    [notes],
  );

  const setNote = useCallback(
    (
      code: string,
      text: string,
      classifier: ClassifierType = activeClassifier,
    ) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setCache((prev) => {
          if (!prev[classifier]) return prev;
          const current = prev[classifier] ?? {};
          const { [code]: _, ...updated } = current;
          persist(classifier, updated);
          return { ...prev, [classifier]: updated };
        });
        return;
      }
      setCache((prev) => {
        if (!prev[classifier]) return prev;
        const current = prev[classifier] ?? {};
        const updated = { ...current, [code]: trimmed };
        persist(classifier, updated);
        return { ...prev, [classifier]: updated };
      });
    },
    [activeClassifier, persist],
  );

  const deleteNote = useCallback(
    (code: string, classifier: ClassifierType = activeClassifier) => {
      setCache((prev) => {
        if (!prev[classifier]) return prev;
        const current = prev[classifier] ?? {};
        const { [code]: _, ...updated } = current;
        persist(classifier, updated);
        return { ...prev, [classifier]: updated };
      });
    },
    [activeClassifier, persist],
  );

  const hasNote = useCallback(
    (code: string): boolean => {
      return Object.hasOwn(notes, code);
    },
    [notes],
  );

  const isReady = !isLoading && cache[activeClassifier] !== undefined;

  const value = useMemo(
    () => ({
      getNote,
      setNote,
      deleteNote,
      hasNote,
      isReady,
    }),
    [getNote, setNote, deleteNote, hasNote, isReady],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

export function useNotes(): NotesContextType {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within NotesProvider");
  }
  return context;
}
