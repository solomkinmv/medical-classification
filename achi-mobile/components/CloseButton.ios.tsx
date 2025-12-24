import { Pressable, type ColorValue } from "react-native";
import { Host, Image, Button } from "@expo/ui/swift-ui";

interface CloseButtonProps {
  onPress: () => void;
  color: ColorValue;
}

export function CloseButton({ onPress, color }: CloseButtonProps) {
  return (
    <Pressable onPress={onPress} hitSlop={20}>
      <Host matchContents>
        <Button variant="glass" onPress={onPress}>
          <Image systemName="xmark" size={20} color={color as string} />
        </Button>
      </Host>
    </Pressable>
  );
}
