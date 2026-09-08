import { type ColorValue } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";

interface CloseButtonProps {
  testID?: string;
  onPress: () => void;
  color: ColorValue;
}

export function CloseButton({ onPress, color, testID }: CloseButtonProps) {
  return (
    <HeaderButton
      testID={testID}
      onPress={onPress}
      accessibilityLabel="Закрити"
    >
      <Ionicons name="close" size={24} color={color} />
    </HeaderButton>
  );
}
