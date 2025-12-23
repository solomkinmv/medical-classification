import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, theme } from "@/lib/constants";

export default function ExploreLayout() {
  const colorScheme = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;
  const headerBg = isLiquidGlassAvailable() ? "transparent" : t.background;

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
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: colors.sky[500],
        }}
      />
      <Stack.Screen
        name="[...path]"
        options={{
          headerStyle: { backgroundColor: t.background },
          headerTintColor: colors.sky[500],
          headerBackTitle: "Назад",
        }}
      />
    </Stack>
  );
}
