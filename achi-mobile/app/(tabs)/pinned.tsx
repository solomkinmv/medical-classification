import { View, Text, FlatList, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFavorites } from "@/lib/favorites-provider";
import type { ProcedureCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-100">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-amber-500 pb-4 px-4"
      >
        <Text className="text-3xl font-bold text-white mt-2">Збережені</Text>
        <Text className="text-amber-100 text-sm mt-1">
          Ваші збережені процедури
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Завантаження...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-4">
            <Ionicons name="bookmark-outline" size={40} color="#f59e0b" />
          </View>
          <Text className="text-xl font-semibold text-gray-700 text-center">
            Немає збережених
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Натисніть на закладку біля процедури, щоб зберегти її тут
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PinnedCard procedure={item} onToggle={() => toggleFavorite(item)} />
          )}
        />
      )}
    </View>
  );
}

interface PinnedCardProps {
  procedure: ProcedureCode;
  onToggle: () => void;
}

function PinnedCard({ procedure, onToggle }: PinnedCardProps) {
  return (
    <View className="mb-3 rounded-2xl overflow-hidden">
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint="light" className="p-4">
          <CardContent procedure={procedure} onToggle={onToggle} />
        </BlurView>
      ) : (
        <View className="p-4 bg-white/90">
          <CardContent procedure={procedure} onToggle={onToggle} />
        </View>
      )}
    </View>
  );
}

function CardContent({
  procedure,
  onToggle,
}: {
  procedure: ProcedureCode;
  onToggle: () => void;
}) {
  return (
    <View>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="bg-amber-500/10 self-start px-2 py-1 rounded-lg mb-2">
            <Text className="text-sm text-amber-600 font-bold">
              {procedure.code}
            </Text>
          </View>
          <Text className="text-base text-gray-800 font-medium mb-1">
            {procedure.name_ua}
          </Text>
          <Text className="text-sm text-gray-500 italic">
            {procedure.name_en}
          </Text>
        </View>
        <Pressable
          onPress={onToggle}
          className="w-10 h-10 rounded-full bg-amber-500/10 items-center justify-center"
        >
          <Ionicons name="bookmark" size={20} color="#f59e0b" />
        </Pressable>
      </View>
    </View>
  );
}
