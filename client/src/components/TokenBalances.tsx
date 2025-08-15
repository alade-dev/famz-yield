/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import { useUSDPrices } from "@/hooks/useUSDPrices";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";

const TokenBalances = () => {
  const { tokens, isLoading, isConnected, refetch } = useTokenBalanceContext();
  const { prices: usdPrices, isLoading: pricesLoading } = useUSDPrices();

  // Keep stable data during refresh
  const [stableTokens, setStableTokens] = useState(tokens);
  const [stablePrices, setStablePrices] = useState(usdPrices);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update stable data when new data arrives and not loading
  useEffect(() => {
    if (!isLoading && tokens.length > 0) {
      setStableTokens(tokens);
    }
  }, [tokens, isLoading]);

  useEffect(() => {
    if (!pricesLoading && (usdPrices.wbtc > 0 || usdPrices.stcore > 0)) {
      setStablePrices(usdPrices);
    }
  }, [usdPrices, pricesLoading]);

  // Handle refresh with visual feedback
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Stop refresh indicator after a short delay
    refreshTimeoutRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="text-muted-foreground text-sm py-2">
        Connect your wallet to view token balances
      </div>
    );
  }

  const formatBalance = (balance: string, decimals: number = 4) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(decimals);
  };

  const formatUSD = (amount: number) => {
    if (amount === 0) return "$0.00";
    if (amount < 0.01) return "< $0.01";
    return `$${amount.toFixed(2)}`;
  };

  const getTokenUSDPrice = (symbol: string): number => {
    switch (symbol.toLowerCase()) {
      case "wbtc":
        return stablePrices.wbtc;
      case "stcore":
        return stablePrices.stcore;
      case "tcore":
        return stablePrices.tcore;
      case "lstbtc":
        return stablePrices.lstbtc;
      default:
        return 0;
    }
  };

  const calculateTokenUSDValue = (token: any): number => {
    const balance = parseFloat(token.formattedBalance);
    const price = getTokenUSDPrice(token.symbol);
    return balance * price;
  };

  const calculateTotalPortfolioValue = (): number => {
    return stableTokens.reduce((total, token) => {
      return total + calculateTokenUSDValue(token);
    }, 0);
  };

  const getTokenIcon = (symbol: string) => {
    switch (symbol.toLowerCase()) {
      case "wbtc":
      case "lstbtc":
        return <BitcoinIcon size="sm" />;
      case "stcore":
      case "tcore":
        return <CoreIcon size="sm" />;
      default:
        return <div className="w-4 h-4 bg-muted rounded-full" />;
    }
  };

  const totalPortfolioValue = calculateTotalPortfolioValue();

  return (
    <div className="flex flex-col gap-3">
      {/* Total Portfolio Value */}
      {/* <div className="flex items-center gap-2 py-2">
        <DollarSign className="w-5 h-5 text-green-500" />
        <span className="font-medium text-sm">Total Portfolio:</span>
        {pricesLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <span className="font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            {formatUSD(totalPortfolioValue)}
          </span>
        )}
      </div> */}

      {/* Token Balances */}
      <div className="flex flex-row items-center border border-vault-border bg-vault-card/50 backdrop-blur-xl shadow-md justify-between rounded-lg p-2 gap-6 py-2">
        {stableTokens.map((token) => {
          const usdValue = calculateTokenUSDValue(token);
          // Show skeleton only on initial load, not on refresh
          const showSkeleton =
            token.isLoading &&
            !stableTokens.find((t) => t.symbol === token.symbol)
              ?.formattedBalance;

          return (
            <div
              key={`${token.symbol}-${token.address}`}
              className="flex flex-col items-center gap-1 relative"
            >
              <div className="flex flex-row  items-center gap-2">
                {getTokenIcon(token.symbol)}
                <span className="font-medium text-sm">{token.symbol}</span>
                {showSkeleton ? (
                  <Skeleton className="h-5 w-10" />
                ) : (
                  <div className="relative">
                    <span
                      className={`font-semibold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent text-sm transition-opacity duration-300 ${
                        isRefreshing ? "opacity-70" : "opacity-100"
                      }`}
                    >
                      {formatBalance(token.formattedBalance)}
                    </span>
                    {/* Subtle refresh indicator */}
                    {isRefreshing && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* USD Value */}
              {!showSkeleton && stablePrices.wbtc > 0 && (
                <span
                  className={`text-xs text-muted-foreground transition-opacity duration-300 ${
                    isRefreshing ? "opacity-70" : "opacity-100"
                  }`}
                >
                  {formatUSD(usdValue)}
                </span>
              )}
            </div>
          );
        })}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-7 w-7 ml-2 transition-all duration-200"
          title="Refresh balances"
        >
          <RefreshCw
            className={`w-4 h-4 transition-transform duration-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </Button>
      </div>
    </div>
  );
};

export default TokenBalances;
