import { Alert } from "react-native";
import { router } from "expo-router";

export function showUpgradePrompt(): void {
  Alert.alert(
    "Обмеження безкоштовної версії",
    "Безкоштовна версія дозволяє зберігати до 3 закладок. Оновіть до Pro для необмежених закладок, папок та нотаток.",
    [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Оновити до Pro",
        onPress: () => router.push("/pro" as never),
      },
    ],
  );
}
