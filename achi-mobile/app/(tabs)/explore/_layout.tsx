import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useClassifier } from "@/lib/classifier-provider";
import { theme, getClassifierColors } from "@/lib/constants";

export default function ExploreLayout() {
  const colorScheme = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;
  const headerBg = isLiquidGlassAvailable() ? "transparent" : t.background;
  const { activeClassifier } = useClassifier();
  const classifierColors = getClassifierColors(activeClassifier);
  const headerTitle = activeClassifier === "mkh10" ? "МКХ-10" : "АКМІ";

  return (
    <Stack
      screenOptions={{
        headerLargeTitleShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: headerTitle,
          headerLargeTitle: true,
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: classifierColors.accent500,
        }}
      />
      <Stack.Screen
        name="[...path]"
        options={{
          headerStyle: { backgroundColor: t.background },
          headerTintColor: classifierColors.accent500,
          headerBackTitle: "Назад",
        }}
      />
    </Stack>
  );
}
