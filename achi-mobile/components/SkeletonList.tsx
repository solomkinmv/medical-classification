import { View } from "react-native";
import { SkeletonCard } from "./SkeletonCard";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import {
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
} from "@/lib/constants";

interface SkeletonListProps {
  count?: number;
  hasSubtitle?: boolean;
}

export function SkeletonList({
  count = 6,
  hasSubtitle = true,
}: SkeletonListProps) {
  const backgroundColor = useBackgroundColor();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingTop: 16,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} hasSubtitle={hasSubtitle} />
      ))}
    </View>
  );
}
