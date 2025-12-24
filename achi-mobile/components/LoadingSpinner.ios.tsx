import { type ColorValue } from "react-native";
import { Host, CircularProgress } from "@expo/ui/swift-ui";

interface LoadingSpinnerProps {
  color: ColorValue;
  size?: "small" | "large";
}

export function LoadingSpinner({ color }: LoadingSpinnerProps) {
  return (
    <Host matchContents>
      <CircularProgress color={color as string} />
    </Host>
  );
}
