import { View, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useColorScheme } from "nativewind";
import { theme } from "@/lib/constants";
import type { ReactNode } from "react";

interface BlurCardProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
}

export function BlurCard({ children, intensity = 60, className = "p-4" }: BlurCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  const cardContainerStyle = {
    ...styles.cardContainer,
    backgroundColor: t.card,
  };

  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <View style={cardContainerStyle}>
        <GlassView className={className}>
          {children}
        </GlassView>
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <View style={cardContainerStyle}>
        <BlurView intensity={intensity} tint={isDark ? "dark" : "light"} className={className}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={cardContainerStyle}>
      <View className={className} style={{ backgroundColor: t.card }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
});
