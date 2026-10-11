import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCodeActions } from "@/lib/useCodeActions";
import type { LeafCode } from "@/lib/types";

const COPIED_FEEDBACK_MS = 1500;

type CopiedTarget = "withName" | "code" | null;

interface CodeActionsProps {
  code: LeafCode;
  accentColor: string;
}

/** Copy and share actions for the code detail screen */
export function CodeActions({ code, accentColor }: CodeActionsProps) {
  const { copyWithName, copyCode, share } = useCodeActions();
  const [copied, setCopied] = useState<CopiedTarget>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const markCopied = (target: CopiedTarget) => {
    setCopied(target);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS);
  };

  return (
    <View style={{ marginTop: 20, gap: 10 }}>
      <Pressable
        testID="procedure.copy-with-name"
        accessibilityRole="button"
        accessibilityLabel={
          copied === "withName" ? "Скопійовано" : "Копіювати код і назву"
        }
        accessibilityHint="Для вставлення у звіт"
        onPress={async () => {
          await copyWithName(code);
          markCopied("withName");
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 50,
          borderRadius: 12,
          backgroundColor: accentColor,
        }}
      >
        <Ionicons
          name={copied === "withName" ? "checkmark" : "copy-outline"}
          size={18}
          color="#ffffff"
        />
        <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
          {copied === "withName" ? "Скопійовано" : "Копіювати код і назву"}
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <SecondaryAction
          testID="procedure.copy-code"
          icon={copied === "code" ? "checkmark" : "code-outline"}
          label={copied === "code" ? "Скопійовано" : "Лише код"}
          color={accentColor}
          onPress={async () => {
            await copyCode(code);
            markCopied("code");
          }}
        />
        <SecondaryAction
          testID="procedure.share"
          icon="share-outline"
          label="Поділитися"
          color={accentColor}
          onPress={() => share(code)}
        />
      </View>
    </View>
  );
}

function SecondaryAction({
  testID,
  icon,
  label,
  color,
  onPress,
}: {
  testID: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: color,
      }}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color, fontSize: 15, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
