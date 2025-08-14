import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";

const TokenBalances = () => {
  const { tokens, isLoading, isConnected, refetch } = useTokenBalanceContext();

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

  return (
    <div className="flex flex-row items-center gap-6 py-2">
      {tokens.map((token) => (
        <div
          key={`${token.symbol}-${token.address}`}
          className="flex flex-row items-center gap-2"
        >
          {getTokenIcon(token.symbol)}
          <span className="font-medium text-sm">{token.symbol}</span>
          {token.isLoading ? (
            <Skeleton className="h-5 w-10" />
          ) : (
            <span className="font-semibold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent text-sm">
              {formatBalance(token.formattedBalance)}
            </span>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => refetch()}
        disabled={isLoading}
        className="h-7 w-7 ml-2"
        title="Refresh"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
};

export default TokenBalances;
