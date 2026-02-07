import {
  View,
  Text,
  Pressable,
  Linking,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Card } from "@/components/Card";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  theme,
} from "@/lib/constants";

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

  const handleOpenAchiPDF = () => {
    handleOpenURL(
      "https://www.dec.gov.ua/wp-content/uploads/2023/01/nk-026_2021_.pdf",
    );
  };

  const handleOpenMkh10PDF = () => {
    handleOpenURL(
      "https://www.dec.gov.ua/wp-content/uploads/2021/11/naczionalnyj-klasyfikator-nk-025.pdf",
    );
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
      <InfoCard
        icon="list-outline"
        title="Що таке АКМІ?"
        color={colors.violet[500]}
      >
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          АКМІ (Австралійський класифікатор медичних інтервенцій) — українська
          назва ACHI (Australian Classification of Health Interventions).
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          Структурований довідник кодів із 20 класів за анатомічним принципом.
          Має 5 рівнів ієрархії: від класу до конкретного коду інтервенції.
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6">
          Містить 6 728 кодів медичних процедур українською та англійською
          мовами.
        </Text>
      </InfoCard>

      <InfoCard
        icon="document-text-outline"
        title="НК 026:2021"
        color={colors.violet[500]}
      >
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          Національний класифікатор України «Класифікатор медичних інтервенцій».
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          Чинний з 01.09.2021. Затверджено наказом Міністерства економіки
          України від 04.08.2021 № 360-21.
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6">
          Гармонізовано з Австралійським класифікатором медичних інтервенцій
          (ACHI), 10-та редакція, 1 липня 2017 року.
        </Text>
      </InfoCard>

      <InfoCard icon="book-outline" title="Джерело" color={colors.violet[500]}>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-3">
          Дані класифікації базуються на офіційному документі.
        </Text>
        <Pressable
          className="flex-row items-center"
          accessibilityLabel="Відкрити PDF документ класифікатора"
          accessibilityRole="link"
          accessibilityHint="Відкриває PDF документ класифікатора у браузері"
          onPress={handleOpenAchiPDF}
        >
          <Ionicons name="open-outline" size={16} color={colors.violet[500]} />
          <Text className="text-violet-500 ml-2 font-medium">
            Класифікатор НК 026:2021 (PDF)
          </Text>
        </Pressable>
      </InfoCard>

      <InfoCard
        icon="medkit-outline"
        title="Що таке МКХ-10?"
        color={colors.emerald[500]}
      >
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          МКХ-10 (Міжнародна класифікація хвороб 10-го перегляду) — система
          кодування діагнозів та захворювань, прийнята Всесвітньою організацією
          охорони здоров&apos;я.
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          Структурований довідник із 22 класів захворювань. Має 5 рівнів
          ієрархії: клас, блок, нозологія, 4-значний та 5-значний код.
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6">
          Містить 16 960 кодів захворювань українською та англійською мовами.
        </Text>
      </InfoCard>

      <InfoCard
        icon="document-text-outline"
        title="НК 025:2021"
        color={colors.emerald[500]}
      >
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          Національний класифікатор України «Класифікатор хвороб та споріднених
          проблем охорони здоров&apos;я».
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-2">
          Чинний з 01.09.2021. Затверджено наказом Міністерства економіки
          України від 04.08.2021 № 360-21.
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-3">
          Гармонізовано з МКХ-10-АМ (Австралійська модифікація), 1 липня 2017
          року.
        </Text>
        <Pressable
          className="flex-row items-center"
          accessibilityLabel="Відкрити PDF документ класифікатора МКХ-10"
          accessibilityRole="link"
          accessibilityHint="Відкриває PDF документ класифікатора МКХ-10 у браузері"
          onPress={handleOpenMkh10PDF}
        >
          <Ionicons name="open-outline" size={16} color={colors.emerald[500]} />
          <Text className="text-emerald-500 ml-2 font-medium">
            Класифікатор НК 025:2021 (PDF)
          </Text>
        </Pressable>
      </InfoCard>

      <InfoCard
        icon="mail-outline"
        title="Зворотний зв'язок"
        color={colors.violet[500]}
      >
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
          <Text className="text-violet-500 ml-2 font-medium">solomk.in</Text>
        </Pressable>
      </InfoCard>

      <View className="mt-8 items-center">
        <Text className="text-gray-400 dark:text-gray-500 text-sm">
          Версія 1.0.0
        </Text>
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
    <View className="mb-3" accessible accessibilityLabel={title}>
      <Card>
        <View className="flex-row items-start p-5">
          <View
            className="w-1 h-16 rounded-full mr-4"
            style={{ backgroundColor: color }}
          />

          <View className="flex-1">
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${color}15` }}
              >
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </Text>
            </View>
            {children}
          </View>
        </View>
      </Card>
    </View>
  );
}
