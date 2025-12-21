import { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Animated,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAchiData } from "@/lib/data-provider";
import { getRootCategories } from "@/lib/navigation";
import type { CategoryNode } from "@/lib/types";

const HEADER_MAX_HEIGHT = 140;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ExploreScreen() {
  const data = useAchiData();
  const categories = getRootCategories(data);
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
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            paddingTop: insets.top,
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text className="text-3xl font-bold text-white mt-2">АКМІ</Text>
          <Text className="text-sky-100 text-sm mt-1">
            Австралійська класифікація медичних інтервенцій
          </Text>
        </Animated.View>

        <Pressable
          className="mt-3 flex-row items-center bg-white/20 rounded-2xl px-4 py-3"
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
          <Text className="ml-3 text-white/80 text-base">
            Пошук процедури...
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.FlatList
        data={categories}
        keyExtractor={([key]) => key}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item: [key, node] }) => (
          <CategoryCard categoryKey={key} node={node} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0ea5e9",
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },
});

interface CategoryCardProps {
  categoryKey: string;
  node: CategoryNode;
}

function CategoryCard({ categoryKey, node }: CategoryCardProps) {
  const href = `/(tabs)/explore/${encodeURIComponent(categoryKey)}`;

  return (
    <Link href={href as `/(tabs)/explore/${string}`} asChild>
      <Pressable className="mb-3 rounded-2xl overflow-hidden">
        {Platform.OS === "ios" ? (
          <BlurView intensity={60} tint="light" className="p-4">
            <CardContent node={node} />
          </BlurView>
        ) : (
          <View className="p-4 bg-white/90">
            <CardContent node={node} />
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function CardContent({ node }: { node: CategoryNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        {node.clazz && (
          <View className="bg-sky-500/10 self-start px-2 py-1 rounded-lg mb-2">
            <Text className="text-xs text-sky-600 font-semibold">
              {node.clazz}
            </Text>
          </View>
        )}
        <Text className="text-base text-gray-800 font-medium" numberOfLines={2}>
          {node.name_ua}
        </Text>
      </View>
      <View className="w-8 h-8 rounded-full bg-sky-500/10 items-center justify-center">
        <Ionicons name="chevron-forward" size={18} color="#0ea5e9" />
      </View>
    </View>
  );
}
