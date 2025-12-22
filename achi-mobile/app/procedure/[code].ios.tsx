import { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Host, Image, Button, ImageProps } from "@expo/ui/swift-ui";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { AnimatedBookmarkButton } from "@/components/AnimatedBookmarkButton";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { findProcedurePath } from "@/lib/navigation";
import { colors, theme } from "@/lib/constants";
import type { AchiData, CategoryChildren, ProcedureCode } from "@/lib/types";
import { isLeafLevel } from "@/lib/types";

type SFSymbolName = ImageProps["systemName"];

export default function ProcedureDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const data = useAchiData();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  const procedure = useMemo(
    () => (code ? findProcedure(data, code) : null),
    [data, code]
  );

  const path = useMemo(
    () => (procedure ? findProcedurePath(data, procedure.code) ?? [] : []),
    [data, procedure]
  );

  const isPinned = procedure ? isFavorite(procedure.code) : false;
  const isLiquidGlass = useMemo(() => isLiquidGlassAvailable(), []);
  const backgroundColor = isLiquidGlass ? "transparent" : t.background;

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

  return (
    <>
      <Stack.Screen
        options={{
          title: procedure.code,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={20}>
              <Host matchContents>
                <Button variant="glass" onPress={() => router.back()}>
                  <Image
                    systemName={"xmark" as SFSymbolName}
                    size={20}
                    color={t.textSecondary}
                  />
                </Button>
              </Host>
            </Pressable>
          ),
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
          paddingTop: 24,
          paddingBottom: insets.bottom + 32,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb path */}
        {path.length > 0 && (
          <View className="mb-6">
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: t.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Розташування
            </Text>
            <View className="mt-2" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
              {path.map((segment, index) => {
                const segmentPath =
                  "/(tabs)/explore/" +
                  path
                    .slice(0, index + 1)
                    .map((p) => encodeURIComponent(p.key))
                    .join("/");
                return (
                  <View key={segment.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Pressable
                      onPress={() => {
                        router.dismiss();
                        router.push(segmentPath as any);
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "500", color: colors.sky[600] }}>
                        {segment.name_ua}
                      </Text>
                    </Pressable>
                    {index < path.length - 1 && (
                      <View style={{ marginHorizontal: 6 }}>
                        <Host matchContents>
                          <Image
                            systemName={"chevron.right" as SFSymbolName}
                            size={12}
                            color={colors.gray[400]}
                          />
                        </Host>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Procedure code badge */}
        <View className="mb-4">
          <View
            className="self-start px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.sky[500] }}
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

function findProcedure(data: AchiData, targetCode: string): ProcedureCode | null {
  function searchNode(children: CategoryChildren): ProcedureCode | null {
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
