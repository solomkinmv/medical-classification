import { Pressable, type ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CloseButtonProps {
  testID?: string;
  onPress: () => void;
  color: ColorValue;
}

export function CloseButton({ onPress, color, testID }: CloseButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={20}
      accessibilityLabel="Закрити"
      accessibilityRole="button"
    >
      <Ionicons name="close" size={28} color={color as string} />
    </Pressable>
  );
}
