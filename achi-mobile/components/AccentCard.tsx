import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./Card";
import { AnimatedBookmarkButton } from "./AnimatedBookmarkButton";
import type { ReactNode } from "react";

interface AccentCardProps {
  accentColor: string;
  badge?: string;
  badgeColor?: string;
  secondaryBadge?: string;
  blockRange?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  iconSize?: number;
  onIconPress?: () => void;
  iconAccessibilityLabel?: string;
  isBookmarked?: boolean;
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AccentCard({
  accentColor,
  badge,
  badgeColor = accentColor,
  secondaryBadge,
  blockRange,
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  iconSize = 18,
  onIconPress,
  iconAccessibilityLabel,
  isBookmarked,
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
      <Card>
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
                className="text-xs font-bold tracking-wide mb-2"
                style={{ color: badgeColor }}
              >
                {badge}
              </Text>
            )}
            <Text className="text-base text-gray-900 dark:text-gray-100 font-semibold leading-5" numberOfLines={2}>
              {title}
            </Text>
            {subtitle && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 leading-4 mt-1.5" numberOfLines={2}>
                {subtitle}
              </Text>
            )}
            {secondaryBadge && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {secondaryBadge}
              </Text>
            )}
            {blockRange && (
              <Text className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">
                {blockRange}
              </Text>
            )}
            {children}
          </View>

          {/* Right icon/action */}
          {icon === "bookmark" && onIconPress && isBookmarked !== undefined ? (
            <View className="mt-1">
              <AnimatedBookmarkButton
                isBookmarked={isBookmarked}
                onPress={onIconPress}
                color={iconColor ?? accentColor}
                backgroundColor={iconBackground}
                size={iconSize}
                accessibilityLabel={iconAccessibilityLabel}
              />
            </View>
          ) : icon && (
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
      </Card>
    </CardWrapper>
  );
}
