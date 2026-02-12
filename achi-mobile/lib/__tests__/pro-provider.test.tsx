import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import type { ReactNode } from "react";
import { PRO_PRODUCT_ID, PRO_STORAGE_KEY } from "../constants";
import { ErrorCode } from "expo-iap";

// Mock types for expo-iap
type MockUseIAPOptions = {
  onPurchaseSuccess?: (purchase: MockPurchase) => void;
  onPurchaseError?: (error: { code: string; message: string }) => void;
};

type MockPurchase = {
  id: string;
  productId: string;
  platform: string;
  purchaseState: string;
  isAutoRenewing: boolean;
  quantity: number;
  store: string;
  transactionDate: number;
};

let capturedOptions: MockUseIAPOptions = {};

const mockFetchProducts = jest.fn().mockResolvedValue(undefined);
const mockRequestPurchase = jest.fn().mockResolvedValue(null);
const mockFinishTransaction = jest.fn().mockResolvedValue(undefined);
const mockGetAvailablePurchases = jest.fn().mockResolvedValue(undefined);

let mockConnected = false;
let mockProducts: Array<{ id: string; displayPrice: string }> = [];
let mockAvailablePurchases: MockPurchase[] = [];

jest.mock("expo-iap", () => ({
  useIAP: (options: MockUseIAPOptions) => {
    capturedOptions = options;
    return {
      connected: mockConnected,
      products: mockProducts,
      fetchProducts: mockFetchProducts,
      requestPurchase: mockRequestPurchase,
      finishTransaction: mockFinishTransaction,
      getAvailablePurchases: mockGetAvailablePurchases,
      availablePurchases: mockAvailablePurchases,
    };
  },
  ErrorCode: {
    UserCancelled: "user-cancelled",
    NetworkError: "network-error",
    BillingUnavailable: "billing-unavailable",
    ItemUnavailable: "item-unavailable",
    AlreadyOwned: "already-owned",
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.spyOn(Alert, "alert");

// Import AFTER mocks are set up
import { ProProvider, useProStatus } from "../pro-provider";

function wrapper({ children }: { children: ReactNode }) {
  return <ProProvider>{children}</ProProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockConnected = false;
  mockProducts = [];
  mockAvailablePurchases = [];
  capturedOptions = {};
});

describe("ProProvider", () => {
  it("provides default values (not Pro, loading)", async () => {
    const { result } = renderHook(() => useProStatus(), { wrapper });

    expect(result.current.isPro).toBe(false);
    expect(result.current.product).toBeNull();
    expect(result.current.purchasePro).toBeInstanceOf(Function);
    expect(result.current.restorePurchases).toBeInstanceOf(Function);
  });

  it("loads cached Pro status from AsyncStorage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("true");

    const { result } = renderHook(() => useProStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isPro).toBe(true);
    });
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(PRO_STORAGE_KEY);
  });

  it("stays non-Pro when AsyncStorage has no cached value", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useProStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isProLoading).toBe(false);
    });
    expect(result.current.isPro).toBe(false);
  });

  it("returns product when products are fetched", () => {
    mockProducts = [{ id: PRO_PRODUCT_ID, displayPrice: "$2.99" }];

    const { result } = renderHook(() => useProStatus(), { wrapper });

    expect(result.current.product).toEqual({
      id: PRO_PRODUCT_ID,
      displayPrice: "$2.99",
    });
  });

  it("calls requestPurchase when purchasePro is called", () => {
    mockConnected = true;
    const { result } = renderHook(() => useProStatus(), { wrapper });

    act(() => {
      result.current.purchasePro();
    });

    expect(mockRequestPurchase).toHaveBeenCalledWith({
      request: {
        apple: { sku: PRO_PRODUCT_ID },
        google: { skus: [PRO_PRODUCT_ID] },
      },
      type: "in-app",
    });
  });

  it("calls getAvailablePurchases when restorePurchases is called", () => {
    const { result } = renderHook(() => useProStatus(), { wrapper });

    act(() => {
      result.current.restorePurchases();
    });

    expect(mockGetAvailablePurchases).toHaveBeenCalled();
  });

  it("sets isPro on purchase success", async () => {
    const { result } = renderHook(() => useProStatus(), { wrapper });

    const mockPurchase: MockPurchase = {
      id: "test-id",
      productId: PRO_PRODUCT_ID,
      platform: "ios",
      purchaseState: "purchased",
      isAutoRenewing: false,
      quantity: 1,
      store: "apple",
      transactionDate: Date.now(),
    };

    await act(async () => {
      await capturedOptions.onPurchaseSuccess?.(mockPurchase);
    });

    expect(mockFinishTransaction).toHaveBeenCalledWith({
      purchase: mockPurchase,
      isConsumable: false,
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(PRO_STORAGE_KEY, "true");
    expect(result.current.isPro).toBe(true);
  });

  it("shows alert on purchase error (non-cancellation)", () => {
    renderHook(() => useProStatus(), { wrapper });

    act(() => {
      capturedOptions.onPurchaseError?.({
        code: ErrorCode.NetworkError,
        message: "Network error",
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Помилка покупки",
      "Network error",
    );
  });

  it("does not show alert when user cancels purchase", () => {
    renderHook(() => useProStatus(), { wrapper });

    act(() => {
      capturedOptions.onPurchaseError?.({
        code: ErrorCode.UserCancelled,
        message: "User cancelled",
      });
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("syncs Pro status from availablePurchases", async () => {
    mockConnected = true;
    mockAvailablePurchases = [
      {
        id: "test-id",
        productId: PRO_PRODUCT_ID,
        platform: "ios",
        purchaseState: "purchased",
        isAutoRenewing: false,
        quantity: 1,
        store: "apple",
        transactionDate: Date.now(),
      },
    ];

    const { result } = renderHook(() => useProStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isPro).toBe(true);
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(PRO_STORAGE_KEY, "true");
  });

  it("throws error when useProStatus is used outside ProProvider", () => {
    expect(() => {
      renderHook(() => useProStatus());
    }).toThrow("useProStatus must be used within ProProvider");
  });

  it("fetches products when connected to store", () => {
    mockConnected = true;
    renderHook(() => useProStatus(), { wrapper });

    expect(mockFetchProducts).toHaveBeenCalledWith({
      skus: [PRO_PRODUCT_ID],
      type: "in-app",
    });
  });

  it("calls getAvailablePurchases when connected to store", () => {
    mockConnected = true;
    renderHook(() => useProStatus(), { wrapper });

    expect(mockGetAvailablePurchases).toHaveBeenCalled();
  });

  it("shows fallback message when purchase error has no message", () => {
    renderHook(() => useProStatus(), { wrapper });

    act(() => {
      capturedOptions.onPurchaseError?.({
        code: ErrorCode.NetworkError,
        message: undefined as unknown as string,
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Помилка покупки",
      "Невідома помилка",
    );
  });

  it("sets isPro even when finishTransaction fails", async () => {
    mockFinishTransaction.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProStatus(), { wrapper });

    const mockPurchase: MockPurchase = {
      id: "test-id",
      productId: PRO_PRODUCT_ID,
      platform: "ios",
      purchaseState: "purchased",
      isAutoRenewing: false,
      quantity: 1,
      store: "apple",
      transactionDate: Date.now(),
    };

    await act(async () => {
      await capturedOptions.onPurchaseSuccess?.(mockPurchase);
    });

    expect(result.current.isPro).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      PRO_STORAGE_KEY,
      "true",
    );
  });
});
