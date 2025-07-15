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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Coins,
  TrendingUp,
  ArrowRight,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { useVault } from "@/contexts/VaultContext";

interface DepositModalProps {
  children: React.ReactNode;
  initialTab?: "stake" | "redeem";
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const DepositModal = ({
  children,
  initialTab = "stake",
  isOpen: controlledOpen,
  setIsOpen: setControlledOpen,
}: DepositModalProps) => {
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen =
    controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsOpen =
    setControlledOpen !== undefined ? setControlledOpen : setUncontrolledOpen;
  const [tab, setTab] = useState<"stake" | "redeem">(initialTab);
  // Reset tab when modal opens
  React.useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);
  const { toast } = useToast();
  const { userBalances, setUserBalances } = useVault();

  const tokens = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: userBalances.wbtc.toFixed(6),
      apy: "8.2%",
      icon: "₿",
      stakedSymbol: "wBTC",
      stakedName: "Wrapped Bitcoin",
    },
    {
      symbol: "CORE",
      name: "CORE",
      balance: userBalances.stcore.toLocaleString(),
      apy: "12.5%",
      icon: "⚡",
      stakedSymbol: "stCORE",
      stakedName: "Staked CORE",
    },
  ];

  const selectedTokenData = tokens.find(
    (token) => token.symbol === selectedToken
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md  bg-vault-card border-vault-border">
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center my-4">
            {/* Tab Toggle */}
            <div className="flex w-full justify-center mb-6">
              <button
                className={`px-8 py-3 rounded-l-full font-semibold text-lg transition-colors duration-300 ${
                  tab === "stake"
                    ? "bg-white text-primary shadow"
                    : "bg-vault-card text-muted-foreground"
                }`}
                style={{ border: "2px solid #f7f3f5", borderRight: "none" }}
                onClick={() => setTab("stake")}
                type="button"
              >
                DEPOSIT
              </button>
              <button
                className={`px-8 py-3 rounded-r-full font-semibold text-lg transition-colors duration-300 ${
                  tab === "redeem"
                    ? "bg-white text-primary shadow"
                    : "bg-vault-card text-muted-foreground"
                }`}
                style={{ border: "2px solid #f7f3f5", borderLeft: "none" }}
                onClick={() => setTab("redeem")}
                type="button"
              >
                WITHDRAW
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token">
              {tab === "stake" ? "Deposit Token" : "Withdraw Token"}
            </Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="bg-muted border-vault-border">
                <SelectValue
                  placeholder={
                    tab === "stake"
                      ? "Choose a token to deposit"
                      : "Choose a token to withdraw"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-vault-card border-vault-border">
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <div className="flex items-center space-x-3 w-full">
                      <span className="text-lg">{token.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {tab === "stake" && (
                              <span className="text-xs ">{token.symbol}</span>
                            )}
                            {tab === "redeem" && (
                              <span className="text-xs ">
                                {token.stakedSymbol}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount:</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-muted border-vault-border pr-16"
                step="0.00001"
              />
              {selectedTokenData && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {tab === "stake"
                    ? selectedTokenData.symbol
                    : selectedTokenData.stakedSymbol}
                </div>
              )}
            </div>
            {selectedTokenData && (
              <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-2 mt-2">
                <span>
                  Available: {selectedTokenData.balance}{" "}
                  {tab === "stake"
                    ? selectedTokenData.symbol
                    : selectedTokenData.stakedSymbol}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      setAmount(
                        (parseFloat(selectedTokenData.balance) / 2).toString()
                      )
                    }
                  >
                    Half
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setAmount(selectedTokenData.balance)}
                  >
                    Max
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* You will get section */}
          {selectedTokenData && amount && (
            <Card className="p-4 bg-gradient-vault border-vault-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ArrowDown className="w-4 h-4 text-gold" />
                  <span className="text-sm">You will get:</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gold">
                    {tab === "stake" ? (
                      <>
                        {amount} {selectedTokenData.stakedSymbol}
                        <div className="text-xs text-muted-foreground">
                          {selectedTokenData.stakedName}
                        </div>
                      </>
                    ) : (
                      <>
                        {amount} {selectedTokenData.symbol}
                        <div className="text-xs text-muted-foreground">
                          {selectedTokenData.name}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
          {/* Action Button */}
          <Button
            className="w-full mt-4"
            onClick={() => {
              if (!selectedToken || !amount) {
                toast({
                  title: "Error",
                  description: "Please select a token and enter an amount",
                  variant: "destructive",
                });
                return;
              }

              const selectedTokenData = tokens.find(
                (token) => token.symbol === selectedToken
              );
              const amountNum = parseFloat(amount);

              if (tab === "stake") {
                // Check if user has enough balance
                const availableBalance =
                  selectedToken === "BTC"
                    ? userBalances.wbtc
                    : userBalances.stcore;
                if (amountNum > availableBalance) {
                  toast({
                    title: "Insufficient Balance",
                    description: `You don't have enough ${selectedToken} to deposit`,
                    variant: "destructive",
                  });
                  return;
                }

                // Deduct from user balance for deposit
                setUserBalances((prev) => ({
                  ...prev,
                  [selectedToken === "BTC" ? "wbtc" : "stcore"]:
                    prev[selectedToken === "BTC" ? "wbtc" : "stcore"] -
                    amountNum,
                }));

                toast({
                  title: "Deposit Initiated",
                  description: `Depositing ${amount} ${selectedToken} to receive ${selectedTokenData?.stakedSymbol}`,
                });
              } else {
                // For withdraw, add to user balance
                setUserBalances((prev) => ({
                  ...prev,
                  [selectedToken === "BTC" ? "wbtc" : "stcore"]:
                    prev[selectedToken === "BTC" ? "wbtc" : "stcore"] +
                    amountNum,
                }));

                toast({
                  title: "Redeem Initiated",
                  description: `Redeeming ${amount} ${selectedTokenData?.stakedSymbol} to receive ${selectedToken}`,
                });
              }
              setIsOpen(false);
              setAmount("");
              setSelectedToken("");
            }}
          >
            {tab === "stake" ? "Deposit" : "Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
