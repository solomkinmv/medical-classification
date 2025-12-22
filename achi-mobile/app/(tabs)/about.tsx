import { useRef } from "react";
import { View, Text, Pressable, Linking, Platform, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurCard } from "@/components/BlurCard";
import { HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT, HEADER_SCROLL_DISTANCE, colors } from "@/lib/constants";

export default function AboutScreen() {
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
              <Text className="text-3xl font-bold text-violet-600 mt-2">Про додаток</Text>
              <Text className="text-violet-500 text-sm mt-1">
                Інформація та джерела
              </Text>
            </Animated.View>
          </BlurView>
        ) : (
          <View style={[styles.headerBlur, { paddingTop: insets.top, backgroundColor: "#8b5cf6" }]}>
            <Animated.View
              style={{
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              }}
            >
              <Text className="text-3xl font-bold text-white mt-2">Про додаток</Text>
              <Text className="text-violet-100 text-sm mt-1">
                Інформація та джерела
              </Text>
            </Animated.View>
          </View>
        )}
      </Animated.View>

      <Animated.ScrollView
        className="flex-1"
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
      >
        <InfoCard
          icon="medical-outline"
          title="АКМІ"
          color="#8b5cf6"
        >
          <Text className="text-gray-600 leading-6">
            Австралійська класифікація медичних інтервенцій (ACHI) — це система
            класифікації процедур та інтервенцій, що використовується в охороні
            здоров'я.
          </Text>
        </InfoCard>

        <InfoCard
          icon="language-outline"
          title="Переклад"
          color="#8b5cf6"
        >
          <Text className="text-gray-600 leading-6">
            Український переклад ACHI надає можливість медичним працівникам
            використовувати стандартизовану класифікацію рідною мовою.
          </Text>
        </InfoCard>

        <InfoCard
          icon="book-outline"
          title="Джерело"
          color="#8b5cf6"
        >
          <Text className="text-gray-600 leading-6 mb-3">
            Дані класифікації базуються на офіційному документі Австралійської
            класифікації медичних інтервенцій.
          </Text>
          <Pressable
            className="flex-row items-center"
            onPress={() =>
              Linking.openURL(
                "https://zoiacms.zp.ua/wp-content/uploads/2020/03/Австралійський-класифікатор-мед.інтервенцій.pdf"
              )
            }
          >
            <Ionicons name="open-outline" size={16} color="#8b5cf6" />
            <Text className="text-violet-500 ml-2 font-medium">
              Відкрити PDF документ
            </Text>
          </Pressable>
        </InfoCard>

        <InfoCard
          icon="code-slash-outline"
          title="Розробка"
          color="#8b5cf6"
        >
          <Text className="text-gray-600 leading-6">
            Додаток розроблено з використанням React Native та Expo для
            забезпечення кросплатформної сумісності.
          </Text>
        </InfoCard>

        <View className="mt-8 items-center">
          <Text className="text-gray-400 text-sm">Версія 1.0.0</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  children: React.ReactNode;
}

function InfoCard({ icon, title, color, children }: InfoCardProps) {
  return (
    <View
      className="mb-4 rounded-2xl overflow-hidden"
      accessible
      accessibilityLabel={title}
    >
      <BlurCard>
        <View className="flex-row items-center mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${color}15` }}
          >
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
        </View>
        {children}
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
