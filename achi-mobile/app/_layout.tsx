import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { AchiDataProvider } from "@/lib/data-provider";
import { FavoritesProvider } from "@/lib/favorites-provider";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
              headerLargeTitle: false,
              sheetGrabberVisible: true,
              sheetAllowedDetents: Platform.OS === "ios" ? [0.65, 0.9] : undefined,
              sheetInitialDetentIndex: 0,
              contentStyle: {
                backgroundColor: isLiquidGlassAvailable()
                  ? "transparent"
                  : "#FAFBFC",
              },
            }}
          />
        </Stack>
        <StatusBar style="dark" />
      </FavoritesProvider>
    </AchiDataProvider>
  );
}
