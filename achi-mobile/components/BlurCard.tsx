import { View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import type { ReactNode } from "react";

interface BlurCardProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
}

export function BlurCard({ children, intensity = 60, className = "p-4" }: BlurCardProps) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={intensity} tint="light" className={className}>
        {children}
      </BlurView>
    );
  }

  return (
    <View className={`${className} bg-white/90`}>
      {children}
    </View>
  );
}
