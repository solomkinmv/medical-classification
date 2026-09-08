import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { nativeHeaderOptions } from "@/components/navigation-header";
import { colors, theme } from "@/lib/constants";

export default function AboutLayout() {
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
          title: "Про додаток",
          headerLargeTitle: true,
          headerTintColor: colors.violet[500],
        }}
      />
    </Stack>
  );
}
