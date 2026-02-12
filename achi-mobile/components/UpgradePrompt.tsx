import { Alert } from "react-native";
import { router } from "expo-router";
import { BOOKMARK_LIMIT_FREE } from "@/lib/constants";

export function showUpgradePrompt(): void {
  Alert.alert(
    "Обмеження безкоштовної версії",
    `Безкоштовна версія дозволяє зберігати до ${BOOKMARK_LIMIT_FREE} закладок для кожного класифікатора. Оновіть до Pro для необмежених закладок, папок та нотаток.`,
    [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Оновити до Pro",
        onPress: () => router.push("/pro" as never),
      },
    ],
  );
}
