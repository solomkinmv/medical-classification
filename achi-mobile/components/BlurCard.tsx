import { View, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";

interface BlurCardProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
}

export function BlurCard({ children, intensity = 60, className = "p-4" }: BlurCardProps) {
  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <View style={styles.cardContainer}>
        <GlassView className={className}>
          {children}
        </GlassView>
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <View style={styles.cardContainer}>
        <BlurView intensity={intensity} tint="light" className={className}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View className={`${className} bg-white`}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
});
