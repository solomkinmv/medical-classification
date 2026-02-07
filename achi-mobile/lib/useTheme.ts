import { useMemo } from "react";
import { useColorScheme } from "nativewind";
import { theme } from "./constants";

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return useMemo(
    () => ({ colorScheme, isDark, colors: isDark ? theme.dark : theme.light }),
    [colorScheme, isDark],
  );
}
