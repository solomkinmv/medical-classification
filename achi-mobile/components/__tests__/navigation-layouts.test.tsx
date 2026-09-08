import type { ReactNode } from "react";
import { render } from "@testing-library/react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import ExploreLayout from "@/app/(tabs)/explore/_layout";
import PinnedLayout from "@/app/(tabs)/pinned/_layout";
import AboutLayout from "@/app/(tabs)/about/_layout";
import SearchLayout from "@/app/(tabs)/search/_layout";

const mockStack = jest.fn();
const mockScreen = jest.fn();
jest.mock("expo-router", () => {
  const Stack = ({
    screenOptions,
    children,
  }: {
    screenOptions: NativeStackNavigationOptions;
    children: ReactNode;
  }) => {
    mockStack(screenOptions);
    return children;
  };
  Stack.Screen = function MockScreen({
    options,
  }: {
    options: NativeStackNavigationOptions;
  }) {
    mockScreen(options);
    return null;
  };
  return { Stack };
});
jest.mock("expo-glass-effect", () => ({ isLiquidGlassAvailable: () => true }));
jest.mock("@/lib/classifier-provider", () => ({
  useClassifier: () => ({ activeClassifier: "mkh10" }),
}));

beforeEach(() => jest.clearAllMocks());

test.each([ExploreLayout, PinnedLayout, AboutLayout, SearchLayout])(
  "%p inherits native glass without opaque per-screen overrides",
  (Layout) => {
    render(<Layout />);
    expect(mockStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        headerBlurEffect: undefined,
        scrollEdgeEffects: { top: "soft" },
      }),
    );
    expect(mockScreen.mock.calls.length).toBeGreaterThan(0);
    for (const [options] of mockScreen.mock.calls) {
      expect(options.headerStyle?.backgroundColor).toBeUndefined();
      expect(options.headerTransparent).not.toBe(false);
    }
    expect(mockScreen.mock.calls[0][0].headerLargeTitle).toBe(true);
  },
);
