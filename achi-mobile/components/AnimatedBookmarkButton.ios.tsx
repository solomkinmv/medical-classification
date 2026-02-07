import { Pressable, View, type ColorValue } from "react-native";
import Animated from "react-native-reanimated";
import { Host, Image } from "@expo/ui/swift-ui";
import { useBookmarkAnimation } from "@/lib/useBookmarkAnimation";

interface AnimatedBookmarkButtonProps {
  isBookmarked: boolean;
  onPress: () => void;
  color: ColorValue;
  backgroundColor?: ColorValue;
  size?: number;
  containerSize?: number;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedBookmarkButton({
  isBookmarked,
  onPress,
  color,
  backgroundColor,
  size = 18,
  containerSize = 36,
  accessibilityLabel = "Toggle bookmark",
}: AnimatedBookmarkButtonProps) {
  const { animatedStyle, handlePress } = useBookmarkAnimation(
    isBookmarked,
    onPress,
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => e.stopPropagation()}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={animatedStyle}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isBookmarked }}
    >
      <View
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
        }}
      >
        <Host matchContents>
          <Image
            systemName={isBookmarked ? "bookmark.fill" : "bookmark"}
            size={size}
            color={color as string}
          />
        </Host>
      </View>
    </AnimatedPressable>
  );
}
