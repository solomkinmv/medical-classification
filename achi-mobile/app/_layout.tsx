import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { ClassifierProvider, useClassifier } from "@/lib/classifier-provider";
import { FavoritesProvider, useFavorites } from "@/lib/favorites-provider";
import {
  RecentSearchesProvider,
  useRecentSearches,
} from "@/lib/recent-searches-provider";
import { theme } from "@/lib/constants";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <ClassifierProvider>
          <FavoritesProvider>
            <RecentSearchesProvider>
              <AppContent />
            </RecentSearchesProvider>
          </FavoritesProvider>
        </ClassifierProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { isReady: classifierReady } = useClassifier();
  const { isReady: favoritesReady } = useFavorites();
  const { isReady: searchesReady } = useRecentSearches();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  const allReady = classifierReady && favoritesReady && searchesReady;

  useEffect(() => {
    if (allReady) {
      SplashScreen.hideAsync();
    }
  }, [allReady]);

  return (
    <>
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
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.65, 0.9] : undefined,
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
    </>
  );
}
