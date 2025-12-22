import { View, Text, Pressable, Linking, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurCard } from "@/components/BlurCard";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM } from "@/lib/constants";

export default function AboutScreen() {
  const handleOpenPDF = async () => {
    const url = "https://zoiacms.zp.ua/wp-content/uploads/2020/03/Австралійський-класифікатор-мед.інтервенцій.pdf";
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Помилка", "Не вдалося відкрити посилання");
      }
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося відкрити PDF документ");
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: '#FAFBFC' }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
        paddingTop: 12,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <InfoCard icon="medical-outline" title="АКМІ" color={colors.violet[500]}>
        <Text className="text-gray-600 leading-6">
          Австралійська класифікація медичних інтервенцій (ACHI) — це система
          класифікації процедур та інтервенцій, що використовується в охороні
          здоров'я.
        </Text>
      </InfoCard>

      <InfoCard icon="language-outline" title="Переклад" color={colors.violet[500]}>
        <Text className="text-gray-600 leading-6">
          Український переклад ACHI надає можливість медичним працівникам
          використовувати стандартизовану класифікацію рідною мовою.
        </Text>
      </InfoCard>

      <InfoCard icon="book-outline" title="Джерело" color={colors.violet[500]}>
        <Text className="text-gray-600 leading-6 mb-3">
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

      <InfoCard icon="code-slash-outline" title="Розробка" color={colors.violet[500]}>
        <Text className="text-gray-600 leading-6">
          Додаток розроблено з використанням React Native та Expo для
          забезпечення кросплатформної сумісності.
        </Text>
      </InfoCard>

      <View className="mt-8 items-center">
        <Text className="text-gray-400 text-sm">Версія 1.0.0</Text>
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
      <BlurCard>
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
              <Text className="text-lg font-semibold text-gray-900">{title}</Text>
            </View>
            {children}
          </View>
        </View>
      </BlurCard>
    </View>
  );
}
