import { Plus, TrendingUp, Vault, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DepositModal from "@/components/DepositModal";
import EarningsOverview from "@/components/EarningsCard";
import VaultCreationCard from "@/components/VaultCreationCard";
import UserPositions from "@/components/UserPositions";
import { useVault } from "@/contexts/VaultContext";

const Dashboard = () => {
  const { getTotalDeposited, getTotalValue, positions } = useVault();
  
  const totalDeposited = getTotalDeposited();
  const totalValue = getTotalValue();
  const totalWbtc = positions.reduce((sum, pos) => sum + pos.wbtcDeposited, 0);
  const totalStcore = positions.reduce((sum, pos) => sum + pos.stcoreDeposited, 0);
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-vault border border-vault-border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Yield Hub</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Maximize your yields on Core Testnet with optimized DeFi strategies
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <DepositModal>
              <Button variant="default" size="lg" className="group">
                <Plus className="w-5 h-5 mr-2" />
                <span>Deposit Assets</span>
              </Button>
            </DepositModal>
            <Button variant="outline" size="lg" className="group">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span>View Analytics</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Earnings Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Earnings</h2>
          <Button variant="ghost" size="sm">
            View All →
          </Button>
        </div>
        <EarningsOverview />
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary */}
        <Card className="lg:col-span-2 bg-gradient-vault border-vault-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-primary" />
              <span>Portfolio Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Deposited</p>
                <p className="text-2xl font-bold">${totalDeposited.toLocaleString()}</p>
                <p className="text-sm text-gold">
                  {totalValue > totalDeposited ? `+${((totalValue - totalDeposited) / totalDeposited * 100).toFixed(1)}%` : 'Start depositing to earn yield'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-2xl font-bold">{positions.length}</p>
                <p className="text-sm text-muted-foreground">
                  {positions.length > 0 ? 'lstBTC Vaults' : 'No positions yet'}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Asset Breakdown</h4>
              {positions.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">₿</span>
                      <span className="font-medium">wBTC Total</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{totalWbtc.toFixed(6)} wBTC</p>
                      <p className="text-sm text-muted-foreground">${(totalWbtc * 43000).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⚡</span>
                      <span className="font-medium">stCORE Total</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{totalStcore.toLocaleString()} stCORE</p>
                      <p className="text-sm text-muted-foreground">${totalStcore.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No assets deposited yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start by depositing to a vault</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vault Creation */}
        <VaultCreationCard />
      </div>

      {/* User Positions */}
      <UserPositions />

      {/* Quick Actions */}
      <Card className="bg-gradient-vault border-vault-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vault className="w-5 h-5 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DepositModal>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Deposit More
              </Button>
            </DepositModal>
            <Button variant="outline" className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Claim Rewards
            </Button>
            <Button variant="outline" className="w-full">
              <Vault className="w-4 h-4 mr-2" />
              Manage Vaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;