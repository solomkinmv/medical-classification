import { View, Text } from "react-native";
import { Host, Image, ImageProps } from "@expo/ui/swift-ui";
import { useColorScheme } from "nativewind";
import { theme as themeColors } from "@/lib/constants";

type SFSymbolName = ImageProps["systemName"];

interface EmptyStateProps {
  icon: SFSymbolName;
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

  return (
    <View className="flex-1 items-center justify-center px-8 bg-[#F0F2F5] dark:bg-[#0A0A0A]">
      <View className="items-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: iconBackgroundColor }}
        >
          <Host matchContents>
            <Image systemName={icon} size={40} color={iconColor} />
          </Host>
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
          <Text
            className="text-center mt-2"
            style={{ color: t.textMuted }}
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}
