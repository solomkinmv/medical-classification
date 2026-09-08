import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { headerActionOptions } from "@/components/navigation-header";
import { useProStatus } from "@/lib/pro-provider";
import { useTheme } from "@/lib/useTheme";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { colors } from "@/lib/constants";

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: "bookmark",
    title: "Необмежені закладки",
    description: "Зберігайте скільки завгодно кодів",
  },
  {
    icon: "folder",
    title: "Папки",
    description: "Організуйте закладки у власні колекції",
  },
  {
    icon: "document-text",
    title: "Нотатки",
    description: "Додавайте примітки до будь-якого коду",
  },
];

function useCloseProScreen() {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
}

export default function ProScreen() {
  const {
    isPro,
    isProLoading,
    purchasePro,
    restorePurchases,
    product,
    productStatus,
    purchaseStatus,
    retryStore,
  } = useProStatus();
  const isPurchasing = purchaseStatus === "purchasing";
  const isRestoring = purchaseStatus === "restoring";
  const close = useCloseProScreen();
  const insets = useSafeAreaInsets();
  const { colors: t } = useTheme();
  const backgroundColor = useBackgroundColor();

  const displayPrice = product?.displayPrice ?? null;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePurchase = () => {
    void purchasePro();
  };
  const handleRestore = async () => {
    const result = await restorePurchases();
    if (isMounted.current && result === "not-owned") {
      Alert.alert("Покупки не знайдено", "Не знайдено попередніх покупок Pro");
    }
  };

  if (isProLoading) {
    return (
      <>
        <ProScreenHeader />
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor }}
        >
          <ActivityIndicator size="large" color={colors.violet[500]} />
        </View>
      </>
    );
  }

  if (isPro) {
    return (
      <>
        <ProScreenHeader />
        <ScrollView
          testID="pro.success"
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={colors.emerald[500]}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: t.text,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Pro активовано!
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: t.textSecondary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Вам доступні всі можливості Pro
          </Text>
          <View style={{ width: "100%", marginTop: 28 }}>
            {FEATURES.map((feature) => (
              <View
                key={feature.icon}
                style={{ flexDirection: "row", marginBottom: 20, gap: 14 }}
              >
                <Ionicons
                  name={feature.icon}
                  size={24}
                  color={colors.emerald[500]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: t.text, fontSize: 17, fontWeight: "600" }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={{
                      color: t.textSecondary,
                      fontSize: 15,
                      marginTop: 4,
                    }}
                  >
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            onPress={close}
            style={{
              marginTop: 32,
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 12,
              backgroundColor: colors.violet[500],
            }}
            accessibilityRole="button"
            testID="pro.done"
            accessibilityLabel="Закрити"
          >
            <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>
              Закрити
            </Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <ProScreenHeader />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 24 : 16,
          paddingBottom: insets.bottom + 32,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.violet[500]}15`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="star" size={40} color={colors.violet[500]} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: t.text,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Медичні Коди Pro
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: t.textSecondary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Розблокуйте всі можливості
          </Text>
        </View>

        <View className="mb-8">
          {FEATURES.map((feature) => (
            <View
              key={feature.icon}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.violet[500]}15`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons
                  name={feature.icon}
                  size={22}
                  color={colors.violet[500]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: t.text,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: t.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text
          testID="pro.status"
          accessibilityLiveRegion="polite"
          style={{
            color: t.textSecondary,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {purchaseStatus === "pending"
            ? "Очікуємо підтвердження магазину. Можна закрити цей екран і повернутися пізніше або відновити покупки."
            : productStatus === "unavailable"
              ? "Не вдалося завантажити ціну. Перевірте з’єднання та спробуйте ще раз."
              : ""}
        </Text>
        {productStatus === "unavailable" && (
          <Pressable
            testID="pro.retry"
            accessibilityRole="button"
            onPress={() => {
              void retryStore();
            }}
            disabled={isPurchasing || isRestoring}
            style={{ padding: 16 }}
          >
            <Text style={{ color: t.text, textAlign: "center" }}>
              Спробувати ще раз
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handlePurchase}
          testID="pro.purchase"
          disabled={
            purchaseStatus !== "idle" || productStatus !== "ready" || !product
          }
          style={{
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: isPurchasing
              ? colors.violet[600]
              : colors.violet[500],
            alignItems: "center",
            opacity: isPurchasing ? 0.7 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={
            displayPrice
              ? `Купити Pro за ${displayPrice}`
              : productStatus === "loading"
                ? "Завантаження ціни"
                : "Магазин недоступний"
          }
        >
          {isPurchasing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 18 }}>
              {displayPrice
                ? `Купити Pro — ${displayPrice}`
                : productStatus === "loading"
                  ? "Завантаження..."
                  : "Магазин недоступний"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleRestore}
          testID="pro.restore"
          disabled={isRestoring || isPurchasing}
          style={{
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 16,
            opacity: isRestoring ? 0.5 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="Відновити покупки"
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.violet[500]} size="small" />
          ) : (
            <Text
              style={{
                color: colors.violet[500],
                fontWeight: "600",
                fontSize: 15,
              }}
            >
              Відновити покупки
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

function ProScreenHeader() {
  const close = useCloseProScreen();
  const { colors: t } = useTheme();

  return (
    <Stack.Screen
      options={{
        title: "Pro",
        ...(Platform.OS === "ios"
          ? headerActionOptions("left", {
              id: "pro.close",
              label: "Закрити",
              symbol: "xmark",
              fallbackIcon: "close",
              color: t.textSecondary,
              onPress: close,
            })
          : {}),
      }}
    />
  );
}
