import { useCallback } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const impactStyles: Record<string, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const notificationTypes: Record<string, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

export function useHaptics() {
  const trigger = useCallback((style: HapticStyle = "light") => {
    if (Platform.OS !== "ios") return;

    if (style in impactStyles) {
      Haptics.impactAsync(impactStyles[style]);
    } else if (style in notificationTypes) {
      Haptics.notificationAsync(notificationTypes[style]);
    }
  }, []);

  const selection = useCallback(() => {
    if (Platform.OS !== "ios") return;
    Haptics.selectionAsync();
  }, []);

  return { trigger, selection };
}
