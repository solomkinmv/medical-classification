import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { searchProcedures, type SearchResult } from "@/lib/search";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const data = useAchiData();
  const insets = useSafeAreaInsets();

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchProcedures(data, query, 100);
  }, [data, query]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{ paddingTop: insets.top }}
        className="bg-sky-500 pb-4 px-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-white">Пошук</Text>
          <Pressable
            onPress={() => router.dismiss()}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="white" />
          </Pressable>
        </View>

        <View className="flex-row items-center bg-white/20 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
          <TextInput
            className="flex-1 ml-3 text-base text-white"
            placeholder="Введіть код або назву..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </View>

      {query.length < 2 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-4">
            <Ionicons name="search-outline" size={40} color="#9ca3af" />
          </View>
          <Text className="text-gray-500 text-center">
            Введіть щонайменше 2 символи для пошуку
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={40} color="#9ca3af" />
          </View>
          <Text className="text-xl font-semibold text-gray-700 text-center">
            Нічого не знайдено
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Спробуйте інший пошуковий запит
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.code.code}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text className="text-sm text-gray-500 mb-3">
              Знайдено: {results.length} {results.length === 1 ? "результат" : results.length < 5 ? "результати" : "результатів"}
            </Text>
          }
          renderItem={({ item }) => <SearchResultCard result={item} />}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isPinned = isFavorite(result.code.code);

  return (
    <View className="mb-3 rounded-2xl overflow-hidden">
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint="light" className="p-4">
          <SearchResultContent
            result={result}
            isPinned={isPinned}
            onToggle={() => toggleFavorite(result.code)}
          />
        </BlurView>
      ) : (
        <View className="p-4 bg-white/90">
          <SearchResultContent
            result={result}
            isPinned={isPinned}
            onToggle={() => toggleFavorite(result.code)}
          />
        </View>
      )}
    </View>
  );
}

function SearchResultContent({
  result,
  isPinned,
  onToggle,
}: {
  result: SearchResult;
  isPinned: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <View className="bg-sky-500/10 self-start px-3 py-1.5 rounded-lg mb-3">
          <Text className="text-base text-sky-600 font-bold">
            {result.code.code}
          </Text>
        </View>
        <Text className="text-base text-gray-800 font-medium mb-2">
          {result.code.name_ua}
        </Text>
        <Text className="text-sm text-gray-500 italic" numberOfLines={2}>
          {result.code.name_en}
        </Text>
      </View>
      <Pressable
        onPress={onToggle}
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{
          backgroundColor: isPinned
            ? "rgba(245, 158, 11, 0.15)"
            : "rgba(156, 163, 175, 0.1)",
        }}
      >
        <Ionicons
          name={isPinned ? "bookmark" : "bookmark-outline"}
          size={22}
          color={isPinned ? "#f59e0b" : "#9ca3af"}
        />
      </Pressable>
    </View>
  );
}
