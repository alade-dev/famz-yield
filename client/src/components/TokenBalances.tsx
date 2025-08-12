import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";

const TokenBalances = () => {
  const { tokens, isLoading, isConnected, refetch } = useTokenBalanceContext();

  if (!isConnected) {
    return (
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <span>Token Balances</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Connect your wallet to view token balances
            </p>
          </div>
        </CardContent>
      </Card>
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

  const getTokenColor = (symbol: string) => {
    switch (symbol.toLowerCase()) {
      case "wbtc":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "stcore":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "lstbtc":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "tcore":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-muted">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span>Your Token Balances</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {tokens.map((token) => (
            <div
              key={`${token.symbol}-${token.address}`}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <div className="flex items-center space-x-3">
                {getTokenIcon(token.symbol)}
                <div>
                  <div className="font-medium text-sm">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {token.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {token.isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <div>
                    <div className="font-semibold text-sm">
                      {formatBalance(token.formattedBalance)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getTokenColor(token.symbol)}`}
                    >
                      {token.symbol}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {tokens.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">
              No token data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenBalances;
