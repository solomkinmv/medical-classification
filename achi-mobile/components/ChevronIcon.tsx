import { type ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ChevronIconProps {
  size: number;
  color: ColorValue;
}

export function ChevronIcon({ size, color }: ChevronIconProps) {
  return (
    <Ionicons name="chevron-forward" size={size} color={color as string} />
  );
}
