import { Pressable, View, type ColorValue } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Host, Image } from "@expo/ui/swift-ui";

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 100, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 100, easing: Easing.elastic(1) })
    );
    onPress();
  };

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
