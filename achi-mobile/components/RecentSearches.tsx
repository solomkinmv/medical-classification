import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useColorScheme } from "nativewind";
import { useRecentSearches } from "@/lib/recent-searches-provider";
import { colors, theme } from "@/lib/constants";

interface RecentSearchesProps {
  onSelectQuery: (query: string) => void;
  activeQuery?: string | null;
}

export function RecentSearches({ onSelectQuery, activeQuery }: RecentSearchesProps) {
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useRecentSearches();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: t.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Останні пошуки
        </Text>
        <Pressable
          onPress={clearRecentSearches}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Очистити всі останні пошуки"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 13, color: colors.sky[500] }}>
            Очистити
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {recentSearches.map((query) => {
          const isActive = query === activeQuery;
          return (
            <Pressable
              key={query}
              onPress={() => onSelectQuery(query)}
              onLongPress={() => {
                Alert.alert(
                  "Видалити пошук?",
                  `"${query}"`,
                  [
                    { text: "Скасувати", style: "cancel" },
                    { text: "Видалити", style: "destructive", onPress: () => removeRecentSearch(query) },
                  ]
                );
              }}
              accessibilityLabel={`Пошук: ${query}`}
              accessibilityHint="Натисніть для пошуку, утримуйте для видалення"
              accessibilityRole="button"
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive
                  ? colors.sky[500]
                  : isDark ? colors.gray[800] : colors.gray[100],
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: isActive ? "#ffffff" : t.text,
                  fontWeight: isActive ? "600" : "400",
                }}
                numberOfLines={1}
              >
                {query}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
