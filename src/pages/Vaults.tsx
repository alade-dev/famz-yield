import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, TrendingUp, Users, Lock, ArrowRight, Sparkles, Shield, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Vaults = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [description, setDescription] = useState("");
  const [wbtcAmount, setWbtcAmount] = useState("");
  const [stcoreAmount, setStcoreAmount] = useState("");
  const { toast } = useToast();

  const existingVaults = [
    {
      name: "BTC-CORE lstBTC Vault",
      apy: "24.8%",
      tvl: "$3.2M",
      strategy: "wBTC + stCORE → lstBTC conversion",
      deposits: 89,
      status: "Active",
      assets: "wBTC, stCORE"
    },
    {
      name: "Dual Asset lstBTC Pro",
      apy: "22.1%", 
      tvl: "$1.8M",
      strategy: "Enhanced lstBTC yield optimization",
      deposits: 156,
      status: "Active",
      assets: "wBTC, stCORE"
    },
    {
      name: "Core lstBTC Maximizer",
      apy: "26.3%",
      tvl: "$2.1M", 
      strategy: "Maximum yield lstBTC strategy",
      deposits: 67,
      status: "Active",
      assets: "wBTC, stCORE"
    }
  ];

  const handleCreateVault = () => {
    if (!vaultName || !wbtcAmount || !stcoreAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including both wBTC and stCORE amounts",
        variant: "destructive",
      });
      return;
    }

    const wbtcNum = parseFloat(wbtcAmount);
    const stcoreNum = parseFloat(stcoreAmount);
    
    if (wbtcNum <= 0 || stcoreNum <= 0) {
      toast({
        title: "Error",
        description: "Both wBTC and stCORE amounts must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "lstBTC Vault Created Successfully!",
      description: `${vaultName} has been deployed on Core Testnet with ${wbtcAmount} wBTC and ${stcoreAmount} stCORE`,
    });

    // Reset form
    setVaultName("");
    setDescription("");
    setWbtcAmount("");
    setStcoreAmount("");
    setIsCreating(false);
  };

  // Calculate expected lstBTC based on inputs
  const calculateLstBtc = () => {
    const wbtc = parseFloat(wbtcAmount) || 0;
    const stcore = parseFloat(stcoreAmount) || 0;
    // Simplified calculation for demonstration
    return ((wbtc * 0.95) + (stcore * 0.0001)).toFixed(6);
  };

  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create lstBTC Vault</h1>
            <p className="text-muted-foreground">Deploy a dual-asset vault on Core Testnet</p>
          </div>
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Back to Vaults
          </Button>
        </div>

        <Card className="bg-gradient-vault border-vault-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>lstBTC Vault Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vault Name */}
            <div className="space-y-2">
              <Label htmlFor="vaultName">Vault Name *</Label>
              <Input
                id="vaultName"
                placeholder="e.g. My lstBTC Yield Vault"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                className="bg-muted border-vault-border"
              />
            </div>

            {/* Dual Asset Requirements */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Required Assets</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wbtcAmount">wBTC Amount *</Label>
                  <div className="relative">
                    <Input
                      id="wbtcAmount"
                      type="number"
                      placeholder="0.1"
                      value={wbtcAmount}
                      onChange={(e) => setWbtcAmount(e.target.value)}
                      className="bg-muted border-vault-border pr-16"
                      step="0.00001"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground flex items-center space-x-1">
                      <span>₿</span>
                      <span>wBTC</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stcoreAmount">stCORE Amount *</Label>
                  <div className="relative">
                    <Input
                      id="stcoreAmount"
                      type="number"
                      placeholder="1000"
                      value={stcoreAmount}
                      onChange={(e) => setStcoreAmount(e.target.value)}
                      className="bg-muted border-vault-border pr-16"
                      step="1"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground flex items-center space-x-1">
                      <span>⚡</span>
                      <span>stCORE</span>
                    </div>
                  </div>
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
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Expected lstBTC</p>
                    <p className="text-xl font-bold text-gold">{calculateLstBtc()} lstBTC</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Vault Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your vault's purpose and strategy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted border-vault-border min-h-[80px]"
              />
            </div>

            {/* Strategy Explanation */}
            <div className="p-4 bg-vault-border/20 border border-vault-border rounded-lg space-y-3">
              <h4 className="font-medium text-gold flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>lstBTC Vault Strategy</span>
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Wrapped BTC and LST Integration:</strong> Both wBTC and stCORE are converted into lstBTC at the custodian</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Yield Generation:</strong> lstBTC generates yield by combining liquid staking benefits with BTC exposure</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Custodian-Based Conversion:</strong> Trusted custodian ensures security and transparency</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Liquidity & Flexibility:</strong> Withdraw or convert lstBTC back to original assets anytime</span>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <Button 
              onClick={handleCreateVault} 
              className="w-full" 
              variant="default"
              disabled={!vaultName || !wbtcAmount || !stcoreAmount}
            >
              <Plus className="w-4 h-4 mr-2" />
              Deploy lstBTC Vault on Core Testnet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yield Vaults</h1>
          <p className="text-muted-foreground">Optimized strategies on Core Testnet</p>
        </div>
        <Button onClick={() => setIsCreating(true)} variant="default">
          <Plus className="w-4 h-4 mr-2" />
          Create Vault
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-vault border-vault-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total TVL</p>
                <p className="text-2xl font-bold text-gold">$5.1M</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gold" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-vault border-vault-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Vaults</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-vault border-vault-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg APY</p>
                <p className="text-2xl font-bold text-gold">19.2%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-vault border-vault-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vault Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {existingVaults.map((vault, index) => (
          <Card key={index} className="bg-gradient-vault border-vault-border hover:border-primary/50 transition-all duration-300 hover:shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{vault.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{vault.strategy}</p>
                </div>
                <span className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full border border-gold/20">
                  {vault.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">APY</p>
                  <p className="text-xl font-bold text-gold">{vault.apy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVL</p>
                  <p className="text-xl font-bold">{vault.tvl}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Required Assets</span>
                  <span className="font-medium text-xs">{vault.assets}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deposits</span>
                  <span className="font-medium">{vault.deposits} users</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="default" className="flex-1 group">
                  <span>Deposit</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Vaults;