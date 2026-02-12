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
import { ProProvider } from "@/lib/pro-provider";
import { FavoritesProvider, useFavorites } from "@/lib/favorites-provider";
import { FoldersProvider } from "@/lib/folders-provider";
import { NotesProvider } from "@/lib/notes-provider";
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
          <ProProvider>
            <FavoritesProvider>
              <FoldersProvider>
                <NotesProvider>
                  <RecentSearchesProvider>
                    <AppContent />
                  </RecentSearchesProvider>
                </NotesProvider>
              </FoldersProvider>
            </FavoritesProvider>
          </ProProvider>
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
          name="pro"
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
            sheetGrabberVisible: true,
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.85] : undefined,
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : t.background,
            },
          }}
        />
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
        <Stack.Screen
          name="folder/[id]"
          options={{
            headerShown: true,
            headerTransparent: Platform.OS === "ios" ? true : false,
            headerBlurEffect: isLiquidGlassAvailable()
              ? undefined
              : "systemChromeMaterial",
            headerStyle: {
              backgroundColor: "transparent",
            },
            headerTintColor: t.text,
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
