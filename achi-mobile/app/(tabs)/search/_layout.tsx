import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Stack } from "expo-router";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import type { SearchBarCommands } from "react-native-screens";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useTheme } from "@/lib/useTheme";

interface SearchContextType {
  query: string;
  debouncedQuery: string;
  isSearching: boolean;
  setQueryFromExternal: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearchQuery(): SearchContextType {
  const context = useContext(SearchContext);
  if (context === null) {
    throw new Error("useSearchQuery must be used within SearchLayout");
  }
  return context;
}

export default function SearchLayout() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBarRef = useRef<SearchBarCommands>(null) as React.RefObject<SearchBarCommands>;
  const { colors: t } = useTheme();

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
    searchBarRef.current?.setText?.(externalQuery);
  }, []);

  const handleCancelButtonPress = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery("");
    setDebouncedQuery("");
    setIsSearching(false);
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

  const contextValue = useMemo(
    () => ({ query, debouncedQuery, isSearching, setQueryFromExternal }),
    [query, debouncedQuery, isSearching, setQueryFromExternal]
  );

  return (
    <SearchContext.Provider value={contextValue}>
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
              onCancelButtonPress: handleCancelButtonPress,
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
