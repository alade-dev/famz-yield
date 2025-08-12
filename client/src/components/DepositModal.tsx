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
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import DepositValidation from "@/components/DepositValidation";

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
  const { canDeposit, getAvailableBalance } = useVault();
  const { getFormattedBalance, isConnected: tokenContextConnected } =
    useTokenBalanceContext();
  const { requireWalletConnection } = useWalletConnection();

  const allTokens = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.000000", // Always show zero since users don't have regular BTC
      apy: "8.2%",
      icon: <BitcoinIcon size="sm" />,
      stakedSymbol: "wBTC",
      stakedName: "Wrapped Bitcoin",
      showOnTab: "stake", // Only show on stake/deposit tab
    },
    {
      symbol: "wBTC",
      name: "Wrapped Bitcoin",
      balance: parseFloat(getFormattedBalance("wBTC")).toFixed(6), // Show actual wBTC balance
      apy: "8.2%",
      icon: <BitcoinIcon size="sm" />,
      stakedSymbol: "wBTC",
      stakedName: "Wrapped Bitcoin",
      showOnTab: "redeem", // Only show on redeem/withdraw tab
    },
    {
      symbol: "CORE",
      name: "Test CORE",
      balance:
        tab === "stake"
          ? parseFloat(getFormattedBalance("tCORE")).toFixed(4) // Format tCORE to 4dp
          : parseFloat(getFormattedBalance("stCORE")).toFixed(4), // Format stCORE to 4dp
      apy: "12.5%",
      icon: <CoreIcon size="sm" />,
      stakedSymbol: "stCORE",
      stakedName: "Staked CORE",
      showOnTab: "both", // Show on both tabs
    },
  ];

  // Filter tokens based on current tab
  const tokens = allTokens.filter(
    (token) => token.showOnTab === "both" || token.showOnTab === tab
  );

  // Clear selected token when switching tabs (since BTC/wBTC are tab-specific)
  React.useEffect(() => {
    if (selectedToken === "BTC" && tab === "redeem") {
      // BTC is only available on stake tab
      setSelectedToken("");
      setAmount("");
    } else if (selectedToken === "wBTC" && tab === "stake") {
      // wBTC is only available on redeem tab
      setSelectedToken("");
      setAmount("");
    }
  }, [tab, selectedToken]);

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
                      {token.icon}
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
                type="float"
                min={0}
                max={selectedTokenData?.balance}
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
                    onClick={() => {
                      // Get raw balance value from real token balances
                      let balanceString = "";
                      if (selectedToken === "BTC") {
                        balanceString = "0"; // BTC is always 0
                      } else if (selectedToken === "wBTC") {
                        balanceString = getFormattedBalance("wBTC");
                      } else if (selectedToken === "CORE") {
                        balanceString =
                          tab === "stake"
                            ? getFormattedBalance("tCORE")
                            : getFormattedBalance("stCORE");
                      }

                      const rawBalance = parseFloat(balanceString);
                      setAmount(
                        selectedToken === "BTC"
                          ? "0.000000"
                          : selectedToken === "wBTC"
                          ? (rawBalance / 2).toFixed(6) // Format wBTC to 6dp
                          : (rawBalance / 2).toFixed(4) // Format CORE to 4dp
                      );
                    }}
                  >
                    Half
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      // Get raw balance value for max from real token balances
                      let balanceString = "";
                      if (selectedToken === "BTC") {
                        balanceString = "0"; // BTC is always 0
                      } else if (selectedToken === "wBTC") {
                        balanceString = getFormattedBalance("wBTC");
                      } else if (selectedToken === "CORE") {
                        balanceString =
                          tab === "stake"
                            ? getFormattedBalance("tCORE")
                            : getFormattedBalance("stCORE");
                      }

                      const rawBalance = parseFloat(balanceString);
                      setAmount(
                        selectedToken === "BTC"
                          ? "0.000000"
                          : selectedToken === "wBTC"
                          ? rawBalance.toFixed(6) // Format wBTC to 6dp
                          : rawBalance.toFixed(4) // Format CORE to 4dp
                      );
                    }}
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

          {/* Deposit Validation */}
          {selectedTokenData && amount && tokenContextConnected && (
            <DepositValidation
              wbtcAmount={
                selectedToken === "BTC" || selectedToken === "wBTC"
                  ? parseFloat(amount)
                  : 0
              }
              stcoreAmount={selectedToken === "CORE" ? parseFloat(amount) : 0}
              className="mt-4"
            />
          )}

          {/* Action Button */}
          <Button
            className="w-full mt-4"
            disabled={true} // Disabled since deposit/withdraw functionality not implemented
            onClick={() => {
              // Check wallet connection first
              if (
                !requireWalletConnection(
                  tab === "stake" ? "deposit assets" : "withdraw assets"
                )
              ) {
                return;
              }

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
                // Check if user has enough balance to convert using real balances
                const availableBalanceString =
                  selectedToken === "BTC"
                    ? "0" // BTC is always 0
                    : selectedToken === "wBTC"
                    ? getFormattedBalance("wBTC") // wBTC deposits use wBTC balance
                    : getFormattedBalance("tCORE"); // CORE staking uses tCORE balance

                const availableBalance = parseFloat(availableBalanceString);
                if (amountNum > availableBalance) {
                  toast({
                    title: "Insufficient Balance",
                    description: `You don't have enough ${
                      selectedToken === "BTC"
                        ? "BTC"
                        : selectedToken === "wBTC"
                        ? "wBTC"
                        : "tCORE"
                    } to deposit`,
                    variant: "destructive",
                  });
                  return;
                }

                // Note: In a real implementation, this would trigger blockchain transactions
                // For now, we'll show a demo message
                toast({
                  title: "Demo Mode - Deposit Simulated",
                  description: `Would deposit ${amount} ${selectedToken} ${
                    selectedToken === "CORE" ? "(staking tCORE→stCORE)" : ""
                  }. Real implementation would trigger blockchain transaction.`,
                });
              } else {
                // For redeem, check if user has enough tokens to withdraw
                const availableBalanceString =
                  selectedToken === "BTC"
                    ? "0" // BTC is always 0
                    : selectedToken === "wBTC"
                    ? getFormattedBalance("wBTC") // wBTC withdrawals use wBTC balance
                    : getFormattedBalance("stCORE"); // CORE withdrawals use stCORE balance

                const availableBalance = parseFloat(availableBalanceString);
                if (amountNum > availableBalance) {
                  toast({
                    title: "Insufficient Balance",
                    description: `You don't have enough ${selectedTokenData?.stakedSymbol} to convert to ${selectedToken}`,
                    variant: "destructive",
                  });
                  return;
                }

                // Note: In a real implementation, this would trigger blockchain transactions
                // For now, we'll show a demo message
                toast({
                  title: "Demo Mode - Withdrawal Simulated",
                  description: `Would withdraw ${amount} ${selectedToken} ${
                    selectedToken === "CORE" ? "(unstaking stCORE→tCORE)" : ""
                  }. Real implementation would trigger blockchain transaction.`,
                });
              }
              setIsOpen(false);
              setAmount("");
              setSelectedToken("");
            }}
          >
            {tab === "stake"
              ? "Deposit (Coming Soon)"
              : "Withdraw (Coming Soon)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
