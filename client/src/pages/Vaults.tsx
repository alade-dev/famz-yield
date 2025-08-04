import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  ArrowRight,
  LayoutDashboard,
  Shield,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserPositions from "@/components/UserPositions";
import { useVault } from "@/contexts/VaultContext";

import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
import { Badge } from "@/components/ui/badge";

const Vaults = () => {
  const { toast } = useToast();
  const {
    addPosition,
    updatePosition,
    removePosition,
    positions,
    userBalances,
    setUserBalances,
    isWalletConnected,
    isDataLoaded,
  } = useVault();

  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [btcAmount, setBtcAmount] = useState("");
  const [coreAmount, setCoreAmount] = useState("");

  // Dynamic calculations with boost system
  const btcValue = Math.max(0, Number(parseFloat(btcAmount || "0").toFixed(6)));
  const coreValue = Math.max(0, parseFloat(coreAmount) || 0);

  // Calculate boost multipliers based on percentage of available balance used
  const btcBoost =
    userBalances.wbtc > 0 ? Math.min(btcValue / userBalances.wbtc, 1) * 2 : 0; // Max 4x boost
  const coreBoost =
    userBalances.stcore > 0
      ? Math.min(coreValue / userBalances.stcore, 1) * 2
      : 0; // Max 4x boost

  // Calculate expected lstBTC based on inputs
  const calculateLstBtc = () => {
    const wbtc = parseFloat(btcAmount) || 0;
    const stcore = parseFloat(coreAmount) || 0;
    // Simplified calculation: wBTC is worth more, stCORE contributes less
    return (wbtc * 0.95 + stcore * 0.0001).toFixed(6);
  };

  // Calculate total USD value (rough estimation)
  const calculateTotalValue = () => {
    const wbtc = parseFloat(btcAmount) || 0;
    const stcore = parseFloat(coreAmount) || 0;
    // Rough USD values: wBTC ~$43,000, stCORE ~$1
    return wbtc * 43000 + stcore * 1;
  };

  const handleProceed = () => {
    // Validate amounts are not empty
    if (!btcAmount.trim() && !coreAmount.trim()) {
      toast({
        title: "Amount Required",
        description: "Please enter an amount to stake or unstake",
        variant: "destructive",
      });
      return;
    }

    // Validate amounts are numbers and positive
    if (
      (btcAmount && (isNaN(btcValue) || btcValue < 0)) ||
      (coreAmount && (isNaN(coreValue) || coreValue < 0))
    ) {
      toast({
        title: "Invalid Amount",
        description: "Please enter valid positive numbers",
        variant: "destructive",
      });
      return;
    }

    // Validate sufficient balance for staking
    if (mode === "stake") {
      if (btcValue > userBalances.wbtc) {
        toast({
          title: "Insufficient BTC Balance",
          description: "You don't have enough BTC to stake this amount",
          variant: "destructive",
        });
        return;
      }
      if (coreValue > userBalances.stcore) {
        toast({
          title: "Insufficient CORE Balance",
          description: "You don't have enough CORE to stake this amount",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate sufficient staked amount for unstaking
    if (mode === "unstake") {
      const stakedBtc = positions.reduce((sum, p) => sum + p.wbtcDeposited, 0);
      const stakedCore = positions.reduce(
        (sum, p) => sum + p.stcoreDeposited,
        0
      );

      if (btcValue > stakedBtc) {
        toast({
          title: "Insufficient Staked BTC",
          description:
            "You don't have enough staked BTC to unstake this amount",
          variant: "destructive",
        });
        return;
      }
      if (coreValue > stakedCore) {
        toast({
          title: "Insufficient Staked CORE",
          description:
            "You don't have enough staked CORE to unstake this amount",
          variant: "destructive",
        });
        return;
      }
    }

    // Execute stake/unstake logic
    if (mode === "stake") {
      // STAKE LOGIC
      console.log("Executing stake operation:", { btcValue, coreValue });

      // Deduct from user balances
      setUserBalances((prev) => ({
        ...prev,
        wbtc: prev.wbtc - btcValue,
        stcore: prev.stcore - coreValue,
      }));

      // Add new position
      addPosition({
        vaultName: "Famz Vault",
        wbtcDeposited: btcValue,
        stcoreDeposited: coreValue,
        lstbtcGenerated: parseFloat(calculateLstBtc()),
        currentValue: calculateTotalValue(),
        apy: "12.5%", // More realistic APY
      });

      console.log("Stake completed successfully");
    } else {
      // UNSTAKE LOGIC
      console.log("Executing unstake operation:", { btcValue, coreValue });

      const result = handleUnstake(btcValue, coreValue);

      console.log("Unstake completed:", {
        btcWithdrawn: result.btcWithdrawn,
        coreWithdrawn: result.coreWithdrawn,
        positionsUpdated: result.positionsUpdated.length,
        positionsRemoved: result.positionsRemoved.length,
      });
    }

    // Clear input fields after successful operation
    setBtcAmount("");
    setCoreAmount("");

    // Show success message
    const processedAmounts: string[] = [];
    if (btcValue > 0) processedAmounts.push(`${btcValue} BTC`);
    if (coreValue > 0) processedAmounts.push(`${coreValue} CORE`);

    toast({
      title: `${mode.charAt(0).toUpperCase() + mode.slice(1)}${
        mode === "stake" ? "d" : "d"
      } Successfully!`,
      description: `${
        mode === "stake" ? "Staked" : "Unstaked"
      } ${processedAmounts.join(" and ")}`,
      variant: "default",
    });
  };

  // Helper function to handle unstaking (partial withdrawal)
  const handleUnstake = (btcToUnstake: number, coreToUnstake: number) => {
    let remainingBtc = btcToUnstake;
    let remainingCore = coreToUnstake;
    const positionsToUpdate = [...positions];
    const positionsToRemove: string[] = [];

    // Process each position to withdraw the requested amounts
    for (
      let i = 0;
      i < positionsToUpdate.length && (remainingBtc > 0 || remainingCore > 0);
      i++
    ) {
      const position = positionsToUpdate[i];
      let btcWithdrawn = 0;
      let coreWithdrawn = 0;

      // Withdraw BTC if needed and available
      if (remainingBtc > 0 && position.wbtcDeposited > 0) {
        btcWithdrawn = Math.min(remainingBtc, position.wbtcDeposited);
        position.wbtcDeposited -= btcWithdrawn;
        remainingBtc -= btcWithdrawn;
      }

      // Withdraw CORE if needed and available
      if (remainingCore > 0 && position.stcoreDeposited > 0) {
        coreWithdrawn = Math.min(remainingCore, position.stcoreDeposited);
        position.stcoreDeposited -= coreWithdrawn;
        remainingCore -= coreWithdrawn;
      }

      // If position has no deposits left, mark for removal
      if (position.wbtcDeposited === 0 && position.stcoreDeposited === 0) {
        console.log(
          `Marking position ${position.id} for removal - fully withdrawn`
        );
        positionsToRemove.push(position.id);
      } else {
        // Recalculate lstBTC and current value for remaining position
        const remainingWbtc = position.wbtcDeposited;
        const remainingStcore = position.stcoreDeposited;
        position.lstbtcGenerated = parseFloat(
          (remainingWbtc * 0.95 + remainingStcore * 0.0001).toFixed(6)
        );
        position.currentValue = remainingWbtc * 43000 + remainingStcore;
      }
    }

    // Update user balances (return the unstaked amounts)
    setUserBalances((prev) => ({
      ...prev,
      wbtc: prev.wbtc + (btcToUnstake - remainingBtc),
      stcore: prev.stcore + (coreToUnstake - remainingCore),
    }));

    // Apply position updates and removals using VaultContext methods
    const updatedPositions = positionsToUpdate.filter(
      (p) => !positionsToRemove.includes(p.id)
    );

    // Update existing positions with new amounts
    updatedPositions.forEach((position) => {
      updatePosition(position.id, {
        wbtcDeposited: position.wbtcDeposited,
        stcoreDeposited: position.stcoreDeposited,
        lstbtcGenerated: position.lstbtcGenerated,
        currentValue: position.currentValue,
      });
    });

    // Remove positions that are fully withdrawn
    positionsToRemove.forEach((positionId) => {
      console.log(`Removing position: ${positionId}`);
      removePosition(positionId);
    });

    console.log("Position updates applied successfully:", {
      updated: updatedPositions.length,
      removed: positionsToRemove.length,
      positionsToRemove: positionsToRemove,
    });

    return {
      btcWithdrawn: btcToUnstake - remainingBtc,
      coreWithdrawn: coreToUnstake - remainingCore,
      positionsUpdated: positionsToUpdate.filter(
        (p) => !positionsToRemove.includes(p.id)
      ),
      positionsRemoved: positionsToRemove,
    };
  };

  // Input handlers that prevent negative values
  const handleBtcAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setBtcAmount(value);
    }
  };

  const handleCoreAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setCoreAmount(value);
    }
  };

  // Filter valid positions (with non-zero deposits)
  const validPositions = positions.filter(
    (p) => p.wbtcDeposited > 0 || p.stcoreDeposited > 0
  );

  // Max values based on mode
  const maxBtc =
    mode === "stake"
      ? userBalances.wbtc
      : positions.reduce((sum, p) => sum + p.wbtcDeposited, 0);
  const maxCore =
    mode === "stake"
      ? userBalances.stcore
      : positions.reduce((sum, p) => sum + p.stcoreDeposited, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vault Calculator</h1>
          <p className="text-muted-foreground">
            Calculate and perform vault operations
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Staking Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Calculator */}
        <Card className="bg-gradient-vault border-vault-border">
          <CardHeader>
            <CardTitle>Vault Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Toggle */}
            <div className="w-full mb-6">
              <div className="flex bg-muted/20 rounded-full p-1.5 max-w-sm mx-auto border border-border/50">
                <button
                  onClick={() => setMode("stake")}
                  className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-300 ${
                    mode === "stake"
                      ? "bg-primary text-white shadow-lg transform scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  Stake
                </button>
                <button
                  onClick={() => setMode("unstake")}
                  className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-300 ${
                    mode === "unstake"
                      ? "bg-primary text-white shadow-lg transform scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  Unstake
                </button>
              </div>
            </div>

            {/* BTC Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  BTC {mode === "stake" ? "Staking" : "Unstaking"} Amount:
                </Label>
                {isWalletConnected ? (
                  <span className="text-sm text-muted-foreground">
                    Connected
                  </span>
                ) : (
                  <span className="text-sm text-red-500">Disconnect</span>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <BitcoinIcon size="sm" />
                </div>
                <Input
                  id="btc-amount"
                  type="text"
                  value={btcAmount}
                  onChange={handleBtcAmountChange}
                  placeholder="0.001"
                  className="bg-muted border-vault-border pr-16 py-6 pl-12"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setBtcAmount(maxBtc.toString())}
                >
                  MAX
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Available:{" "}
                {mode === "stake"
                  ? `${userBalances.wbtc.toFixed(6)} wBTC`
                  : `${positions
                      .reduce((sum, pos) => sum + pos.wbtcDeposited, 0)
                      .toFixed(6)} wBTC`}
              </div>

              {/* Validator Section */}
              <div className="space-y-2">
                <Label className="text-sm">Delegate To Custodian:</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">
                        F
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">Famz Custodian</p>
                      <p className="text-xs text-muted-foreground">
                        BTC Reward Rate (up to):{" "}
                        <span className="text-green-500">4.96%</span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-500"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* CORE Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  CORE {mode === "stake" ? "Staking" : "Unstaking"} Amount:
                </Label>
                {isWalletConnected ? (
                  <span className="text-sm text-muted-foreground">
                    Connected
                  </span>
                ) : (
                  <span className="text-sm text-red-500">Disconnect</span>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <CoreIcon size="sm" />
                </div>
                <Input
                  id="core-amount"
                  type="text"
                  value={coreAmount}
                  onChange={handleCoreAmountChange}
                  placeholder="34,000"
                  className="bg-muted border-vault-border pr-16 py-6 pl-12"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setCoreAmount(maxCore.toString())}
                >
                  MAX
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Available:{" "}
                {mode === "stake"
                  ? `${userBalances.stcore.toLocaleString()} stCORE`
                  : `${positions
                      .reduce((sum, pos) => sum + pos.stcoreDeposited, 0)
                      .toLocaleString()} stCORE`}
              </div>

              {/* Validator Section */}
              <div className="space-y-2">
                <Label className="text-sm">Delegate To Custodian:</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">
                        F
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">Famz Custodian</p>
                      <p className="text-xs text-muted-foreground">
                        CORE Reward Rate:{" "}
                        <span className="text-green-500">6.45%</span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-500"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <Button
              className="w-full"
              disabled={!btcAmount && !coreAmount}
              size="lg"
              onClick={handleProceed}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              Proceed to {mode === "stake" ? "Stake" : "Unstake"}
            </Button>
          </CardContent>
        </Card>

        {/* Right Panel - Summary/Details */}
        <Card className="bg-gradient-vault border-vault-border">
          <CardContent className="p-0">
            <div className="w-full">
              <div className="flex mb-4 justify-center">
                <div className="  w-1/2  mx-4">
                  <Button
                    variant="secondary"
                    className="w-full cursor-default rounded-full mt-3 md:mt-6 "
                  >
                    <span className="text-primary">Summary</span>
                  </Button>
                </div>
              </div>

              {/* Conversion Preview */}
              {btcAmount && coreAmount && (
                <Card className="p-4 mx-4 bg-gradient-primary/10 border-primary/20">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">wBTC</p>
                        <p className="font-bold">{btcAmount}</p>
                      </div>
                      <span className="text-muted-foreground">+</span>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">stCORE</p>
                        <p className="font-bold">{coreAmount}</p>
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

              <div className="p-6 space-y-6">
                {/* Projected Annual Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      Projected Annual Reward Rate
                    </Label>
                  </div>
                  <p className="text-4xl font-bold text-gold">
                    {Number(calculateTotalValue() / 10000).toFixed(2)}%
                  </p>
                </div>

                {/* Projected Annual Rewards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Projected Annual Rewards</Label>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-4xl font-bold text-gold">
                      {Number(calculateLstBtc()).toFixed(3)}K
                    </p>
                    <span className="text-sm text-muted-foreground">
                      LstBTC
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ${calculateTotalValue().toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* Dual Staking Tiers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Dual Staking Tiers:</Label>
                  </div>

                  {/* BTC Staked */}
                  <div className="space-y-2 pb-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">wBTC Staked</Label>
                      <Badge variant="outline">
                        {userBalances.wbtc > 0
                          ? `${((btcValue / userBalances.wbtc) * 100).toFixed(
                              0
                            )}% (${btcBoost.toFixed(1)}x boost)`
                          : "0% (0x boost)"}
                      </Badge>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          {userBalances.wbtc > 0
                            ? (userBalances.wbtc * 0.25).toFixed(3)
                            : "0"}
                        </span>
                        <span>
                          {userBalances.wbtc > 0
                            ? (userBalances.wbtc * 0.5).toFixed(3)
                            : "0"}
                        </span>
                        <span>
                          {userBalances.wbtc > 0
                            ? (userBalances.wbtc * 0.75).toFixed(3)
                            : "0"}
                        </span>
                        <span>
                          {userBalances.wbtc > 0
                            ? userBalances.wbtc.toFixed(3)
                            : "0"}
                        </span>
                      </div>
                      <Slider
                        value={[
                          userBalances.wbtc > 0
                            ? Math.min(
                                (btcValue / userBalances.wbtc) * 100,
                                100
                              )
                            : 0,
                        ]}
                        max={100}
                        step={1}
                        className="w-full"
                        disabled
                      />
                      <div className="absolute -bottom-6 left-0">
                        <Badge
                          variant="secondary"
                          className="bg-gold/20 text-gold"
                        >
                          {btcValue > 0 ? btcValue : "0"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* CORE Staked */}
                  <div className="space-y-2 pb-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">stCORE Staked</Label>
                      <Badge variant="outline">
                        {userBalances.stcore > 0
                          ? `${(
                              (coreValue / userBalances.stcore) *
                              100
                            ).toFixed(0)}% (${coreBoost.toFixed(1)}x boost)`
                          : "0% (0x boost)"}
                      </Badge>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between text-xs text-muted-foreground  mb-1">
                        <span>
                          {userBalances.stcore > 0
                            ? Math.round(userBalances.stcore * 0.25)
                            : "0"}
                        </span>
                        <span>
                          {userBalances.stcore > 0
                            ? Math.round(userBalances.stcore * 0.5)
                            : "0"}
                        </span>
                        <span>
                          {userBalances.stcore > 0
                            ? Math.round(userBalances.stcore * 0.75)
                            : "0"}
                        </span>
                        <span>
                          {userBalances.stcore > 0
                            ? Math.round(userBalances.stcore)
                            : "0"}
                        </span>
                      </div>
                      <Slider
                        value={[
                          userBalances.stcore > 0
                            ? Math.min(
                                (coreValue / userBalances.stcore) * 100,
                                100
                              )
                            : 0,
                        ]}
                        max={100}
                        step={1}
                        className="w-full"
                        disabled
                      />
                      <div className="absolute  -bottom-6 left-0">
                        <Badge
                          variant="secondary"
                          className="bg-gold/20 text-gold"
                        >
                          {coreValue > 0 ? coreValue : 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Vault Positions */}
      <Card className="bg-gradient-vault border-vault-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Your Vault Positions</span>
            </CardTitle>
            {isWalletConnected && isDataLoaded && (
              <span className="text-sm text-muted-foreground">
                {validPositions.length} active{" "}
                {validPositions.length === 1 ? "position" : "positions"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isWalletConnected && isDataLoaded ? (
            validPositions.length > 0 ? (
              <UserPositions />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No vault positions found. Use the vault calculator above to
                  get started.
                </p>
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
