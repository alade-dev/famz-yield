import {
  Plus,
  TrendingUp,
  Vault,
  Coins,
  ArrowRight,
  Wallet,
  Shield,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DepositModal from "@/components/DepositModal";
import EarningsOverview from "@/components/EarningsCard";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
import VaultCreationCard from "@/components/VaultCreationCard";
import UserPositions from "@/components/UserPositions";
import { useVault } from "@/contexts/VaultContext";
import { useState } from "react";

const Dashboard = () => {
  const {
    getTotalDeposited,
    getTotalValue,
    positions,
    userBalances,
    getTotalWbtcEarnings,
    getTotalStcoreEarnings,
    isWalletConnected,
    isDataLoaded,
  } = useVault();

  const totalDeposited = getTotalDeposited();
  const totalValue = getTotalValue();
  const totalWbtc = positions.reduce((sum, pos) => sum + pos.wbtcDeposited, 0);
  const totalStcore = positions.reduce(
    (sum, pos) => sum + pos.stcoreDeposited,
    0
  );

  const [depositModalTab, setDepositModalTab] = useState<"stake" | "redeem">(
    "stake"
  );
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);

  // Component for showing wallet connection required message
  const WalletConnectionRequired = () => (
    <Alert className="border-yellow-500/20 bg-yellow-500/10">
      <Shield className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
        <div className="flex items-center justify-between">
          <span>Connect your wallet to view your secure financial data</span>
          <Lock className="h-4 w-4 ml-2" />
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-vault border border-vault-border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Famz Yield
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Maximize your yields on Core Testnet with optimized DeFi strategies
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <DepositModal
              initialTab={depositModalTab}
              isOpen={isDepositModalOpen}
              setIsOpen={setDepositModalOpen}
            >
              <Button
                variant="default"
                size="lg"
                className="group"
                onClick={() => {
                  setDepositModalTab("stake");
                  setDepositModalOpen(true);
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                <span>Deposit Assets</span>
              </Button>
            </DepositModal>
            <Button
              variant="outline"
              size="lg"
              className="group"
              onClick={() => {
                setDepositModalTab("redeem");
                setDepositModalOpen(true);
              }}
            >
              <Wallet className="w-5 h-5 mr-2" />
              <span>Withdraw</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      {!isWalletConnected && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
              Enhanced Security
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your financial data is encrypted and only accessible when your
            wallet is connected. This ensures maximum security for your DeFi
            activities.
          </p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Data encryption • Wallet-gated access • Secure storage</span>
          </div>
        </div>
      )}

      {/* Earnings Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Earnings</h2>
          <Button variant="ghost" size="sm">
            View All →
          </Button>
        </div>
        {isWalletConnected && isDataLoaded ? (
          <EarningsOverview />
        ) : (
          <WalletConnectionRequired />
        )}
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
            {isWalletConnected && isDataLoaded ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Total Deposited
                    </p>
                    <p className="text-2xl font-bold">
                      ${totalDeposited.toLocaleString()}
                    </p>
                    <p className="text-sm text-gold">
                      {totalValue > totalDeposited
                        ? `+${(
                            ((totalValue - totalDeposited) / totalDeposited) *
                            100
                          ).toFixed(1)}%`
                        : "Start depositing to earn yield"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Active Positions
                    </p>
                    <p className="text-2xl font-bold">{positions.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {positions.length > 0
                        ? "lstBTC Vaults"
                        : "No positions yet"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Asset Breakdown</h4>
                  {/* User Wallet Balances */}
                  <div className="space-y-2 mb-4">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      Available Balance
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center space-x-2">
                          <BitcoinIcon size="sm" />
                          <span className="text-sm">wBTC</span>
                        </div>
                        <span className="text-sm font-medium">
                          {userBalances.wbtc.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center space-x-2">
                          <CoreIcon size="sm" />
                          <span className="text-sm">stCORE</span>
                        </div>
                        <span className="text-sm font-medium">
                          {userBalances.stcore.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Earnings from lstBTC */}
                  <div className="space-y-2 mb-4">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      Total Earnings from lstBTC
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 bg-gold/10 rounded">
                        <div className="flex items-center space-x-2">
                          <BitcoinIcon size="sm" />
                          <span className="text-sm">wBTC</span>
                        </div>
                        <span className="text-sm font-medium text-gold">
                          +{getTotalWbtcEarnings().toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gold/10 rounded">
                        <div className="flex items-center space-x-2">
                          <CoreIcon size="sm" />
                          <span className="text-sm">stCORE</span>
                        </div>
                        <span className="text-sm font-medium text-gold">
                          +{getTotalStcoreEarnings().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {positions.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">
                        Vault Deposits
                      </h5>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <BitcoinIcon size="lg" />
                          <span className="font-medium">wBTC Total</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {totalWbtc.toFixed(6)} wBTC
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${(totalWbtc * 43000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CoreIcon size="lg" />
                          <span className="font-medium">stCORE Total</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {totalStcore.toLocaleString()} stCORE
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${totalStcore.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        No assets deposited yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start by depositing to a vault
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    Portfolio Data Protected
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your wallet to view your secure portfolio summary
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vault Creation */}
        <VaultCreationCard />
      </div>

      {/* User Positions */}
      <div className="mt-8 animate-fade-in">
        <Card className="bg-gradient-vault border-vault-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Vault Positions</h2>
            {isWalletConnected && isDataLoaded && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {positions.length} active{" "}
                  {positions.length === 1 ? "position" : "positions"}
                </span>
                {positions.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    asChild
                  >
                    <Link to="/vaults">
                      <span>View all vaults</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
          {isWalletConnected && isDataLoaded ? (
            <UserPositions limit={2} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Positions Data Secured
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your vault positions are encrypted and wallet-protected
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

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
            <Link to="/vaults">
              <Button variant="outline" className="w-full">
                <Vault className="w-4 h-4 mr-2" />
                Manage Vaults
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
