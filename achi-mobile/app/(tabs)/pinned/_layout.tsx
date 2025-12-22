import { Stack } from "expo-router";
import { colors } from "@/lib/constants";

export default function PinnedLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: "systemChromeMaterial",
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Збережені",
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: "transparent" },
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: colors.amber[500],
        }}
      />
    </Stack>
  );
}
