import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, theme } from "@/lib/constants";

export default function PinnedLayout() {
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;
  const headerBackground = isLiquidGlassAvailable() ? "transparent" : t.background;

  return (
    <Stack
      screenOptions={{
        headerLargeTitleShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Збережені",
          headerLargeTitle: true,
          headerStyle: { backgroundColor: headerBackground },
          headerTintColor: colors.amber[500],
        }}
      />
    </Stack>
  );
}
