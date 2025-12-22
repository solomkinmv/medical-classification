import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurCard } from "./BlurCard";
import type { ReactNode } from "react";

interface AccentCardProps {
  accentColor: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  iconSize?: number;
  onIconPress?: () => void;
  iconAccessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AccentCard({
  accentColor,
  badge,
  badgeColor = accentColor,
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  iconSize = 18,
  onIconPress,
  iconAccessibilityLabel,
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: AccentCardProps) {
  const CardWrapper = onPress ? Pressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        accessibilityLabel,
        accessibilityRole: "button" as const,
        accessibilityHint,
      }
    : { accessible: !!accessibilityLabel, accessibilityLabel };

  return (
    <CardWrapper className="mb-3" {...wrapperProps}>
      <BlurCard>
        <View className="flex-row items-start p-4">
          {/* Vertical accent bar */}
          <View
            className="w-1 rounded-full mr-4"
            style={{ height: subtitle ? 64 : 48, backgroundColor: accentColor }}
          />

          {/* Content */}
          <View className="flex-1 pr-3">
            {badge && (
              <Text
                className="text-xs font-bold mb-2 tracking-wide"
                style={{ color: badgeColor }}
              >
                {badge}
              </Text>
            )}
            <Text className="text-base text-gray-900 font-semibold leading-5" numberOfLines={2}>
              {title}
            </Text>
            {subtitle && (
              <Text className="text-xs text-gray-500 leading-4 mt-1.5" numberOfLines={2}>
                {subtitle}
              </Text>
            )}
            {children}
          </View>

          {/* Right icon/action */}
          {icon && (
            <View className="mt-1">
              {onIconPress ? (
                <Pressable
                  onPress={onIconPress}
                  accessibilityLabel={iconAccessibilityLabel}
                  accessibilityRole="button"
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: iconBackground }}
                >
                  <Ionicons name={icon} size={iconSize} color={iconColor} />
                </Pressable>
              ) : (
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: iconBackground }}
                >
                  <Ionicons name={icon} size={iconSize} color={iconColor} />
                </View>
              )}
            </View>
          )}
        </View>
      </BlurCard>
    </CardWrapper>
  );
}
