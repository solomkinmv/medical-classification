import { memo } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AccentCard } from "@/components/AccentCard";
import { showUpgradePrompt } from "@/components/UpgradePrompt";
import { useFavorites } from "@/lib/favorites-provider";
import { useNotes } from "@/lib/notes-provider";
import {
  CODE_ACCESSIBILITY_ACTIONS,
  useCodeActions,
} from "@/lib/useCodeActions";
import { colors, getClassifierColors } from "@/lib/constants";
import type { ClassifierType, LeafCode } from "@/lib/types";

interface CodeCardProps {
  code: LeafCode;
  classifier: ClassifierType;
  /** Where the code sits, e.g. its block */
  context?: string;
  /** Replaces the bookmark button, e.g. to remove the code from a folder */
  onRemove?: () => void;
  removeLabel?: string;
}

export const CodeCard = memo(function CodeCard({
  code,
  classifier,
  context,
  onRemove,
  removeLabel,
}: CodeCardProps) {
  const router = useRouter();
  const { isFavorite, isRemoved, toggleFavorite } = useFavorites();
  const { hasNote } = useNotes();
  const { runAction, showActions } = useCodeActions();
  const isPinned = isFavorite(code.code);
  const removed = isRemoved(code.code);
  const codeHasNote = hasNote(code.code);
  const classifierColors = getClassifierColors(classifier);

  const markers = [
    removed ? "Відсутній у поточній редакції" : null,
    codeHasNote ? "Є нотатка" : null,
  ].filter(Boolean);

  return (
    <AccentCard
      onPress={() => router.push(`/procedure/${code.code}`)}
      onLongPress={() => showActions(code)}
      accentColor={removed ? colors.gray[400] : classifierColors.accent500}
      badge={code.code}
      badgeColor={removed ? colors.gray[500] : classifierColors.accent600}
      title={code.name_ua}
      titleNumberOfLines={0}
      subtitle={context}
      {...(onRemove
        ? {
            icon: "remove-circle-outline",
            iconColor: colors.gray[400],
            iconBackground: "rgba(156, 163, 175, 0.1)",
            onIconPress: onRemove,
            iconAccessibilityLabel: removeLabel,
          }
        : {
            icon: "bookmark",
            isBookmarked: isPinned,
            iconColor: isPinned ? colors.amber[500] : colors.gray[400],
            iconBackground: isPinned
              ? "rgba(245, 158, 11, 0.15)"
              : "rgba(156, 163, 175, 0.1)",
            onIconPress: () => {
              const { limitReached } = toggleFavorite(code, classifier);
              if (limitReached) showUpgradePrompt();
            },
            iconAccessibilityLabel: isPinned
              ? "Видалити закладку"
              : "Додати закладку",
          })}
      iconSize={18}
      accessibilityLabel={[`${code.code}: ${code.name_ua}`, ...markers].join(
        ". ",
      )}
      accessibilityHint="Відкрити деталі. Утримуйте, щоб скопіювати"
      accessibilityActions={CODE_ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={(event) =>
        runAction(event.nativeEvent.actionName, code)
      }
    >
      {removed && (
        <Marker
          icon="alert-circle-outline"
          color={colors.amber[600]}
          label="Відсутній у поточній редакції класифікатора"
        />
      )}
      {codeHasNote && (
        <Marker
          icon="document-text-outline"
          color={colors.violet[500]}
          label="Нотатка"
        />
      )}
    </AccentCard>
  );
});

function Marker({
  icon,
  color,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={{ fontSize: 12, color, marginLeft: 4 }}>{label}</Text>
    </View>
  );
}
