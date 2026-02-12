import { useState, useEffect, useRef } from "react";
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
import { CloseButton } from "@/components/CloseButton";
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

export default function ProScreen() {
  const {
    isPro,
    isProLoading,
    purchasePro,
    restorePurchases,
    product,
    purchaseErrorCount,
  } = useProStatus();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: t } = useTheme();
  const backgroundColor = useBackgroundColor();

  const displayPrice = product?.displayPrice ?? null;
  const prevIsPro = useRef(isPro);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Clear purchasing state when a purchase error occurs (including cancellation)
  useEffect(() => {
    if (purchaseErrorCount > 0) {
      setIsPurchasing(false);
    }
  }, [purchaseErrorCount]);

  // Auto-dismiss and clear loading when Pro is activated
  useEffect(() => {
    if (isPro && !prevIsPro.current) {
      setIsPurchasing(false);
      setIsRestoring(false);
      router.back();
    }
    prevIsPro.current = isPro;
  }, [isPro, router]);

  const handlePurchase = () => {
    setIsPurchasing(true);
    purchasePro().catch(() => {
      if (isMounted.current) setIsPurchasing(false);
    });
  };

  const handleRestore = () => {
    setIsRestoring(true);
    restorePurchases()
      .then(() => {
        setTimeout(() => {
          if (!isMounted.current) return;
          setIsRestoring(false);
          if (!prevIsPro.current) {
            Alert.alert(
              "Покупки не знайдено",
              "Не знайдено попередніх покупок Pro",
            );
          }
        }, 500);
      })
      .catch(() => {
        if (isMounted.current) setIsRestoring(false);
      });
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
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor }}
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
            Ви вже маєте Pro!
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: t.textSecondary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Всі функції розблоковано
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 32,
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 12,
              backgroundColor: colors.violet[500],
            }}
            accessibilityRole="button"
            accessibilityLabel="Закрити"
          >
            <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>
              Закрити
            </Text>
          </Pressable>
        </View>
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
          paddingTop: 24,
          paddingBottom: insets.bottom + 32,
        }}
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

        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing || !product}
          style={{
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor:
              isPurchasing || !product
                ? colors.violet[600]
                : colors.violet[500],
            alignItems: "center",
            opacity: isPurchasing || !product ? 0.7 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={
            displayPrice ? `Купити Pro за ${displayPrice}` : "Завантаження ціни"
          }
        >
          {isPurchasing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 18 }}>
              {displayPrice
                ? `Купити Pro — ${displayPrice}`
                : "Завантаження..."}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleRestore}
          disabled={isRestoring}
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
  const router = useRouter();
  const { colors: t } = useTheme();

  return (
    <Stack.Screen
      options={{
        title: "Pro",
        headerLeft:
          Platform.OS === "ios"
            ? () => (
                <CloseButton
                  onPress={() => router.back()}
                  color={t.textSecondary}
                />
              )
            : undefined,
      }}
    />
  );
}
