import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowDown, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVault } from "@/contexts/VaultContext";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface VaultDepositModalProps {
  children: React.ReactNode;
  vaultName: string;
  apy: string;
  strategy: string;
}

const VaultDepositModal = ({
  children,
  vaultName,
  apy,
  strategy,
}: VaultDepositModalProps) => {
  const [wbtcAmount, setWbtcAmount] = useState<string>("");
  const [stcoreAmount, setStcoreAmount] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { addPosition } = useVault();
  const { getFormattedBalance } = useTokenBalanceContext();
  const { requireWalletConnection } = useWalletConnection();

  // Calculate expected lstBTC based on inputs
  const calculateLstBtc = () => {
    const wbtc = parseFloat(wbtcAmount) || 0;
    const stcore = parseFloat(stcoreAmount) || 0;
    // Simplified calculation: wBTC is worth more, stCORE contributes less
    return (wbtc * 0.95 + stcore * 0.0001).toFixed(6);
  };

  // Calculate total USD value (rough estimation)
  const calculateTotalValue = () => {
    const wbtc = parseFloat(wbtcAmount) || 0;
    const stcore = parseFloat(stcoreAmount) || 0;
    // Rough USD values: wBTC ~$43,000, stCORE ~$1
    return wbtc * 43000 + stcore * 1;
  };

  const handleDeposit = () => {
    // Check wallet connection first
    if (!requireWalletConnection("deposit to this vault")) {
      return;
    }

    if (!wbtcAmount || !stcoreAmount) {
      toast({
        title: "Error",
        description: "Please enter both wBTC and stCORE amounts",
        variant: "destructive",
      });
      return;
    }

    const wbtcNum = parseFloat(wbtcAmount);
    const stcoreNum = parseFloat(stcoreAmount);

    if (wbtcNum <= 0 || stcoreNum <= 0) {
      toast({
        title: "Error",
        description: "Both amounts must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    // Check if user has sufficient balance
    const wbtcBalance = parseFloat(getFormattedBalance("wBTC"));
    const stcoreBalance = parseFloat(getFormattedBalance("stCORE"));

    if (wbtcNum > wbtcBalance) {
      toast({
        title: "Insufficient wBTC Balance",
        description: `You need ${wbtcNum.toFixed(
          6
        )} wBTC but only have ${wbtcBalance.toFixed(6)} wBTC available`,
        variant: "destructive",
      });
      return;
    }

    if (stcoreNum > stcoreBalance) {
      toast({
        title: "Insufficient stCORE Balance",
        description: `You need ${stcoreNum.toLocaleString()} stCORE but only have ${stcoreBalance.toFixed(
          4
        )} stCORE available`,
        variant: "destructive",
      });
      return;
    }

    // Note: In real implementation, this would trigger blockchain transactions
    // to transfer wBTC and stCORE to the vault contract

    // Add position to user's portfolio
    addPosition({
      vaultName,
      wbtcDeposited: wbtcNum,
      stcoreDeposited: stcoreNum,
      lstbtcGenerated: parseFloat(calculateLstBtc()),
      currentValue: calculateTotalValue(),
      apy: apy,
    });

    toast({
      title: "Deposit Successful!",
      description: `Deposited ${wbtcAmount} wBTC and ${stcoreAmount} stCORE to ${vaultName}`,
    });

    setIsOpen(false);
    setWbtcAmount("");
    setStcoreAmount("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-vault-card border-vault-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Deposit to {vaultName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Strategy Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{strategy}</p>
            <p className="text-sm font-medium text-gold mt-1">{apy} APY</p>
          </div>

          {/* Asset Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wbtc">wBTC Amount *</Label>
              <div className="relative">
                <Input
                  id="wbtc"
                  type="text"
                  placeholder="0.1"
                  value={wbtcAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "" ||
                      (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)
                    ) {
                      setWbtcAmount(value);
                    }
                  }}
                  className="bg-muted border-vault-border pr-16"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground flex items-center space-x-1">
                  <BitcoinIcon size="sm" />
                  <span>wBTC</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Available: {getFormattedBalance("wBTC")} wBTC
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stcore">stCORE Amount *</Label>
              <div className="relative">
                <Input
                  id="stcore"
                  type="text"
                  placeholder="1000"
                  value={stcoreAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "" ||
                      (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)
                    ) {
                      setStcoreAmount(value);
                    }
                  }}
                  className="bg-muted border-vault-border pr-16"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground flex items-center space-x-1">
                  <CoreIcon size="sm" />
                  <span>stCORE</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Available: {getFormattedBalance("stCORE")} stCORE
              </div>
            </div>
          </div>

          {/* Conversion Preview */}
          {wbtcAmount && stcoreAmount && (
            <Card className="p-4 bg-gradient-primary/10 border-primary/20">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">wBTC</p>
                    <p className="font-bold">{wbtcAmount}</p>
                  </div>
                  <span className="text-muted-foreground">+</span>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">stCORE</p>
                    <p className="font-bold">{stcoreAmount}</p>
                  </div>
                </div>
                <ArrowDown className="w-6 h-6 text-primary mx-auto" />
                <div className="space-y-1">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Will Generate
                    </p>
                    <p className="text-xl font-bold text-gold">
                      {calculateLstBtc()} lstBTC
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      ≈ ${calculateTotalValue().toLocaleString()} USD
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            disabled={!wbtcAmount || !stcoreAmount}
            className="w-full"
            variant="default"
          >
            <span>Deposit Assets</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VaultDepositModal;
