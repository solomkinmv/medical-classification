import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { nativeHeaderOptions } from "@/components/navigation-header";
import { useClassifier } from "@/lib/classifier-provider";
import { theme, getClassifierColors } from "@/lib/constants";

export default function ExploreLayout() {
  const colorScheme = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;
  const { activeClassifier } = useClassifier();
  const classifierColors = getClassifierColors(activeClassifier);
  const headerTitle = activeClassifier === "mkh10" ? "МКХ-10" : "АКМІ";

  return (
    <Stack
      screenOptions={{
        ...nativeHeaderOptions(t.background),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: headerTitle,
          headerLargeTitle: true,
          headerTintColor: classifierColors.accent500,
        }}
      />
      <Stack.Screen
        name="[...path]"
        options={{
          headerTintColor: classifierColors.accent500,
          headerBackTitle: "Назад",
        }}
      />
    </Stack>
  );
}
