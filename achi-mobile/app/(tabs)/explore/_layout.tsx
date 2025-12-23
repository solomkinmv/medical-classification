import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, theme } from "@/lib/constants";

export default function ExploreLayout() {
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
          title: "АКМІ",
          headerLargeTitle: true,
          headerStyle: { backgroundColor: headerBackground },
          headerTintColor: colors.sky[500],
        }}
      />
      <Stack.Screen
        name="[...path]"
        options={{
          headerStyle: { backgroundColor: headerBackground },
          headerTintColor: colors.sky[500],
          headerTitleStyle: { fontWeight: "600" },
          headerBackTitle: "Назад",
        }}
      />
    </Stack>
  );
}
