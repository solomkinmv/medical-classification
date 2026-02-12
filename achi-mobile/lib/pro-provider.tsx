import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIAP, ErrorCode, type Product, type Purchase } from "expo-iap";
import { PRO_PRODUCT_ID, PRO_STORAGE_KEY } from "./constants";

interface ProContextType {
  isPro: boolean;
  isProLoading: boolean;
  purchasePro: () => void;
  restorePurchases: () => void;
  product: Product | null;
}

const ProContext = createContext<ProContextType | null>(null);

interface ProProviderProps {
  children: ReactNode;
}

export function ProProvider({ children }: ProProviderProps) {
  const [isPro, setIsPro] = useState(false);
  const [isProLoading, setIsProLoading] = useState(true);

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
      await finishTransaction({ purchase, isConsumable: false });
      setIsPro(true);
      AsyncStorage.setItem(PRO_STORAGE_KEY, "true").catch(console.error);
    },
    onPurchaseError: (error) => {
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
  useEffect(() => {
    if (connected) {
      getAvailablePurchases().catch(console.error);
    }
  }, [connected, getAvailablePurchases]);

  // Sync Pro status from available purchases
  useEffect(() => {
    const owned = availablePurchases.some(
      (p) => p.productId === PRO_PRODUCT_ID,
    );
    if (owned && !isPro) {
      setIsPro(true);
      AsyncStorage.setItem(PRO_STORAGE_KEY, "true").catch(console.error);
    }
  }, [availablePurchases, isPro]);

  const purchasePro = useCallback(() => {
    requestPurchase({
      request: {
        apple: { sku: PRO_PRODUCT_ID },
        google: { skus: [PRO_PRODUCT_ID] },
      },
      type: "in-app",
    }).catch(console.error);
  }, [requestPurchase]);

  const restorePurchasesCallback = useCallback(() => {
    getAvailablePurchases().catch(console.error);
  }, [getAvailablePurchases]);

  const value = useMemo(
    () => ({
      isPro,
      isProLoading,
      purchasePro,
      restorePurchases: restorePurchasesCallback,
      product,
    }),
    [isPro, isProLoading, purchasePro, restorePurchasesCallback, product],
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
