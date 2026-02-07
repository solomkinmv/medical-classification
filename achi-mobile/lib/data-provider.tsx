import { createContext, useContext, type ReactNode } from "react";
import type { AchiData } from "./types";
import { useClassifier } from "./classifier-provider";

const AchiDataContext = createContext<AchiData | null>(null);

interface AchiDataProviderProps {
  children: ReactNode;
}

export function AchiDataProvider({ children }: AchiDataProviderProps) {
  const { activeData } = useClassifier();

  return (
    <AchiDataContext.Provider value={activeData}>
      {children}
    </AchiDataContext.Provider>
  );
}

export function useAchiData(): AchiData {
  const data = useContext(AchiDataContext);
  if (!data) {
    throw new Error("useAchiData must be used within AchiDataProvider");
  }
  return data;
}
