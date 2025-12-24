import { type ColorValue } from "react-native";
import { Host, Image } from "@expo/ui/swift-ui";

interface ChevronIconProps {
  size: number;
  color: ColorValue;
}

export function ChevronIcon({ size, color }: ChevronIconProps) {
  return (
    <Host matchContents>
      <Image systemName="chevron.right" size={size} color={color as string} />
    </Host>
  );
}
