import { useCallback } from "react";
import { ActionSheetIOS, Alert, Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { formatCodeWithName } from "./code-index";
import { useHaptics } from "./useHaptics";
import type { LeafCode } from "./types";

export const CODE_ACCESSIBILITY_ACTIONS = [
  { name: "copyWithName", label: "Копіювати код і назву" },
  { name: "copyCode", label: "Копіювати код" },
  { name: "share", label: "Поділитися" },
];

export function useCodeActions() {
  const { trigger } = useHaptics();

  const copyText = useCallback(
    async (text: string) => {
      await Clipboard.setStringAsync(text);
      trigger("success");
    },
    [trigger],
  );

  const copyWithName = useCallback(
    (code: LeafCode) => copyText(formatCodeWithName(code)),
    [copyText],
  );

  const copyCode = useCallback(
    (code: LeafCode) => copyText(code.code),
    [copyText],
  );

  const share = useCallback((code: LeafCode) => {
    Share.share({ message: formatCodeWithName(code) }).catch((error) => {
      console.error("Failed to share code:", error);
    });
  }, []);

  const runAction = useCallback(
    (name: string, code: LeafCode) => {
      if (name === "copyWithName") copyWithName(code);
      else if (name === "copyCode") copyCode(code);
      else if (name === "share") share(code);
    },
    [copyWithName, copyCode, share],
  );

  /** Long-press menu for code cards */
  const showActions = useCallback(
    (code: LeafCode) => {
      trigger("medium");
      const labels = CODE_ACCESSIBILITY_ACTIONS.map((action) => action.label);
      const pick = (index: number) => {
        const action = CODE_ACCESSIBILITY_ACTIONS[index];
        if (action) runAction(action.name, code);
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: code.code,
            message: code.name_ua,
            options: [...labels, "Скасувати"],
            cancelButtonIndex: labels.length,
          },
          pick,
        );
        return;
      }

      Alert.alert(code.code, code.name_ua, [
        ...labels.map((text, index) => ({ text, onPress: () => pick(index) })),
        { text: "Скасувати", style: "cancel" as const },
      ]);
    },
    [runAction, trigger],
  );

  return { copyWithName, copyCode, share, runAction, showActions };
}
