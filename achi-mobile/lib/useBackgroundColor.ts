import { useMemo } from "react";
import { Platform } from "react-native";
import { useColorScheme } from "nativewind";
import { theme } from "./constants";

let cachedIsLiquidGlass: boolean | null = null;

function getIsLiquidGlass(): boolean {
  if (Platform.OS !== "ios") return false;

  if (cachedIsLiquidGlass === null) {
    try {
      const { isLiquidGlassAvailable } = require("expo-glass-effect");
      cachedIsLiquidGlass = Boolean(isLiquidGlassAvailable());
    } catch {
      cachedIsLiquidGlass = false;
    }
  }
  return cachedIsLiquidGlass ?? false;
}

export function useBackgroundColor(): string {
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  return useMemo(() => {
    if (getIsLiquidGlass()) {
      return "transparent";
    }
    return t.background;
  }, [t.background]);
}
