import { useState, useEffect, useCallback } from "react";
import { getComprehensivePrices } from "@/scripts/vaultHelpers";
import { btcPriceCache } from "@/scripts/priceApi";

interface USDPrices {
  wbtc: number;
  stcore: number;
  tcore: number;
  lstbtc: number;
}

interface UseUSDPricesReturn {
  prices: USDPrices;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  refetch: () => Promise<void>;
}

export const useUSDPrices = (): UseUSDPricesReturn => {
  const [prices, setPrices] = useState<USDPrices>({
    wbtc: 0,
    stcore: 0,
    tcore: 0,
    lstbtc: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const comprehensivePrices = await getComprehensivePrices();

      setPrices({
        wbtc: comprehensivePrices.calculatedPrices.wbtcUsd,
        stcore: comprehensivePrices.calculatedPrices.stcoreUsd,
        tcore: comprehensivePrices.calculatedPrices.coreUsd,
        lstbtc: comprehensivePrices.calculatedPrices.wbtcUsd, // lstBTC is pegged to BTC
      });

      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Error fetching USD prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to BTC price updates for automatic refresh
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupPriceSubscription = async () => {
      // Initial fetch
      await fetchPrices();

      // Subscribe to BTC price updates
      unsubscribe = btcPriceCache.subscribe(async () => {
        // When BTC price updates, refetch all comprehensive prices
        await fetchPrices();
      });
    };

    setupPriceSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchPrices,
  };
};
