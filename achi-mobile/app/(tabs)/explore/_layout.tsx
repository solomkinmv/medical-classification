import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { colors } from "@/lib/constants";

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: isLiquidGlassAvailable() ? undefined : "systemChromeMaterial",
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "АКМІ",
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: "transparent" },
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colors.sky[500],
        }}
      />
      <Stack.Screen
        name="[...path]"
        options={{
          headerTintColor: colors.sky[500],
          headerTitleStyle: { fontWeight: "600" },
          headerBackTitle: "Назад",
        }}
      />
    </Stack>
  );
}
