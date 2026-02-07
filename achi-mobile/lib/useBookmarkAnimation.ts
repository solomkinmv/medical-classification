import { useCallback } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useHaptics } from "./useHaptics";

export function useBookmarkAnimation(
  isBookmarked: boolean,
  onPress: () => void,
) {
  const scale = useSharedValue(1);
  const { trigger } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 100, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 100, easing: Easing.elastic(1) }),
    );
    trigger(isBookmarked ? "light" : "medium");
    onPress();
  }, [scale, trigger, isBookmarked, onPress]);

  return { animatedStyle, handlePress };
}
