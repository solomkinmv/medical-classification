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
import type { AchiData, ClassifierType } from "./types";
import achiData from "@/data/achi.json";
import mkh10Data from "@/data/mkh10.json";

const STORAGE_KEY = "active_classifier";

interface ClassifierContextType {
  activeClassifier: ClassifierType;
  setActiveClassifier: (classifier: ClassifierType) => void;
  activeData: AchiData;
}

const ClassifierContext = createContext<ClassifierContextType | null>(null);

interface ClassifierProviderProps {
  children: ReactNode;
}

export function ClassifierProvider({ children }: ClassifierProviderProps) {
  const [activeClassifier, setActiveClassifierState] =
    useState<ClassifierType>("achi");

  useEffect(() => {
    let isMounted = true;

    const loadClassifier = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && isMounted && (stored === "achi" || stored === "mkh10")) {
          setActiveClassifierState(stored);
        }
      } catch (error) {
        console.error("Failed to load classifier preference:", error);
      }
    };

    loadClassifier();
    return () => {
      isMounted = false;
    };
  }, []);

  const setActiveClassifier = useCallback((classifier: ClassifierType) => {
    setActiveClassifierState(classifier);
    AsyncStorage.setItem(STORAGE_KEY, classifier).catch((error) => {
      console.error("Failed to save classifier preference:", error);
    });
  }, []);

  const activeData = useMemo(
    () => (activeClassifier === "achi" ? achiData : mkh10Data) as AchiData,
    [activeClassifier],
  );

  const value = useMemo(
    () => ({ activeClassifier, setActiveClassifier, activeData }),
    [activeClassifier, setActiveClassifier, activeData],
  );

  return (
    <ClassifierContext.Provider value={value}>
      {children}
    </ClassifierContext.Provider>
  );
}

export function useClassifier(): ClassifierContextType {
  const context = useContext(ClassifierContext);
  if (!context) {
    throw new Error("useClassifier must be used within ClassifierProvider");
  }
  return context;
}
