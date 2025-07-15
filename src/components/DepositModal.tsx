import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Coins, TrendingUp, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DepositModalProps {
  children: React.ReactNode;
}

const DepositModal = ({ children }: DepositModalProps) => {
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const tokens = [
    {
      symbol: "wBTC",
      name: "Wrapped Bitcoin",
      balance: "0.0045",
      apy: "8.2%",
      icon: "₿"
    },
    {
      symbol: "stCORE",
      name: "Staked CORE",
      balance: "1,245.67",
      apy: "12.5%",
      icon: "⚡"
    }
  ];

  const selectedTokenData = tokens.find(token => token.symbol === selectedToken);

  const handleDeposit = () => {
    if (!selectedToken || !amount) {
      toast({
        title: "Error",
        description: "Please select a token and enter an amount",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deposit Initiated",
      description: `Depositing ${amount} ${selectedToken} to the vault`,
    });
    
    setIsOpen(false);
    setAmount("");
    setSelectedToken("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-vault-card border-vault-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-primary" />
            <span>Deposit Assets</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token">Select Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="bg-muted border-vault-border">
                <SelectValue placeholder="Choose a token to deposit" />
              </SelectTrigger>
              <SelectContent className="bg-vault-card border-vault-border">
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <div className="flex items-center space-x-3 w-full">
                      <span className="text-lg">{token.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-xs text-gold">{token.apy} APY</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
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
                  {selectedTokenData.symbol}
                </div>
              )}
            </div>
            {selectedTokenData && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Balance: {selectedTokenData.balance} {selectedTokenData.symbol}</span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => setAmount(selectedTokenData.balance)}
                >
                  MAX
                </Button>
              </div>
            )}
          </div>

          {/* Expected Returns */}
          {selectedTokenData && amount && (
            <Card className="p-4 bg-gradient-vault border-vault-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  <span className="text-sm">Expected Annual Return</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gold">
                    {(parseFloat(amount) * parseFloat(selectedTokenData.apy) / 100).toFixed(4)} {selectedTokenData.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedTokenData.apy} APY</div>
                </div>
              </div>
            </Card>
          )}

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            disabled={!selectedToken || !amount}
            className="w-full"
            variant="default"
          >
            <span>Deposit</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;