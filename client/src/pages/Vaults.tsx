import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Settings,
  TrendingUp,
  Users,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  ArrowDown,
  LayoutDashboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VaultDepositModal from "@/components/VaultDepositModal";
import UserPositions from "@/components/UserPositions";
import { useVault } from "@/contexts/VaultContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";

const Vaults = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [description, setDescription] = useState("");
  const [wbtcAmount, setWbtcAmount] = useState("");
  const [stcoreAmount, setStcoreAmount] = useState("");
  const [showUserVaults, setShowUserVaults] = useState(false);
  const { toast } = useToast();
  const {
    positions,
    addPosition,
    userBalances,
    setUserBalances,
    isWalletConnected,
    isDataLoaded,
  } = useVault();
  const { requireWalletConnection } = useWalletConnection();

  // Automatically show user vaults if they exist and wallet is connected
  useEffect(() => {
    if (isWalletConnected && isDataLoaded && positions.length > 0) {
      setShowUserVaults(true);
    }
  }, [positions.length, isWalletConnected, isDataLoaded]);

  const existingVaults = [
    {
      name: "BTC-CORE lstBTC Vault",
      apy: "24.8%",
      tvl: "$3.2M",
      strategy: "wBTC + stCORE → lstBTC conversion",
      deposits: 89,
      description: "Optimized yield farming with BTC and CORE assets",
      riskLevel: "Medium",
      lockPeriod: "Flexible",
      fees: "0.5%",
    },
    {
      name: "High-Yield stCORE Vault",
      apy: "18.5%",
      tvl: "$1.8M",
      strategy: "stCORE staking with compound rewards",
      deposits: 64,
      description: "Maximize stCORE yields with automated compounding",
      riskLevel: "Low",
      lockPeriod: "7 days",
      fees: "0.3%",
    },
    {
      name: "Balanced Growth Vault",
      apy: "15.2%",
      tvl: "$4.1M",
      strategy: "Diversified DeFi portfolio",
      deposits: 142,
      description: "Balanced approach to DeFi yield generation",
      riskLevel: "Low-Medium",
      lockPeriod: "Flexible",
      fees: "0.4%",
    },
  ];

  const handleCreateVault = async () => {
    if (!requireWalletConnection("create a vault")) {
      return;
    }

    if (!vaultName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a vault name",
        variant: "destructive",
      });
      return;
    }

    const wbtcValue = parseFloat(wbtcAmount) || 0;
    const stcoreValue = parseFloat(stcoreAmount) || 0;

    if (wbtcValue <= 0 && stcoreValue <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid amounts for wBTC or stCORE",
        variant: "destructive",
      });
      return;
    }

    // Check if user has sufficient balance
    if (wbtcValue > userBalances.wbtc) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${userBalances.wbtc.toFixed(
          6
        )} wBTC available`,
        variant: "destructive",
      });
      return;
    }

    if (stcoreValue > userBalances.stcore) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${userBalances.stcore.toLocaleString()} stCORE available`,
        variant: "destructive",
      });
      return;
    }

    // Deduct from user balance
    setUserBalances((prev) => ({
      wbtc: prev.wbtc - wbtcValue,
      stcore: prev.stcore - stcoreValue,
    }));

    const totalValue = wbtcValue * 43000 + stcoreValue;
    const lstbtcGenerated = totalValue * 0.95; // 5% fee

    addPosition({
      vaultName: vaultName.trim(),
      wbtcDeposited: wbtcValue,
      stcoreDeposited: stcoreValue,
      lstbtcGenerated,
      currentValue: totalValue,
      apy: "12.5%",
    });

    toast({
      title: "Vault Created Successfully!",
      description: `${vaultName} has been created with ${lstbtcGenerated.toFixed(
        2
      )} lstBTC`,
    });

    // Reset form
    setVaultName("");
    setDescription("");
    setWbtcAmount("");
    setStcoreAmount("");
    setIsCreating(false);
    setShowUserVaults(true);
  };

  // Component for showing wallet connection required message
  const WalletConnectionRequired = ({ message }: { message: string }) => (
    <Alert className="border-yellow-500/20 bg-yellow-500/10">
      <Shield className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <Lock className="h-4 w-4 ml-2" />
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vault Management</h1>
          <p className="text-muted-foreground">
            Create and manage your DeFi yield farming vaults
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Security Notice */}
      {!isWalletConnected && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
              Secure Vault Management
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your vault data is encrypted and wallet-protected. Connect your
            wallet to access your secure vault positions and create new vaults.
          </p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>
              Encrypted storage • Wallet authentication • Secure transactions
            </span>
          </div>
        </div>
      )}

      {/* Available Vaults */}
      <Card className="bg-gradient-vault border-vault-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Available Vaults</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingVaults.map((vault, index) => (
              <Card
                key={index}
                className="border-muted/20 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{vault.name}</CardTitle>
                    <span className="text-sm text-green-500 font-medium">
                      {vault.apy}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">TVL</p>
                      <p className="font-medium">{vault.tvl}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposits</p>
                      <p className="font-medium">{vault.deposits}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Strategy</p>
                    <p className="text-sm">{vault.strategy}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Risk</p>
                      <p className="font-medium">{vault.riskLevel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lock</p>
                      <p className="font-medium">{vault.lockPeriod}</p>
                    </div>
                  </div>
                  <VaultDepositModal
                    vaultName={vault.name}
                    apy={vault.apy}
                    strategy={vault.strategy}
                  >
                    <Button className="w-full" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Deposit
                    </Button>
                  </VaultDepositModal>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Vault */}
      <Card className="bg-gradient-vault border-vault-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Create New Vault</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isWalletConnected && isDataLoaded ? (
            <>
              {!isCreating ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Create your own custom vault with your preferred assets
                  </p>
                  <Button onClick={() => setIsCreating(true)} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="vaultName">Vault Name</Label>
                        <Input
                          id="vaultName"
                          placeholder="Enter vault name"
                          value={vaultName}
                          onChange={(e) => setVaultName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your vault strategy"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="wbtcAmount">wBTC Amount</Label>
                        <Input
                          id="wbtcAmount"
                          type="number"
                          placeholder="0.00"
                          value={wbtcAmount}
                          onChange={(e) => setWbtcAmount(e.target.value)}
                          step="0.000001"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available: {userBalances.wbtc.toFixed(6)} wBTC
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="stcoreAmount">stCORE Amount</Label>
                        <Input
                          id="stcoreAmount"
                          type="number"
                          placeholder="0"
                          value={stcoreAmount}
                          onChange={(e) => setStcoreAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available: {userBalances.stcore.toLocaleString()}{" "}
                          stCORE
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button onClick={handleCreateVault} className="flex-1">
                      Create Vault
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Lock className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Vault Creation Protected
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your wallet to create and manage custom vaults
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Vaults */}
      <Card className="bg-gradient-vault border-vault-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Your Vault Positions</span>
            </CardTitle>
            {isWalletConnected && isDataLoaded && (
              <span className="text-sm text-muted-foreground">
                {positions.length} active{" "}
                {positions.length === 1 ? "position" : "positions"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isWalletConnected && isDataLoaded ? (
            showUserVaults ? (
              <UserPositions />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No vault positions found. Create your first vault to get
                  started.
                </p>
                <Button onClick={() => setIsCreating(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Vault
                </Button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Vault Positions Secured
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your vault positions are encrypted and wallet-protected
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vaults;
