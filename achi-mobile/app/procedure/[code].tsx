import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAchiData } from "@/lib/data-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { findProcedurePath } from "@/lib/navigation";
import { colors } from "@/lib/constants";
import type { AchiData, CategoryChildren, ProcedureCode } from "@/lib/types";
import { isLeafLevel } from "@/lib/types";

export default function ProcedureDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const data = useAchiData();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const procedure = useMemo(
    () => (code ? findProcedure(data, code) : null),
    [data, code]
  );

  const path = useMemo(
    () => (procedure ? findProcedurePath(data, procedure.code) ?? [] : []),
    [data, procedure]
  );

  const isPinned = procedure ? isFavorite(procedure.code) : false;

  if (!code) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FAFBFC' }}>
        <Text className="text-gray-500">Неправильний код процедури</Text>
      </View>
    );
  }

  if (!procedure) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FAFBFC' }}>
        <Text className="text-gray-500">Процедуру не знайдено</Text>
      </View>
    );
  }

  const categoryPath = path.length > 0
    ? "/(tabs)/explore/" + path.map((p) => encodeURIComponent(p.key)).join("/")
    : "/(tabs)/explore";

  return (
    <>
      <Stack.Screen
        options={{
          title: procedure.code,
          headerLeft: () =>
            Platform.OS === "ios" ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={20}
                accessibilityLabel="Закрити"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={28} color={colors.gray[500]} />
              </Pressable>
            ) : undefined,
          headerRight: () => (
            <Pressable
              onPress={() => toggleFavorite(procedure)}
              hitSlop={20}
              accessibilityLabel={
                isPinned ? "Видалити закладку" : "Додати закладку"
              }
              accessibilityRole="button"
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isPinned
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(156, 163, 175, 0.1)",
                }}
              >
                <Ionicons
                  name={isPinned ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={isPinned ? colors.amber[500] : colors.gray[400]}
                />
              </View>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: '#FAFBFC' }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 24 : 16,
          paddingBottom: insets.bottom + 32,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb path */}
        {path.length > 0 && (
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Розташування
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
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
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.sky[600] }}
                      >
                        {segment.name_ua}
                      </Text>
                    </Pressable>
                    {index < path.length - 1 && (
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={colors.gray[400]}
                        style={{ marginHorizontal: 6 }}
                      />
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
            <Text className="text-white font-bold text-lg tracking-wide">
              {procedure.code}
            </Text>
          </View>
        </View>

        {/* Ukrainian name */}
        <Text className="text-2xl font-semibold text-gray-900 mb-3 leading-8">
          {procedure.name_ua}
        </Text>

        {/* English name */}
        <Text className="text-base text-gray-500 leading-6">
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
