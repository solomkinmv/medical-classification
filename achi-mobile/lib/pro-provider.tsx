import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIAP, ErrorCode, type Product, type Purchase } from "expo-iap";
import { PRO_PRODUCT_ID, PRO_STORAGE_KEY } from "./constants";

interface ProContextType {
  isPro: boolean;
  isProLoading: boolean;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  product: Product | null;
  purchaseErrorCount: number;
}

const ProContext = createContext<ProContextType | null>(null);

interface ProProviderProps {
  children: ReactNode;
}

export function ProProvider({ children }: ProProviderProps) {
  const [isPro, setIsPro] = useState(false);
  const [isProLoading, setIsProLoading] = useState(true);
  const [purchaseErrorCount, setPurchaseErrorCount] = useState(0);
  const purchaseCompletedAt = useRef<number>(0);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
    availablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      purchaseCompletedAt.current = Date.now();
      setIsPro(true);
      AsyncStorage.setItem(PRO_STORAGE_KEY, "true").catch(console.error);
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch (error) {
        console.error("Failed to finish transaction:", error);
      }
    },
    onPurchaseError: (error) => {
      setPurchaseErrorCount((c) => c + 1);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert("Помилка покупки", error.message ?? "Невідома помилка");
      }
    },
  });

  const product = products.find((p) => p.id === PRO_PRODUCT_ID) ?? null;

  // Load cached Pro status on mount
  useEffect(() => {
    AsyncStorage.getItem(PRO_STORAGE_KEY)
      .then((value) => {
        if (value === "true") {
          setIsPro(true);
        }
      })
      .catch(console.error)
      .finally(() => setIsProLoading(false));
  }, []);

  // Fetch products when connected to store
  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: [PRO_PRODUCT_ID], type: "in-app" }).catch(
        console.error,
      );
    }
  }, [connected, fetchProducts]);

  // Verify purchase status when connected
  const [hasFetchedPurchases, setHasFetchedPurchases] = useState(false);

  useEffect(() => {
    if (connected) {
      getAvailablePurchases()
        .then(() => setHasFetchedPurchases(true))
        .catch(console.error);
    }
  }, [connected, getAvailablePurchases]);

  useEffect(() => {
    if (!hasFetchedPurchases) return;

    const owned = availablePurchases.some(
      (p) => p.productId === PRO_PRODUCT_ID,
    );
    if (owned && !isPro) {
      setIsPro(true);
      AsyncStorage.setItem(PRO_STORAGE_KEY, "true").catch(console.error);
    } else if (!owned && isPro && !isProLoading) {
      const secondsSincePurchase =
        (Date.now() - purchaseCompletedAt.current) / 1000;
      if (secondsSincePurchase < 10) {
        return;
      }
      setIsPro(false);
      AsyncStorage.removeItem(PRO_STORAGE_KEY).catch(console.error);
    }
  }, [availablePurchases, isPro, isProLoading, hasFetchedPurchases]);

  const purchasePro = useCallback(async () => {
    if (!connected) {
      Alert.alert("Помилка", "Не вдалося з'єднатися з магазином");
      return;
    }
    await requestPurchase({
      request: {
        apple: { sku: PRO_PRODUCT_ID },
        google: { skus: [PRO_PRODUCT_ID] },
      },
      type: "in-app",
    });
  }, [connected, requestPurchase]);

  const restorePurchasesCallback = useCallback(async () => {
    try {
      await getAvailablePurchases();
      setHasFetchedPurchases(true);
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося відновити покупки");
      throw error;
    }
  }, [getAvailablePurchases]);

  const value = useMemo<ProContextType>(
    () => ({
      isPro,
      isProLoading,
      purchasePro,
      restorePurchases: restorePurchasesCallback,
      product,
      purchaseErrorCount,
    }),
    [
      isPro,
      isProLoading,
      purchasePro,
      restorePurchasesCallback,
      product,
      purchaseErrorCount,
    ],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function useProStatus(): ProContextType {
  const context = useContext(ProContext);
  if (!context) {
    throw new Error("useProStatus must be used within ProProvider");
  }
  return context;
}
