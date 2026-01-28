import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme } from "@/lib/useTheme";
import {
  ACCENT_BAR_HEIGHT_WITH_SUBTITLE,
  ACCENT_BAR_HEIGHT_WITHOUT_SUBTITLE,
} from "@/lib/constants";

interface SkeletonCardProps {
  hasSubtitle?: boolean;
}

export function SkeletonCard({ hasSubtitle = true }: SkeletonCardProps) {
  const { isDark, colors } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
    return () => {
      cancelAnimation(shimmer);
    };
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  const skeletonBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        {/* Accent bar skeleton */}
        <Animated.View
          style={[
            styles.accentBar,
            {
              height: hasSubtitle ? ACCENT_BAR_HEIGHT_WITH_SUBTITLE : ACCENT_BAR_HEIGHT_WITHOUT_SUBTITLE,
              backgroundColor: skeletonBg,
            },
            shimmerStyle,
          ]}
        />

        {/* Text content skeleton */}
        <View style={styles.textContent}>
          {/* Badge skeleton */}
          <Animated.View
            style={[styles.badge, { backgroundColor: skeletonBg }, shimmerStyle]}
          />

          {/* Title skeleton */}
          <Animated.View
            style={[styles.title, { backgroundColor: skeletonBg }, shimmerStyle]}
          />

          {/* Subtitle skeleton (if applicable) */}
          {hasSubtitle && (
            <Animated.View
              style={[styles.subtitle, { backgroundColor: skeletonBg }, shimmerStyle]}
            />
          )}
        </View>

        {/* Icon skeleton */}
        <Animated.View
          style={[styles.icon, { backgroundColor: skeletonBg }, shimmerStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 16,
  },
  textContent: {
    flex: 1,
    paddingRight: 12,
  },
  badge: {
    width: 60,
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  title: {
    width: "90%",
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    width: "70%",
    height: 14,
    borderRadius: 4,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: 4,
  },
});
