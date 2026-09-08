import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { nativeHeaderOptions } from "@/components/navigation-header";
import { colors, theme } from "@/lib/constants";

export default function PinnedLayout() {
  const colorScheme = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  return (
    <Stack
      screenOptions={{
        ...nativeHeaderOptions(t.background),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Збережені",
          headerLargeTitle: true,
          headerTintColor: colors.amber[500],
        }}
      />
    </Stack>
  );
}
