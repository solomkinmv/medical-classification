import { View, Text, Pressable, Linking, ScrollView, Alert } from "react-native";
import { Host, Image, Button, ImageProps } from "@expo/ui/swift-ui";
import { useColorScheme } from "nativewind";
import { colors, CONTENT_PADDING_HORIZONTAL, CONTENT_PADDING_BOTTOM, theme } from "@/lib/constants";

type SFSymbolName = ImageProps["systemName"];

const SF_SYMBOL_MAP: Record<string, SFSymbolName> = {
  "medical-outline": "cross.case",
  "language-outline": "globe",
  "book-outline": "book",
  "code-slash-outline": "chevron.left.forwardslash.chevron.right",
  "open-outline": "arrow.up.right.square",
};

export default function AboutScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

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
      console.error("Failed to open PDF:", error);
      Alert.alert("Помилка", "Не вдалося відкрити PDF документ");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#F0F2F5] dark:bg-[#0A0A0A]"
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <InfoCard icon="medical-outline" title="АКМІ" color={colors.violet[500]}>
        <Text style={{ color: t.textSecondary, lineHeight: 22 }}>
          Австралійська класифікація медичних інтервенцій (ACHI) — це система
          класифікації процедур та інтервенцій, що використовується в охороні
          здоров'я.
        </Text>
      </InfoCard>

      <InfoCard icon="language-outline" title="Переклад" color={colors.violet[500]}>
        <Text style={{ color: t.textSecondary, lineHeight: 22 }}>
          Український переклад ACHI надає можливість медичним працівникам
          використовувати стандартизовану класифікацію рідною мовою.
        </Text>
      </InfoCard>

      <InfoCard icon="book-outline" title="Джерело" color={colors.violet[500]}>
        <Text style={{ color: t.textSecondary, lineHeight: 22, marginBottom: 12 }}>
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
          <Host matchContents>
            <Image
              systemName={SF_SYMBOL_MAP["open-outline"]}
              size={16}
              color={colors.violet[500]}
            />
          </Host>
          <Text style={{ color: colors.violet[500], marginLeft: 8, fontWeight: "500" }}>
            Відкрити PDF документ
          </Text>
        </Pressable>
      </InfoCard>

      <InfoCard icon="code-slash-outline" title="Розробка" color={colors.violet[500]}>
        <Text style={{ color: t.textSecondary, lineHeight: 22 }}>
          Додаток розроблено з використанням React Native та Expo для
          забезпечення кросплатформної сумісності.
        </Text>
      </InfoCard>

      <View className="mt-8 items-center">
        <Text style={{ color: t.textMuted, fontSize: 14 }}>
          Версія 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

interface InfoCardProps {
  icon: string;
  title: string;
  color: string;
  children: React.ReactNode;
}

function InfoCard({ icon, title, color, children }: InfoCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? theme.dark : theme.light;

  const sfSymbol = SF_SYMBOL_MAP[icon] ?? ("questionmark.circle" as SFSymbolName);

  return (
    <View className="mb-3" accessible accessibilityLabel={title}>
      <View
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: t.card }}
      >
        <View className="flex-row items-start p-5">
          <View className="w-1 h-16 rounded-full mr-4" style={{ backgroundColor: color }} />

          <View className="flex-1">
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${color}15` }}
              >
                <Host matchContents>
                  <Image systemName={sfSymbol} size={20} color={color} />
                </Host>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: t.text }}>
                {title}
              </Text>
            </View>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}
