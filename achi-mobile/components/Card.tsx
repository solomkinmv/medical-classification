import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/useTheme";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  const { colors: t } = useTheme();

  const cardContainerStyle = {
    ...styles.cardContainer,
    backgroundColor: t.card,
  };

  return (
    <View style={cardContainerStyle}>
      {children}
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
