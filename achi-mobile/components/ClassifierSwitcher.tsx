import { Pressable, Text, View, StyleSheet } from "react-native";
import { useClassifier } from "@/lib/classifier-provider";
import { colors } from "@/lib/constants";
import type { ClassifierType } from "@/lib/types";

const SEGMENTS: { key: ClassifierType; label: string }[] = [
  { key: "achi", label: "АКМІ" },
  { key: "mkh10", label: "МКХ-10" },
];

export function ClassifierSwitcher() {
  const { activeClassifier, setActiveClassifier } = useClassifier();

  return (
    <View style={styles.container}>
      {SEGMENTS.map(({ key, label }) => {
        const isActive = activeClassifier === key;
        const activeColor =
          key === "achi" ? colors.sky[500] : colors.emerald[500];

        return (
          <Pressable
            key={key}
            style={[
              styles.segment,
              isActive && { backgroundColor: activeColor },
            ]}
            onPress={() => setActiveClassifier(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
          >
            <Text
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(120, 120, 128, 0.12)",
    borderRadius: 9,
    padding: 2,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  activeLabel: {
    color: "#FFFFFF",
  },
  inactiveLabel: {
    color: "#8E8E93",
  },
});
