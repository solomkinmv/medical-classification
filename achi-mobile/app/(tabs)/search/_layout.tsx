import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import type { SearchBarCommands } from "react-native-screens";
import { SEARCH_DEBOUNCE_MS, theme } from "@/lib/constants";

interface SearchContextType {
  query: string;
  debouncedQuery: string;
  isSearching: boolean;
  setQueryFromExternal: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearchQuery(): SearchContextType {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchQuery must be used within SearchLayout");
  }
  return context;
}

export default function SearchLayout() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBarRef = useRef<SearchBarCommands>(null!);
  const colorScheme = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  const handleChangeText = useCallback((event: { nativeEvent: { text: string } }) => {
    const text = event.nativeEvent.text;
    setQuery(text);
    setIsSearching(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const setQueryFromExternal = useCallback((externalQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery(externalQuery);
    setDebouncedQuery(externalQuery);
    setIsSearching(false);
    searchBarRef.current?.setText(externalQuery);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  const headerBg = isLiquidGlassAvailable() ? "transparent" : t.background;

  return (
    <SearchContext.Provider value={{ query, debouncedQuery, isSearching, setQueryFromExternal }}>
      <Stack
        screenOptions={{
          headerLargeTitleShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Пошук",
            headerLargeTitle: true,
            headerStyle: { backgroundColor: headerBg },
            headerTintColor: t.text,
            headerSearchBarOptions: {
              ref: searchBarRef,
              placeholder: "Введіть код або назву...",
              onChangeText: handleChangeText,
              autoCapitalize: "none",
              inputType: "text",
              autoFocus: true,
            },
          }}
        />
      </Stack>
    </SearchContext.Provider>
  );
}
