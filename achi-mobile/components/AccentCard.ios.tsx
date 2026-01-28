import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Host, Image, ImageProps } from "@expo/ui/swift-ui";
import { Card } from "./Card";
import { AnimatedBookmarkButton } from "./AnimatedBookmarkButton";
import { useHaptics } from "@/lib/useHaptics";
import {
  ACCENT_BAR_HEIGHT_WITH_SUBTITLE,
  ACCENT_BAR_HEIGHT_WITHOUT_SUBTITLE,
} from "@/lib/constants";
import type { ReactNode } from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  secondaryBadge?: string;
  blockRange?: string;
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
  const scale = useSharedValue(1);
  const { trigger } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    trigger("light");
    onPress?.();
  };

  const sfSymbol: SFSymbolName | undefined = icon
    ? SF_SYMBOL_MAP[icon]
    : undefined;

  if (__DEV__ && icon && !SF_SYMBOL_MAP[icon]) {
    console.warn(`AccentCard: Unmapped icon "${icon}". Add it to SF_SYMBOL_MAP.`);
  }

  if (onPress) {
    return (
      <AnimatedPressable
        className="mb-3"
        style={animatedStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        <AccentCardContent
          accentColor={accentColor}
          badge={badge}
          badgeColor={badgeColor}
          secondaryBadge={secondaryBadge}
          blockRange={blockRange}
          title={title}
          subtitle={subtitle}
          icon={icon}
          sfSymbol={sfSymbol}
          iconColor={iconColor}
          iconBackground={iconBackground}
          iconSize={iconSize}
          onIconPress={onIconPress}
          iconAccessibilityLabel={iconAccessibilityLabel}
          isBookmarked={isBookmarked}
        >
          {children}
        </AccentCardContent>
      </AnimatedPressable>
    );
  }

  return (
    <View className="mb-3" accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
      <AccentCardContent
        accentColor={accentColor}
        badge={badge}
        badgeColor={badgeColor}
        secondaryBadge={secondaryBadge}
        blockRange={blockRange}
        title={title}
        subtitle={subtitle}
        sfSymbol={sfSymbol}
        icon={icon}
        iconColor={iconColor}
        iconBackground={iconBackground}
        iconSize={iconSize}
        onIconPress={onIconPress}
        iconAccessibilityLabel={iconAccessibilityLabel}
        isBookmarked={isBookmarked}
      >
        {children}
      </AccentCardContent>
    </View>
  );
}

interface AccentCardContentProps {
  accentColor: string;
  badge?: string;
  badgeColor?: string;
  secondaryBadge?: string;
  blockRange?: string;
  title: string;
  subtitle?: string;
  sfSymbol?: SFSymbolName;
  icon?: string;
  iconColor?: string;
  iconBackground?: string;
  iconSize?: number;
  onIconPress?: () => void;
  iconAccessibilityLabel?: string;
  isBookmarked?: boolean;
  children?: ReactNode;
}

function AccentCardContent({
  accentColor,
  badge,
  badgeColor = accentColor,
  secondaryBadge,
  blockRange,
  title,
  subtitle,
  sfSymbol,
  icon,
  iconColor,
  iconBackground,
  iconSize = 18,
  onIconPress,
  iconAccessibilityLabel,
  isBookmarked,
  children,
}: AccentCardContentProps) {
  return (
    <Card>
      <View className="flex-row items-start p-4">
        {/* Vertical accent bar */}
        <View
          className="w-1 rounded-full mr-4"
          style={{
            height: subtitle ? ACCENT_BAR_HEIGHT_WITH_SUBTITLE : ACCENT_BAR_HEIGHT_WITHOUT_SUBTITLE,
            backgroundColor: accentColor,
          }}
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
  );
}
