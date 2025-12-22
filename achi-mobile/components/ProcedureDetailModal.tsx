import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { BlurCard } from "./BlurCard";
import { colors } from "@/lib/constants";
import type { ProcedureCode, PathSegment } from "@/lib/types";

interface ProcedureDetailModalProps {
  visible: boolean;
  procedure: ProcedureCode | null;
  path: PathSegment[];
  onClose: () => void;
}

export function ProcedureDetailModal({
  visible,
  procedure,
  path,
  onClose,
}: ProcedureDetailModalProps) {
  if (!procedure) return null;

  const categoryPath = path.length > 0
    ? "/(tabs)/explore/" + path.map((p) => encodeURIComponent(p.key)).join("/")
    : "/(tabs)/explore";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-white rounded-t-3xl"
          style={{
            maxHeight: "85%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          <ScrollView
            className="px-6 pt-6 pb-8"
            showsVerticalScrollIndicator={false}
          >
            {/* Close button */}
            <View className="flex-row justify-between items-start mb-6">
              <Text className="text-2xl font-bold text-gray-800">
                Деталі процедури
              </Text>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                accessibilityLabel="Закрити"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </Pressable>
            </View>

            {/* Breadcrumb path */}
            {path.length > 0 && (
              <View className="mb-6">
                <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Розташування
                </Text>
                <View className="flex-row flex-wrap items-center">
                  {path.map((segment, index) => (
                    <View key={segment.key} className="flex-row items-center">
                      <Text className="text-sm text-gray-600">
                        {segment.name_ua}
                      </Text>
                      {index < path.length - 1 && (
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.gray[400]}
                          style={{ marginHorizontal: 6 }}
                        />
                      )}
                    </View>
                  ))}
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
            <Text className="text-base text-gray-500 mb-8 leading-6">
              {procedure.name_en}
            </Text>

            {/* Navigate to category button */}
            {path.length > 0 && (
              <Link href={categoryPath as any} asChild onPress={onClose}>
                <Pressable
                  className="flex-row items-center justify-center py-4 rounded-xl mb-4"
                  style={{ backgroundColor: colors.sky[500] }}
                  accessibilityLabel="Перейти до категорії"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white font-semibold text-base">
                    Перейти до категорії
                  </Text>
                </Pressable>
              </Link>
            )}

            {/* Close button (secondary) */}
            <Pressable
              onPress={onClose}
              className="flex-row items-center justify-center py-4 rounded-xl"
              style={{ backgroundColor: colors.gray[100] }}
              accessibilityLabel="Закрити"
              accessibilityRole="button"
            >
              <Text className="text-gray-700 font-semibold text-base">
                Закрити
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
