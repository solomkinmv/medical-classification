import { View, Text, Pressable, Linking, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Card } from "@/components/Card";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM, theme } from "@/lib/constants";

export default function AboutScreen() {
  const { colorScheme } = useColorScheme();
  const t = colorScheme === "dark" ? theme.dark : theme.light;

  const handleOpenURL = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Помилка", "Не вдалося відкрити посилання");
      }
    } catch {
      Alert.alert("Помилка", "Не вдалося відкрити посилання");
    }
  };

  const handleOpenPDF = () => {
    handleOpenURL("https://www.dec.gov.ua/wp-content/uploads/2023/01/nk-026_2021_.pdf");
  };

  const handleOpenDeveloper = () => {
    handleOpenURL("https://solomk.in");
  };

  const handleOpenSupport = () => {
    handleOpenURL("mailto:support+achi@solomk.in");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <InfoCard icon="list-outline" title="АКМІ" color={colors.violet[500]}>
        <Text className="text-gray-600 dark:text-gray-400 leading-6">
          АКМІ (Австралійська класифікація медичних інтервенцій) — українська
          назва ACHI (Australian Classification of Health Interventions).
          Табличний перелік інтервенцій, що використовується в охороні здоров'я.
        </Text>
      </InfoCard>

      <InfoCard icon="medical-outline" title="Можливості" color={colors.violet[500]}>
        <Text className="text-gray-600 dark:text-gray-400 leading-6">
          Зручний доступ до кодів медичних операцій на основі офіційної
          української документації. Додаток дозволяє швидко знайти потрібні
          коди за допомогою простої навігації.
        </Text>
      </InfoCard>

      <InfoCard icon="book-outline" title="Джерело" color={colors.violet[500]}>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-3">
          Дані класифікації базуються на офіційному документі Австралійської
          класифікації медичних інтервенцій.
        </Text>
        <Pressable
          className="flex-row items-center"
          accessibilityLabel="Відкрити PDF документ"
          accessibilityRole="link"
          accessibilityHint="Відкриває PDF документ класифікатора у браузері"
          onPress={handleOpenPDF}
        >
          <Ionicons name="open-outline" size={16} color={colors.violet[500]} />
          <Text className="text-violet-500 ml-2 font-medium">
            Відкрити PDF документ
          </Text>
        </Pressable>
      </InfoCard>

      <InfoCard icon="mail-outline" title="Зворотний зв'язок" color={colors.violet[500]}>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-3">
          Маєте пропозиції чи зауваження? Напишіть нам.
        </Text>
        <Pressable
          className="flex-row items-center mb-2"
          accessibilityLabel="Написати на пошту"
          accessibilityRole="link"
          accessibilityHint="Відкриває поштовий клієнт"
          onPress={handleOpenSupport}
        >
          <Ionicons name="mail-outline" size={16} color={colors.violet[500]} />
          <Text className="text-violet-500 ml-2 font-medium">
            support+achi@solomk.in
          </Text>
        </Pressable>
        <Pressable
          className="flex-row items-center"
          accessibilityLabel="Відкрити сайт розробника"
          accessibilityRole="link"
          accessibilityHint="Відкриває сайт розробника у браузері"
          onPress={handleOpenDeveloper}
        >
          <Ionicons name="globe-outline" size={16} color={colors.violet[500]} />
          <Text className="text-violet-500 ml-2 font-medium">
            solomk.in
          </Text>
        </Pressable>
      </InfoCard>

      <View className="mt-8 items-center">
        <Text className="text-gray-400 dark:text-gray-500 text-sm">Версія 1.0.0</Text>
      </View>
    </ScrollView>
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
      className="mb-3"
      accessible
      accessibilityLabel={title}
    >
      <Card>
        <View className="flex-row items-start p-5">
          <View className="w-1 h-16 rounded-full mr-4" style={{ backgroundColor: color }} />

          <View className="flex-1">
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${color}15` }}
              >
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</Text>
            </View>
            {children}
          </View>
        </View>
      </Card>
    </View>
  );
}
