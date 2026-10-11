import { useCallback } from "react";
import { ActionSheetIOS, Alert, Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { findCode, formatCodeWithName } from "./code-index";
import { useFavorites } from "./favorites-provider";
import { useFolders } from "./folders-provider";
import { promptTextInput } from "./prompt-text-input";
import { useHaptics } from "./useHaptics";
import type { Folder, LeafCode } from "./types";

export function useFolderCodes() {
  const { getSavedCode } = useFavorites();
  return useCallback(
    (folder: Folder): LeafCode[] =>
      folder.codeRefs.map(
        (code) =>
          findCode(code)?.leaf ??
          getSavedCode(code) ?? { code, name_ua: "Назва недоступна" },
      ),
    [getSavedCode],
  );
}

export function useFolderActions() {
  const { renameFolder, deleteFolder } = useFolders();
  const getFolderCodes = useFolderCodes();
  const { trigger } = useHaptics();

  const listText = useCallback(
    (folder: Folder) =>
      getFolderCodes(folder).map(formatCodeWithName).join("\n"),
    [getFolderCodes],
  );

  const rename = useCallback(
    (folder: Folder) =>
      promptTextInput({
        title: "Перейменувати папку",
        defaultValue: folder.name,
        submitText: "Зберегти",
        onSubmit: (name) => renameFolder(folder.id, name),
      }),
    [renameFolder],
  );

  const copyList = useCallback(
    async (folder: Folder) => {
      await Clipboard.setStringAsync(listText(folder));
      trigger("success");
    },
    [listText, trigger],
  );

  const shareList = useCallback(
    (folder: Folder) => {
      Share.share({ title: folder.name, message: listText(folder) }).catch(
        (error) => {
          console.error("Failed to share folder:", error);
        },
      );
    },
    [listText],
  );

  const confirmDelete = useCallback(
    (folder: Folder, onDeleted?: () => void) =>
      Alert.alert(
        `Видалити папку «${folder.name}»?`,
        "Коди залишаться в класифікаторі та закладках.",
        [
          { text: "Скасувати", style: "cancel" },
          {
            text: "Видалити",
            style: "destructive",
            onPress: () => {
              deleteFolder(folder.id);
              onDeleted?.();
            },
          },
        ],
      ),
    [deleteFolder],
  );

  const showMenu = useCallback(
    (folder: Folder, onDeleted?: () => void) => {
      const hasCodes = folder.codeRefs.length > 0;
      const actions = [
        { label: "Перейменувати", run: () => rename(folder) },
        ...(hasCodes
          ? [
              { label: "Копіювати список кодів", run: () => copyList(folder) },
              { label: "Поділитися списком", run: () => shareList(folder) },
            ]
          : []),
        {
          label: "Видалити папку",
          run: () => confirmDelete(folder, onDeleted),
          destructive: true,
        },
      ];

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: folder.name,
            options: [...actions.map((action) => action.label), "Скасувати"],
            destructiveButtonIndex: actions.length - 1,
            cancelButtonIndex: actions.length,
          },
          (index) => actions[index]?.run(),
        );
        return;
      }

      Alert.alert(folder.name, undefined, [
        ...actions.map((action) => ({
          text: action.label,
          style: action.destructive
            ? ("destructive" as const)
            : ("default" as const),
          onPress: action.run,
        })),
        { text: "Скасувати", style: "cancel" as const },
      ]);
    },
    [rename, copyList, shareList, confirmDelete],
  );

  return { rename, copyList, shareList, confirmDelete, showMenu };
}
