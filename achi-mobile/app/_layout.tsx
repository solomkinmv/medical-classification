import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { AchiDataProvider } from "@/lib/data-provider";
import { FavoritesProvider } from "@/lib/favorites-provider";
import { theme } from "@/lib/constants";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AchiDataProvider>
      <FavoritesProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="procedure/[code]"
            options={{
              presentation: Platform.OS === "ios" ? "formSheet" : "modal",
              headerShown: true,
              headerTransparent: Platform.OS === "ios" ? true : false,
              headerBlurEffect: isLiquidGlassAvailable()
                ? undefined
                : "systemChromeMaterial",
              headerStyle: {
                backgroundColor: "transparent",
              },
              headerTintColor: t.text,
              headerLargeTitle: false,
              sheetGrabberVisible: true,
              sheetAllowedDetents: Platform.OS === "ios" ? [0.65, 0.9] : undefined,
              sheetInitialDetentIndex: 0,
              contentStyle: {
                backgroundColor: isLiquidGlassAvailable()
                  ? "transparent"
                  : t.background,
              },
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </FavoritesProvider>
    </AchiDataProvider>
  );
}
