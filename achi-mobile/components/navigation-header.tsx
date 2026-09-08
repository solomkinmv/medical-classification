import { Platform } from "react-native";
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
  action: HeaderAction,
): NativeStackNavigationOptions {
  if (Platform.OS === "ios") {
    const items = () => [
      {
        type: "button" as const,
        identifier: action.id,
        label: action.label,
        accessibilityLabel: action.label,
        icon: { type: "sfSymbol" as const, name: action.symbol },
        tintColor: action.color,
        onPress: action.onPress,
      },
    ];
    return side === "left"
      ? { unstable_headerLeftItems: items }
      : { unstable_headerRightItems: items };
  }

  const button = () => (
    <HeaderButton
      testID={action.id}
      accessibilityLabel={action.label}
      onPress={action.onPress}
    >
      <Ionicons name={action.fallbackIcon} size={24} color={action.color} />
    </HeaderButton>
  );
  return side === "left" ? { headerLeft: button } : { headerRight: button };
}
