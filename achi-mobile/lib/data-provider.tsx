import { createContext, useContext, type ReactNode } from "react";
import type { AchiData } from "./types";
import achiData from "@/data/achi.json";

const AchiDataContext = createContext<AchiData | null>(null);

interface AchiDataProviderProps {
  children: ReactNode;
}

export function AchiDataProvider({ children }: AchiDataProviderProps) {
  return (
    <AchiDataContext.Provider value={achiData as AchiData}>
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
