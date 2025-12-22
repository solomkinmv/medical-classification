import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { colors } from "@/lib/constants";

export default function AboutLayout() {
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
          title: "Про додаток",
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: "transparent" },
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colors.violet[500],
        }}
      />
    </Stack>
  );
}
