import { View, Text, Pressable } from "react-native";
import { Host, Image, ImageProps } from "@expo/ui/swift-ui";
import { Card } from "./Card";
import { AnimatedBookmarkButton } from "./AnimatedBookmarkButton";
import type { ReactNode } from "react";

type SFSymbolName = ImageProps["systemName"];

const SF_SYMBOL_MAP: Record<string, SFSymbolName> = {
  "chevron-forward": "chevron.right",
  "bookmark": "bookmark.fill",
  "bookmark-outline": "bookmark",
  "search-outline": "magnifyingglass",
  "alert-circle-outline": "exclamationmark.circle",
  "close": "xmark",
};

interface AccentCardProps {
  accentColor: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  icon?: string;
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
  const sfSymbol: SFSymbolName | undefined = icon
    ? SF_SYMBOL_MAP[icon]
    : undefined;

  if (__DEV__ && icon && !SF_SYMBOL_MAP[icon]) {
    console.warn(`AccentCard: Unmapped icon "${icon}". Add it to SF_SYMBOL_MAP.`);
  }

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
                className="text-xs font-bold mb-2 tracking-wide"
                style={{ color: badgeColor }}
              >
                {badge}
              </Text>
            )}
            <Text
              className="text-base text-gray-900 dark:text-gray-100 font-semibold leading-5"
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 leading-4 mt-1.5"
                numberOfLines={2}
              >
                {subtitle}
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
          ) : sfSymbol && (
            <View className="mt-1">
              {onIconPress ? (
                <Pressable
                  onPress={onIconPress}
                  accessibilityLabel={iconAccessibilityLabel}
                  accessibilityRole="button"
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: iconBackground }}
                >
                  <Host matchContents>
                    <Image systemName={sfSymbol} size={iconSize} color={iconColor} />
                  </Host>
                </Pressable>
              ) : (
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: iconBackground }}
                >
                  <Host matchContents>
                    <Image systemName={sfSymbol} size={iconSize} color={iconColor} />
                  </Host>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>
    </CardWrapper>
  );
}
