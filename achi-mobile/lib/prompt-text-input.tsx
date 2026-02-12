import { Alert, Platform } from "react-native";

export function promptTextInput(options: {
  title: string;
  message?: string;
  defaultValue?: string;
  submitText?: string;
  onSubmit: (text: string) => void;
}): void {
  const { title, message, defaultValue, submitText = "OK", onSubmit } = options;

  if (Platform.OS === "ios") {
    Alert.prompt(
      title,
      message,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: submitText,
          onPress: (value: string | undefined) => {
            if (value?.trim()) {
              onSubmit(value.trim());
            }
          },
        },
      ],
      "plain-text",
      defaultValue,
    );
    return;
  }

  Alert.alert(title, "Ця функція наразі доступна лише на iOS");
}
