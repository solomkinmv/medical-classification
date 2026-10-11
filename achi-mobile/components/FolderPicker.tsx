import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFolders } from "@/lib/folders-provider";
import { promptTextInput } from "@/lib/prompt-text-input";
import { useHaptics } from "@/lib/useHaptics";
import { useTheme } from "@/lib/useTheme";
import { colors } from "@/lib/constants";
import type { ClassifierType } from "@/lib/types";

interface FolderPickerProps {
  code: string;
  classifier: ClassifierType;
}

/** Folder membership of one code, shown on its detail screen */
export function FolderPicker({ code, classifier }: FolderPickerProps) {
  const { getFolders, createFolder, addToFolder, removeFromFolder, isReady } =
    useFolders();
  const { selection } = useHaptics();
  const { colors: t } = useTheme();
  const folders = getFolders(classifier);

  if (!isReady) return null;

  const createAndAdd = () =>
    promptTextInput({
      title: "Нова папка",
      message: `Код ${code} буде додано до неї`,
      submitText: "Створити",
      onSubmit: (name) => addToFolder(createFolder(name, classifier).id, code),
    });

  return (
    <View testID="procedure.folders" style={{ marginTop: 28 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: t.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Папки
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {folders.map((folder) => {
          const contains = folder.codeRefs.includes(code);
          return (
            <Pressable
              key={folder.id}
              testID={`procedure.folder.${folder.id}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: contains }}
              accessibilityLabel={`Папка ${folder.name}`}
              onPress={() => {
                selection();
                if (contains) removeFromFolder(folder.id, code);
                else addToFolder(folder.id, code);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 36,
                paddingHorizontal: 12,
                borderRadius: 18,
                backgroundColor: contains
                  ? colors.violet[500]
                  : "rgba(139, 92, 246, 0.1)",
              }}
            >
              <Ionicons
                name={contains ? "checkmark" : "folder-outline"}
                size={15}
                color={contains ? "#ffffff" : colors.violet[600]}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: contains ? "#ffffff" : colors.violet[600],
                }}
              >
                {folder.name}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          testID="procedure.folder.create"
          accessibilityRole="button"
          accessibilityLabel="Нова папка з цим кодом"
          onPress={createAndAdd}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minHeight: 36,
            paddingHorizontal: 12,
            borderRadius: 18,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.violet[500],
          }}
        >
          <Ionicons name="add" size={15} color={colors.violet[600]} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.violet[600],
            }}
          >
            Нова папка
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
