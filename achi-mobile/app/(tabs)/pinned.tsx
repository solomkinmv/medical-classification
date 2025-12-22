import { useRef } from "react";
import { View, Text, Pressable, Platform, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurCard } from "@/components/BlurCard";
import { useFavorites } from "@/lib/favorites-provider";
import { HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT, HEADER_SCROLL_DISTANCE, colors } from "@/lib/constants";
import type { ProcedureCode } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT + insets.top, HEADER_MIN_HEIGHT + insets.top],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1 bg-gray-100">
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint="systemChromeMaterial"
            style={[styles.headerBlur, { paddingTop: insets.top }]}
          >
            <Animated.View
              style={{
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              }}
            >
              <Text className="text-3xl font-bold text-amber-600 mt-2">Збережені</Text>
              <Text className="text-amber-500 text-sm mt-1">
                Ваші збережені процедури
              </Text>
            </Animated.View>
          </BlurView>
        ) : (
          <View style={[styles.headerBlur, { paddingTop: insets.top, backgroundColor: "#f59e0b" }]}>
            <Animated.View
              style={{
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              }}
            >
              <Text className="text-3xl font-bold text-white mt-2">Збережені</Text>
              <Text className="text-amber-100 text-sm mt-1">
                Ваші збережені процедури
              </Text>
            </Animated.View>
          </View>
        )}
      </Animated.View>

      {isLoading ? (
        <View style={{ marginTop: HEADER_MAX_HEIGHT + insets.top }} className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Завантаження...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={{ marginTop: HEADER_MAX_HEIGHT + insets.top }} className="flex-1 items-center justify-center px-8">
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
        <Animated.FlatList
          data={favorites}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{
            paddingTop: HEADER_MAX_HEIGHT + insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: 100
          }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
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
      <BlurCard>
        <View
          className="flex-row items-start justify-between"
          accessible
          accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
        >
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
            accessibilityLabel="Видалити закладку"
            accessibilityRole="button"
            className="w-10 h-10 rounded-full bg-amber-500/10 items-center justify-center"
          >
            <Ionicons name="bookmark" size={20} color={colors.amber[500]} />
          </Pressable>
        </View>
      </BlurCard>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  headerBlur: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },
});
