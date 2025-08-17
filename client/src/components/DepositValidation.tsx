import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { useVault } from "@/contexts/VaultContextWithAPI";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";

interface DepositValidationProps {
  wbtcAmount: number;
  stcoreAmount: number;
  className?: string;
}

const DepositValidation: React.FC<DepositValidationProps> = ({
  wbtcAmount,
  stcoreAmount,
  className = "",
}) => {
  const { canDeposit } = useVault();
  const { getFormattedBalance, isConnected } = useTokenBalanceContext();

  if (!isConnected) {
    return (
      <Alert className={className}>
        <Wallet className="h-4 w-4" />
        <AlertDescription>
          Connect your wallet to validate deposit amounts
        </AlertDescription>
      </Alert>
    );
  }

  // For BTC, always use 0 since users don't have regular BTC
  const wbtcBalance =
    wbtcAmount > 0 ? 0 : parseFloat(getFormattedBalance("wBTC"));
  const stcoreBalance = parseFloat(getFormattedBalance("stCORE"));
  const canMakeDeposit = canDeposit(wbtcAmount, stcoreAmount);

  const wbtcSufficient = wbtcBalance >= wbtcAmount;
  const stcoreSufficient = stcoreBalance >= stcoreAmount;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Balance Check */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <span className="text-sm">
            {wbtcAmount > 0 ? "BTC Balance:" : "wBTC Balance:"}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {wbtcAmount > 0 ? "0.000000" : getFormattedBalance("wBTC")}
            </span>
            {wbtcSufficient ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <span className="text-sm">stCORE Balance:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {getFormattedBalance("stCORE")}
            </span>
            {stcoreSufficient ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <Alert
        className={
          canMakeDeposit ? "border-green-500/50" : "border-orange-500/50"
        }
      >
        {canMakeDeposit ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        )}
        <AlertDescription className="flex items-center justify-between">
          <span>
            {canMakeDeposit
              ? "✅ Sufficient balance for deposit"
              : "⚠️ Insufficient balance for deposit"}
          </span>
          <Badge
            variant={canMakeDeposit ? "default" : "destructive"}
            className="text-xs"
          >
            {canMakeDeposit ? "Ready" : "Insufficient"}
          </Badge>
        </AlertDescription>
      </Alert>

      {/* Required vs Available */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>
            {wbtcAmount > 0 ? "BTC" : "wBTC"} Required: {wbtcAmount.toFixed(6)}
          </span>
          <span>Available: {wbtcBalance.toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span>stCORE Required: {stcoreAmount.toFixed(4)}</span>
          <span>Available: {stcoreBalance.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

export default DepositValidation;
