import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Pressable } from "react-native";

// Exercise native action callbacks in JS tests; UIKit hit testing needs a device.
export function renderStackHeader(options: NativeStackNavigationOptions) {
  const props = { tintColor: "#111111", canGoBack: true };
  const items = [
    ...(options.unstable_headerLeftItems?.(props) ?? []),
    ...(options.unstable_headerRightItems?.(props) ?? []),
  ];
  return (
    <>
      {options.headerLeft?.(props)}
      {options.headerRight?.(props)}
      {items.map((item) =>
        item.type === "button" ? (
          <Pressable
            key={item.identifier}
            testID={item.identifier}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            onPress={item.onPress}
          />
        ) : null,
      )}
    </>
  );
}
