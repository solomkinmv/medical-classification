import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useColorScheme } from "nativewind";
import { SEARCH_DEBOUNCE_MS, theme } from "@/lib/constants";

interface SearchContextType {
  query: string;
  debouncedQuery: string;
  isSearching: boolean;
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
  const { colorScheme } = useColorScheme();
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  return (
    <SearchContext.Provider value={{ query, debouncedQuery, isSearching }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Пошук",
            headerLargeTitle: true,
            headerTransparent: true,
            headerBlurEffect: isLiquidGlassAvailable() ? undefined : "systemChromeMaterial",
            headerTintColor: t.text,
            headerSearchBarOptions: {
              placeholder: "Введіть код або назву...",
              onChangeText: handleChangeText,
              autoCapitalize: "none",
              inputType: "text",
            },
          }}
        />
      </Stack>
    </SearchContext.Provider>
  );
}
