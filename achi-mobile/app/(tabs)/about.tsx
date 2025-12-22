import { View, Text, ScrollView, Pressable, Linking, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 100;

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const headerContent = (isBlur: boolean) => (
    <>
      <Text className={`text-3xl font-bold ${isBlur ? "text-violet-600" : "text-white"} mt-2`}>
        Про додаток
      </Text>
      <Text className={`${isBlur ? "text-violet-500" : "text-violet-100"} text-sm mt-1`}>
        Інформація та джерела
      </Text>
    </>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <View style={[styles.header, { height: HEADER_HEIGHT + insets.top }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint="systemChromeMaterial"
            style={[styles.headerBlur, { paddingTop: insets.top }]}
          >
            {headerContent(true)}
          </BlurView>
        ) : (
          <View style={[styles.headerBlur, { paddingTop: insets.top, backgroundColor: "#8b5cf6" }]}>
            {headerContent(false)}
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 100
        }}
        showsVerticalScrollIndicator={false}
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
      </ScrollView>
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
    <View className="mb-4 rounded-2xl overflow-hidden">
      {Platform.OS === "ios" ? (
        <BlurView intensity={60} tint="light" className="p-4">
          <CardContent icon={icon} title={title} color={color}>
            {children}
          </CardContent>
        </BlurView>
      ) : (
        <View className="p-4 bg-white/90">
          <CardContent icon={icon} title={title} color={color}>
            {children}
          </CardContent>
        </View>
      )}
    </View>
  );
}

function CardContent({
  icon,
  title,
  color,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <>
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
    </>
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
