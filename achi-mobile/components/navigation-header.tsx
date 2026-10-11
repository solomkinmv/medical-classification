import { Platform, View } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import type {
  NativeStackNavigationOptions,
  NativeStackHeaderItemButton,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { isLiquidGlassAvailable } from "expo-glass-effect";

export function nativeHeaderOptions(
  backgroundColor: string,
): NativeStackNavigationOptions {
  const ios = Platform.OS === "ios";
  const liquidGlass = ios && isLiquidGlassAvailable();
  return {
    headerTransparent: ios,
    headerStyle: { backgroundColor: ios ? "transparent" : backgroundColor },
    headerLargeStyle: {
      backgroundColor: ios ? "transparent" : backgroundColor,
    },
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    // iOS 26 supplies the scroll-edge material; do not stack legacy blur on it.
    headerBlurEffect: ios && !liquidGlass ? "systemChromeMaterial" : undefined,
    scrollEdgeEffects: liquidGlass ? { top: "soft" } : undefined,
  };
}

interface HeaderAction {
  id: string;
  label: string;
  symbol: Extract<
    NonNullable<NativeStackHeaderItemButton["icon"]>,
    { type: "sfSymbol" }
  >["name"];
  fallbackIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

// Keep the SDK 54 unstable API in one adapter until Stack.Toolbar is available.
export function headerActionOptions(
  side: "left" | "right",
  action: HeaderAction | HeaderAction[],
): NativeStackNavigationOptions {
  const actions = Array.isArray(action) ? action : [action];

  if (Platform.OS === "ios") {
    const items = () =>
      actions.map((item) => ({
        type: "button" as const,
        identifier: item.id,
        label: item.label,
        accessibilityLabel: item.label,
        icon: { type: "sfSymbol" as const, name: item.symbol },
        tintColor: item.color,
        onPress: item.onPress,
      }));
    return side === "left"
      ? { unstable_headerLeftItems: items }
      : { unstable_headerRightItems: items };
  }

  const buttons = () => (
    <View style={{ flexDirection: "row" }}>
      {actions.map((item) => (
        <HeaderButton
          key={item.id}
          testID={item.id}
          accessibilityLabel={item.label}
          onPress={item.onPress}
        >
          <Ionicons name={item.fallbackIcon} size={24} color={item.color} />
        </HeaderButton>
      ))}
    </View>
  );
  return side === "left" ? { headerLeft: buttons } : { headerRight: buttons };
}
