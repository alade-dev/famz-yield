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
import TokenBalances from "@/components/TokenBalances";
import { useVault } from "@/contexts/VaultContextWithAPI";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import { useUSDPrices } from "@/hooks/useUSDPrices";
import { useState } from "react";

const Dashboard = () => {
  const {
    getTotalDeposited,
    getTotalValue,
    positions,
    getTotalWbtcEarnings,
    getTotalStcoreEarnings,
    isWalletConnected,
    isDataLoaded,
    canDeposit,
    getAvailableBalance,
  } = useVault();

  // Get real token balances and USD prices
  const { tokens, getFormattedBalance, hasTokens } = useTokenBalanceContext();
  const { prices: usdPrices, isLoading: pricesLoading } = useUSDPrices();

  const totalDeposited = getTotalDeposited();
  const totalValue = getTotalValue();

  // Calculate total deposited value in USD
  const totalDepositedValue =
    totalDeposited.wbtc * usdPrices.wbtc +
    totalDeposited.stcore * usdPrices.stcore;
  const totalWbtc = positions.reduce((sum, pos) => sum + pos.wbtcDeposited, 0);
  const totalStcore = positions.reduce(
    (sum, pos) => sum + pos.stcoreDeposited,
    0
  );
  const totalLstBTC = positions.reduce(
    (sum, pos) => sum + pos.lstbtcGenerated,
    0
  );

  const [depositModalTab, setDepositModalTab] = useState<"stake" | "redeem">(
    "stake"
  );
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);

  // Helper functions for USD calculations
  const formatUSD = (amount: number) => {
    if (amount === 0) return "$0.00";
    if (amount < 0.01) return "< $0.01";
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getWalletBalanceUSD = (symbol: string) => {
    const balance = parseFloat(getFormattedBalance(symbol));
    switch (symbol.toLowerCase()) {
      case "wbtc":
        return balance * usdPrices.wbtc;
      case "stcore":
        return balance * usdPrices.stcore;
      case "tcore":
        return balance * usdPrices.tcore;
      case "lstbtc":
        return balance * usdPrices.lstbtc;
      default:
        return 0;
    }
  };

  const getVaultDepositsUSD = () => {
    const wbtcUSD = totalWbtc * usdPrices.wbtc;
    const stcoreUSD = totalStcore * usdPrices.stcore;
    return { wbtcUSD, stcoreUSD, total: wbtcUSD + stcoreUSD };
  };

  const getLstBTCValueUSD = () => {
    return totalLstBTC * usdPrices.lstbtc;
  };

  const getTotalEarningsUSD = () => {
    const wbtcEarningsUSD = getTotalWbtcEarnings() * usdPrices.wbtc;
    const stcoreEarningsUSD = getTotalStcoreEarnings() * usdPrices.stcore;
    return {
      wbtcEarningsUSD,
      stcoreEarningsUSD,
      total: wbtcEarningsUSD + stcoreEarningsUSD,
    };
  };

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
    <div id="hero" className="space-y-8  animate-fade-in">
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
      <div id="portfolio">
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
                      ${totalDepositedValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gold">
                      {totalValue > totalDepositedValue
                        ? `+${(
                            ((totalValue - totalDepositedValue) /
                              totalDepositedValue) *
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
                {/* Token Balances */}
                <TokenBalances />
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
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {getFormattedBalance("wBTC")}
                          </span>
                          {!pricesLoading && (
                            <p className="text-xs text-muted-foreground">
                              {formatUSD(getWalletBalanceUSD("wBTC"))}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center space-x-2">
                          <CoreIcon size="sm" />
                          <span className="text-sm">stCORE</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {parseFloat(getFormattedBalance("stCORE")).toFixed(
                              5
                            )}
                          </span>
                          {!pricesLoading && (
                            <p className="text-xs text-muted-foreground">
                              {formatUSD(getWalletBalanceUSD("stCORE"))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Earnings from lstBTC */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-muted-foreground">
                        Total Earnings from lstBTC
                      </h5>
                      {!pricesLoading && (
                        <span className="text-sm font-medium text-gold">
                          {formatUSD(getTotalEarningsUSD().total)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 bg-gold/10 rounded">
                        <div className="flex items-center space-x-2">
                          <BitcoinIcon size="sm" />
                          <span className="text-sm">wBTC</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gold">
                            +{getTotalWbtcEarnings().toFixed(8)}
                          </span>
                          {!pricesLoading && (
                            <p className="text-xs text-gold/70">
                              {formatUSD(getTotalEarningsUSD().wbtcEarningsUSD)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gold/10 rounded">
                        <div className="flex items-center space-x-2">
                          <CoreIcon size="sm" />
                          <span className="text-sm">stCORE</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gold">
                            +{getTotalStcoreEarnings().toFixed(5)}
                          </span>
                          {!pricesLoading && (
                            <p className="text-xs text-gold/70">
                              {formatUSD(
                                getTotalEarningsUSD().stcoreEarningsUSD
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total lstBTC Generated */}
                  {positions.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {/* <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Total lstBTC Generated
                        </h5>
                        {!pricesLoading && (
                          <span className="text-sm font-medium text-blue-500">
                            {formatUSD(getLstBTCValueUSD())}
                          </span>
                        )}
                      </div> */}
                      <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                            <span className="text-gold font-bold text-3xl">
                              ₿
                            </span>
                          </div>
                          <span className="font-medium">lstBTC</span>
                          <span className="text-xs bg-blue-500/20 text-gold px-2 py-1 rounded-full">
                            Liquid Staked BTC
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-500">
                            {totalLstBTC.toFixed(6)} lstBTC
                          </span>
                          {!pricesLoading && (
                            <p className="text-sm text-blue-500/70">
                              {formatUSD(getLstBTCValueUSD())}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {positions.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Vault Deposits
                        </h5>
                        {!pricesLoading && (
                          <span className="text-sm font-medium text-primary">
                            {formatUSD(getVaultDepositsUSD().total)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <BitcoinIcon size="lg" />
                          <span className="font-medium">wBTC Total</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {totalWbtc.toLocaleString()} wBTC
                          </p>
                          {!pricesLoading && (
                            <p className="text-sm text-muted-foreground">
                              {formatUSD(getVaultDepositsUSD().wbtcUSD)}
                            </p>
                          )}
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
                          {!pricesLoading && (
                            <p className="text-sm text-muted-foreground">
                              {formatUSD(getVaultDepositsUSD().stcoreUSD)}
                            </p>
                          )}
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
