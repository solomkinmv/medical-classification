import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Keyboard,
} from "react-native";
import {
  useLocalSearchParams,
  Stack,
  useRouter,
  useNavigationContainerRef,
} from "expo-router";
import { CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { headerActionOptions } from "@/components/navigation-header";
import { showUpgradePrompt } from "@/components/UpgradePrompt";
import { useClassifier } from "@/lib/classifier-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useNotes } from "@/lib/notes-provider";
import { useProStatus } from "@/lib/pro-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { useTheme } from "@/lib/useTheme";
import { useHaptics } from "@/lib/useHaptics";
import { findProcedurePath } from "@/lib/navigation";
import { colors, getClassifierColors } from "@/lib/constants";
import type {
  AchiData,
  CategoryChildren,
  ClassifierType,
  LeafCode,
  PathSegment,
} from "@/lib/types";
import { isLeafLevel } from "@/lib/types";

function getLevelLabel(
  level: PathSegment["level"],
  classifier: ClassifierType,
): string {
  switch (level) {
    case "class":
      return "Клас";
    case "anatomical":
      return "Вісь анатомічної локалізації";
    case "procedural":
      return "Вісь процедурної типології";
    case "block":
      return classifier === "mkh10" ? "Блок" : "АСК";
    case "nosology":
      return "Нозологія";
    case "disease":
      return "Захворювання";
    default:
      return "";
  }
}

export default function ProcedureDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { activeClassifier, activeData: data } = useClassifier();
  const classifierColors = getClassifierColors(activeClassifier);
  const accentColor = classifierColors.accent500;
  const accentColorDark = classifierColors.accent600;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getNote, setNote, deleteNote } = useNotes();
  const { isPro } = useProStatus();
  const router = useRouter();
  const navigation = useNavigationContainerRef();
  const insets = useSafeAreaInsets();
  const { colors: t } = useTheme();
  const backgroundColor = useBackgroundColor();

  const procedure = useMemo(
    () => (code ? findProcedure(data, code) : null),
    [data, code],
  );

  const path = useMemo(
    () =>
      procedure
        ? (findProcedurePath(data, procedure.code, activeClassifier) ?? [])
        : [],
    [data, procedure, activeClassifier],
  );

  const isPinned = procedure ? isFavorite(procedure.code) : false;
  const existingNote = procedure ? getNote(procedure.code) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const { trigger } = useHaptics();
  const toggleBookmark = () => {
    if (!procedure) return;
    trigger(isPinned ? "light" : "medium");
    const { limitReached } = toggleFavorite(procedure);
    if (limitReached) showUpgradePrompt();
  };

  useEffect(() => {
    if (!isEditing) return;
    // Native insets protect the caret; also reveal the actions below the editor.
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => subscription.remove();
  }, [isEditing]);

  useEffect(() => {
    setIsEditing(false);
    setNoteText("");
  }, [code]);

  if (!code) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor }}
      >
        <Text style={{ color: t.textSecondary }}>Неправильний код</Text>
      </View>
    );
  }

  if (!procedure) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor }}
      >
        <Text style={{ color: t.textSecondary }}>Код не знайдено</Text>
      </View>
    );
  }

  const navigateToBreadcrumb = (index: number) => {
    const targetPath = path.slice(0, index + 1).filter((p) => p.key !== "_");
    const destination = {
      pathname: "/(tabs)/explore/[...path]" as const,
      params: { path: targetPath.map((segment) => segment.key) },
    };

    try {
      if (!navigation.isReady()) {
        router.dismissTo(destination);
        return;
      }

      const exploreRoutes = [
        { name: "index" as const },
        ...targetPath.map((segment, segmentIndex) => ({
          name: "[...path]" as const,
          params: {
            path: targetPath
              .slice(0, segmentIndex + 1)
              .map((parent) => parent.key),
          },
        })),
      ];

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "(tabs)",
              state: {
                index: 0,
                routes: [
                  {
                    name: "explore",
                    state: {
                      index: exploreRoutes.length - 1,
                      routes: exploreRoutes,
                    },
                  },
                ],
              },
            },
          ],
        }),
      );
    } catch {
      router.dismissTo(destination);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: procedure.code,
          ...(Platform.OS === "ios"
            ? headerActionOptions("left", {
                id: "procedure.close",
                label: "Закрити",
                symbol: "xmark",
                fallbackIcon: "close",
                color: t.textSecondary,
                onPress: () => {
                  Keyboard.dismiss();
                  if (router.canGoBack()) router.back();
                  else router.replace("/");
                },
              })
            : {}),
          ...headerActionOptions("right", {
            id: "procedure.bookmark",
            label: isPinned ? "Видалити закладку" : "Додати закладку",
            symbol: isPinned ? "bookmark.fill" : "bookmark",
            fallbackIcon: isPinned ? "bookmark" : "bookmark-outline",
            color: isPinned ? colors.amber[500] : t.textSecondary,
            onPress: toggleBookmark,
          }),
        }}
      />

      <ScrollView
        ref={scrollRef}
        testID="procedure.content"
        className="flex-1"
        style={{ backgroundColor }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 24 : 16,
          paddingBottom: insets.bottom + 32,
        }}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onContentSizeChange={() => {
          if (isEditing) scrollRef.current?.scrollToEnd({ animated: true });
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hierarchy path */}
        {path.length > 0 && (
          <View className="mb-6">
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
              Розташування
            </Text>
            {path
              .map((segment, index) => ({ segment, originalIndex: index }))
              .filter(({ segment }) => segment.key !== "_")
              .map(({ segment, originalIndex }) => (
                <Pressable
                  key={originalIndex}
                  testID={`procedure-breadcrumb-${originalIndex}`}
                  onPress={() => navigateToBreadcrumb(originalIndex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Перейти до ${segment.name_ua}`}
                  style={{ marginBottom: 8 }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    {segment.level === "class"
                      ? segment.code
                      : `${getLevelLabel(segment.level, activeClassifier)}${segment.code ? ` (${segment.code})` : ""}`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: accentColorDark,
                    }}
                  >
                    {segment.name_ua}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Procedure code badge */}
        <View className="mb-4">
          <View
            className="self-start px-4 py-2 rounded-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: 18,
                letterSpacing: 0.5,
              }}
            >
              {procedure.code}
            </Text>
          </View>
        </View>

        {/* Ukrainian name */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: t.text,
            marginBottom: 12,
            lineHeight: 32,
          }}
        >
          {procedure.name_ua}
        </Text>

        {/* English name */}
        {procedure.name_en ? (
          <Text
            style={{ fontSize: 16, color: t.textSecondary, lineHeight: 24 }}
          >
            {procedure.name_en}
          </Text>
        ) : null}

        {/* Notes section */}
        {isPro ? (
          <View style={{ marginTop: 24 }}>
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
              Нотатки
            </Text>
            {isEditing ? (
              <View>
                <TextInput
                  testID="procedure.note.input"
                  accessibilityLabel="Нотатка до коду"
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Введіть нотатку..."
                  placeholderTextColor={t.textMuted}
                  multiline
                  scrollEnabled
                  autoFocus
                  style={{
                    fontSize: 15,
                    color: t.text,
                    borderWidth: 1,
                    borderColor: accentColor,
                    borderRadius: 10,
                    padding: 12,
                    minHeight: 80,
                    maxHeight: 160,
                    textAlignVertical: "top",
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginTop: 8,
                    gap: 12,
                  }}
                >
                  <Pressable
                    testID="procedure.note.cancel"
                    accessibilityRole="button"
                    onPress={() => {
                      setIsEditing(false);
                      setNoteText("");
                    }}
                  >
                    <Text
                      style={{
                        color: t.textSecondary,
                        fontSize: 15,
                        fontWeight: "500",
                      }}
                    >
                      Скасувати
                    </Text>
                  </Pressable>
                  <Pressable
                    testID="procedure.note.save"
                    accessibilityRole="button"
                    onPress={() => {
                      if (noteText.trim()) {
                        setNote(procedure.code, noteText.trim());
                      } else {
                        deleteNote(procedure.code);
                      }
                      setIsEditing(false);
                      setNoteText("");
                    }}
                  >
                    <Text
                      style={{
                        color: accentColor,
                        fontSize: 15,
                        fontWeight: "600",
                      }}
                    >
                      Зберегти
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : existingNote ? (
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    color: t.text,
                    lineHeight: 22,
                    marginBottom: 8,
                  }}
                >
                  {existingNote}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 16,
                  }}
                >
                  <Pressable
                    testID="procedure.note.edit"
                    accessibilityRole="button"
                    onPress={() => {
                      setNoteText(existingNote);
                      setIsEditing(true);
                    }}
                  >
                    <Text
                      style={{
                        color: accentColor,
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      Редагувати
                    </Text>
                  </Pressable>
                  <Pressable
                    testID="procedure.note.delete"
                    accessibilityRole="button"
                    onPress={() => deleteNote(procedure.code)}
                  >
                    <Text
                      style={{
                        color: colors.gray[400],
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      Видалити
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                testID="procedure.note.add"
                accessibilityRole="button"
                onPress={() => {
                  setNoteText("");
                  setIsEditing(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: accentColor,
                    fontSize: 15,
                    fontWeight: "500",
                  }}
                >
                  Додати нотатку
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 24 }}>
            <Pressable
              testID="procedure.note.upgrade"
              accessibilityRole="button"
              onPress={() => router.push("/pro" as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.violet[500],
                  }}
                >
                  PRO
                </Text>
              </View>
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: 14,
                }}
              >
                Додайте нотатки до кодів
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function findProcedure(data: AchiData, targetCode: string): LeafCode | null {
  function searchNode(children: CategoryChildren): LeafCode | null {
    if (isLeafLevel(children)) {
      return children.find((proc) => proc.code === targetCode) ?? null;
    }

    for (const node of Object.values(children)) {
      const result = searchNode(node.children);
      if (result) return result;
    }

    return null;
  }

  return searchNode(data.children);
}
