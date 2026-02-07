import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useLocalSearchParams, Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedBookmarkButton } from "@/components/AnimatedBookmarkButton";
import { ChevronIcon } from "@/components/ChevronIcon";
import { CloseButton } from "@/components/CloseButton";
import { useAchiData } from "@/lib/data-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { useTheme } from "@/lib/useTheme";
import { findProcedurePath } from "@/lib/navigation";
import { colors } from "@/lib/constants";
import type { AchiData, CategoryChildren, ClassifierType, LeafCode, PathSegment } from "@/lib/types";
import { isLeafLevel } from "@/lib/types";

function getLevelLabel(level: PathSegment["level"], classifier: ClassifierType): string {
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
  const { code, accent } = useLocalSearchParams<{ code: string; accent?: string }>();
  const isAmber = accent === "amber";
  const accentColor = isAmber ? colors.amber[500] : colors.sky[500];
  const accentColorDark = isAmber ? colors.amber[600] : colors.sky[600];
  const data = useAchiData();
  const { activeClassifier } = useClassifier();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const navigation = useNavigationContainerRef();
  const insets = useSafeAreaInsets();
  const { colors: t } = useTheme();
  const backgroundColor = useBackgroundColor();

  const procedure = useMemo(
    () => (code ? findProcedure(data, code) : null),
    [data, code]
  );

  const path = useMemo(
    () => (procedure ? findProcedurePath(data, procedure.code, activeClassifier) ?? [] : []),
    [data, procedure, activeClassifier]
  );

  const isPinned = procedure ? isFavorite(procedure.code) : false;

  if (!code) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor }}
      >
        <Text style={{ color: t.textSecondary }}>
          Неправильний код процедури
        </Text>
      </View>
    );
  }

  if (!procedure) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor }}
      >
        <Text style={{ color: t.textSecondary }}>
          Процедуру не знайдено
        </Text>
      </View>
    );
  }

  const navigateToBreadcrumb = (index: number) => {
    // Get path up to clicked segment, filtering out underscore categories
    const targetPath = path.slice(0, index + 1).filter((p) => p.key !== "_");
    const fullPathWithoutUnderscore = path.filter((p) => p.key !== "_");

    // If clicking on the last (current) category, just close the modal
    if (targetPath.length === fullPathWithoutUnderscore.length) {
      router.dismiss();
      return;
    }

    if (targetPath.length === 0) {
      router.dismiss();
      router.push("/(tabs)/explore" as any);
      return;
    }

    const segmentPath =
      "/(tabs)/explore/" +
      targetPath.map((p) => encodeURIComponent(p.key)).join("/");

    try {
      if (!navigation.isReady()) {
        router.dismiss();
        router.push(segmentPath as any);
        return;
      }

      router.dismiss();

      requestAnimationFrame(() => {
        // Build routes without underscore segments
        const pathWithoutUnderscore = path.filter((p) => p.key !== "_");
        const targetIndex = pathWithoutUnderscore.findIndex(
          (p) => p.key === path[index]?.key
        );
        const routePath = pathWithoutUnderscore.slice(0, targetIndex + 1);

        const exploreRoutes = [
          { name: "index" as const },
          ...routePath.map((_, i) => ({
            name: "[...path]" as const,
            params: {
              path: routePath.slice(0, i + 1).map((p) => p.key),
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
          })
        );
      });
    } catch {
      router.dismiss();
      router.push(segmentPath as any);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: procedure.code,
          headerLeft: Platform.OS === "ios"
            ? () => (
                <CloseButton
                  onPress={() => router.back()}
                  color={t.textSecondary}
                />
              )
            : undefined,
          headerRight: () => (
            <AnimatedBookmarkButton
              isBookmarked={isPinned}
              onPress={() => toggleFavorite(procedure)}
              color={isPinned ? colors.amber[500] : colors.gray[400]}
              backgroundColor={
                isPinned
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(156, 163, 175, 0.1)"
              }
              size={18}
              accessibilityLabel={isPinned ? "Видалити закладку" : "Додати закладку"}
            />
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 24 : 16,
          paddingBottom: insets.bottom + 32,
        }}
        contentInsetAdjustmentBehavior="automatic"
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
                  key={segment.key}
                  onPress={() => navigateToBreadcrumb(originalIndex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Перейти до ${segment.name_ua}`}
                  style={{ marginBottom: 8 }}
                >
                  <Text style={{ fontSize: 11, color: t.textMuted, marginBottom: 2 }}>
                    {segment.level === "class"
                      ? segment.code
                      : `${getLevelLabel(segment.level, activeClassifier)}${segment.code ? ` (${segment.code})` : ""}`}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: accentColorDark }}>
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
            <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 18, letterSpacing: 0.5 }}>
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
        <Text style={{ fontSize: 16, color: t.textSecondary, lineHeight: 24 }}>
          {procedure.name_en}
        </Text>
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
