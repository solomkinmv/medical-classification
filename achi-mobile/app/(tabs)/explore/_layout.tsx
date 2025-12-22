import { Stack } from "expo-router";

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[...path]"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: "systemChromeMaterial",
          headerTintColor: "#0ea5e9",
          headerTitleStyle: { fontWeight: "600" },
          headerBackTitle: "Назад",
        }}
      />
    </Stack>
  );
}
