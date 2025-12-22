import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { theme as themeColors } from "@/lib/constants";

const SF_TO_IONICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "bookmark": "bookmark-outline",
  "magnifyingglass": "search-outline",
  "exclamationmark.circle": "alert-circle-outline",
};

interface EmptyStateProps {
  icon: string;
  iconColor: string;
  iconBackgroundColor: string;
  title?: string;
  message?: string;
}

export function EmptyState({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  message,
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? themeColors.dark : themeColors.light;

  const ioniconsName = SF_TO_IONICONS[icon] ?? "help-circle-outline";

  return (
    <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: t.background }}>
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: iconBackgroundColor }}
      >
        <Ionicons name={ioniconsName} size={40} color={iconColor} />
      </View>
      {title && (
        <Text
          className="text-xl font-semibold text-center"
          style={{ color: t.text }}
        >
          {title}
        </Text>
      )}
      {message && (
        <Text className="text-center mt-2" style={{ color: t.textMuted }}>
          {message}
        </Text>
      )}
    </View>
  );
}
