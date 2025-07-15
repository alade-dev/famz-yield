import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, TrendingUp, Users, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Vaults = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [description, setDescription] = useState("");
  const [minDeposit, setMinDeposit] = useState("");
  const { toast } = useToast();

  const existingVaults = [
    {
      name: "Core BTC Maximizer",
      apy: "18.5%",
      tvl: "$2.4M",
      strategy: "Automated wBTC yield farming",
      deposits: 156,
      status: "Active"
    },
    {
      name: "stCORE Compound",
      apy: "22.1%", 
      tvl: "$890K",
      strategy: "Staking rewards optimization",
      deposits: 89,
      status: "Active"
    },
    {
      name: "Multi-Asset Balance",
      apy: "15.7%",
      tvl: "$1.8M", 
      strategy: "Diversified portfolio management",
      deposits: 234,
      status: "Active"
    }
  ];

  const handleCreateVault = () => {
    if (!vaultName || !strategy || !minDeposit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Vault Created Successfully!",
      description: `${vaultName} has been deployed on Core Testnet`,
    });

    // Reset form
    setVaultName("");
    setStrategy("");
    setDescription("");
    setMinDeposit("");
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create New Vault</h1>
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Back to Vaults
          </Button>
        </div>

        <Card className="bg-gradient-vault border-vault-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Vault Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vaultName">Vault Name *</Label>
                <Input
                  id="vaultName"
                  placeholder="e.g. Core BTC Maximizer"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                  className="bg-muted border-vault-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minDeposit">Minimum Deposit *</Label>
                <Input
                  id="minDeposit"
                  placeholder="100"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(e.target.value)}
                  className="bg-muted border-vault-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy Type *</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="bg-muted border-vault-border">
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent className="bg-vault-card border-vault-border">
                  <SelectItem value="yield-farming">Yield Farming</SelectItem>
                  <SelectItem value="staking">Staking Optimization</SelectItem>
                  <SelectItem value="lending">Lending Protocol</SelectItem>
                  <SelectItem value="arbitrage">Arbitrage Trading</SelectItem>
                  <SelectItem value="multi-asset">Multi-Asset Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your vault's strategy and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted border-vault-border min-h-[100px]"
              />
            </div>

            <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <h4 className="font-medium text-gold">Core Testnet Deployment</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your vault will be deployed on Core Testnet with automated yield optimization strategies.
                    Management fees are set to 2% annually.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleCreateVault} className="w-full" variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Deploy Vault on Core Testnet
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
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deposits</span>
                <span className="font-medium">{vault.deposits} users</span>
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