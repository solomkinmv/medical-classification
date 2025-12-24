import { ActivityIndicator, type ColorValue } from "react-native";

interface LoadingSpinnerProps {
  color: ColorValue;
  size?: "small" | "large";
}

export function LoadingSpinner({ color, size = "large" }: LoadingSpinnerProps) {
  return <ActivityIndicator size={size} color={color} />;
}
