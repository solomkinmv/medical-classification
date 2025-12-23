import { View, StyleSheet } from "react-native";
import { useColorScheme } from "nativewind";
import { theme } from "@/lib/constants";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "p-4" }: CardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  const cardContainerStyle = {
    ...styles.cardContainer,
    backgroundColor: t.card,
  };

  return (
    <View style={cardContainerStyle}>
      <View className={className}>
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
