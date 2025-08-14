import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  ArrowRight,
  LayoutDashboard,
  Shield,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import UserPositions from "@/components/UserPositions";
import { useVault } from "@/contexts/VaultContext";
import { useTokenBalanceContext } from "@/contexts/TokenBalanceContext";
import {
  simulateDepositWithChecks,
  approveTokens,
  approveWBTC,
  approveStCORE,
  checkAllowances,
  executeDeposit,
  getOraclePrices,
  calculateLstBTCFromDeposit,
  simulateRedeemWithChecks,
  calculateRedeemOutput,
  executeRedeem as executeVaultRedeem,
} from "@/scripts/vaultHelpers";
import { btcPriceCache } from "@/scripts/priceApi";
import TransactionSuccessModal from "@/components/TransactionSuccessModal";

import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
import { Badge } from "@/components/ui/badge";
import { simulateDeposit } from "@/scripts";

const Vaults = () => {
  const { toast } = useToast();
  const { address } = useAccount();
  const {
    addPosition,
    updatePosition,
    removePosition,
    positions,
    canDeposit,
    getAvailableBalance,
    isWalletConnected,
    isDataLoaded,
  } = useVault();

  const { getFormattedBalance } = useTokenBalanceContext();

  const [mode, setMode] = useState<"deposit" | "redeem">("deposit");
  const [btcAmount, setBtcAmount] = useState("");
  const [coreAmount, setCoreAmount] = useState("");
  const [lstbtcAmount, setLstbtcAmount] = useState("");
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string>("");
  const [redeemPreview, setRedeemPreview] = useState<{
    wbtcToReceive: number;
    stcoreToReceive: number;
    totalValue: number;
  } | null>(null);
  const [redeemPreviewLoading, setRedeemPreviewLoading] = useState(false);

  // Price management state
  const [prices, setPrices] = useState({
    wbtc: 0,
    stcore: 0,
  });
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<number>(0);

  // Refs for managing intervals and timeouts
  const priceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timestampUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // State for live timestamp updates
  const [, forceUpdate] = useState({});

  // Fetch prices from oracle
  const fetchPrices = useCallback(async () => {
    setPriceLoading(true);
    try {
      // Fetch real prices from both oracle and external APIs
      const [oraclePrices, btcUsdPrice] = await Promise.all([
        getOraclePrices(),
        btcPriceCache.getPrice(),
      ]);

      // Convert oracle prices to USD values for display
      // Note: Oracle gives us stCORE/CORE and CORE/BTC ratios
      const stCOREPrice = parseFloat(oraclePrices.stCOREPrice); // stCORE/CORE ratio
      const coreBTCPrice = parseFloat(oraclePrices.coreBTCPrice); // CORE/BTC ratio

      // Calculate USD values using real BTC price
      // const coreUsdPrice = coreBTCPrice * btcUsdPrice; // CORE price in USD
      const stcoreUsdPrice = stCOREPrice; // stCORE price in USD

      const newPrices = {
        wbtc: Math.round(btcUsdPrice), // wBTC ≈ BTC price
        stcore: parseFloat(stcoreUsdPrice.toFixed(5)),
      };

      setPrices(newPrices);
      setLastPriceUpdate(Date.now());

      // console.log("Oracle prices fetched:", {
      //   realBTCPrice: `$${btcUsdPrice.toLocaleString()}`,
      //   stCOREPrice: oraclePrices.stCOREPrice,
      //   coreBTCPrice: oraclePrices.coreBTCPrice,
      //   calculatedUSDPrices: newPrices,
      // });
    } catch (error) {
      console.error("Failed to fetch oracle prices:", error);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  const fetchRedeemPreview = useCallback(
    async (lstbtcToRedeem: number) => {
      if (!address || lstbtcToRedeem <= 0) {
        setRedeemPreview(null);
        return;
      }

      setRedeemPreviewLoading(true);
      try {
        // Try to get blockchain data first
        const redeemOutput = await calculateRedeemOutput(
          address,
          lstbtcToRedeem.toString()
        );
        const totalValue =
          parseFloat(redeemOutput.wbtcAmount) * prices.wbtc +
          parseFloat(redeemOutput.stcoreAmount) * prices.stcore;

        setRedeemPreview({
          wbtcToReceive: parseFloat(redeemOutput.wbtcAmount),
          stcoreToReceive: parseFloat(redeemOutput.stcoreAmount),
          totalValue,
        });
      } catch (error) {
        console.error("Error fetching redeem preview from blockchain:", error);

        // Fallback to local calculation
        let remainingLstbtc = lstbtcToRedeem;
        let totalWbtcToReceive = 0;
        let totalStcoreToReceive = 0;

        for (const position of positions) {
          if (remainingLstbtc <= 0 || position.lstbtcGenerated <= 0) continue;

          const redeemFromThisPosition = Math.min(
            remainingLstbtc,
            position.lstbtcGenerated
          );
          const redeemRatio = redeemFromThisPosition / position.lstbtcGenerated;

          totalWbtcToReceive += position.wbtcDeposited * redeemRatio;
          totalStcoreToReceive += position.stcoreDeposited * redeemRatio;

          remainingLstbtc -= redeemFromThisPosition;
        }

        setRedeemPreview({
          wbtcToReceive: totalWbtcToReceive,
          stcoreToReceive: totalStcoreToReceive,
          totalValue:
            totalWbtcToReceive * prices.wbtc +
            totalStcoreToReceive * prices.stcore,
        });
      } finally {
        setRedeemPreviewLoading(false);
      }
    },
    [address, prices.wbtc, prices.stcore, positions]
  );

  // Debounced price fetching triggered by user input
  const debouncedFetchPrices = useCallback(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout (500ms delay)
    debounceTimeoutRef.current = setTimeout(() => {
      fetchPrices();
      btcPriceCache.refresh();
    }, 500);
  }, [fetchPrices]);

  // Start 15-second interval for price updates
  const startPriceInterval = useCallback(() => {
    // Clear existing interval
    if (priceIntervalRef.current) {
      clearInterval(priceIntervalRef.current);
    }

    // Start new 15-second interval
    priceIntervalRef.current = setInterval(() => {
      fetchPrices();
      btcPriceCache.refresh();
    }, 15000); // 15 seconds
  }, [fetchPrices]);

  // Stop price interval
  const stopPriceInterval = useCallback(() => {
    if (priceIntervalRef.current) {
      clearInterval(priceIntervalRef.current);
      priceIntervalRef.current = null;
    }
  }, []);

  // Dynamic calculations with boost system
  const btcValue = Math.max(0, Number(parseFloat(btcAmount || "0")));
  const coreValue = Math.max(0, parseFloat(coreAmount) || 0);
  const lstbtcValue = Math.max(0, parseFloat(lstbtcAmount) || 0);

  // Calculate boost multipliers based on percentage of available balance used
  const wbtcBalance = parseFloat(getFormattedBalance("wBTC"));
  const stcoreBalance = parseFloat(getFormattedBalance("stCORE"));

  const btcBoost =
    wbtcBalance > 0 ? Math.min(btcValue / wbtcBalance, 1) * 2 : 0; // Max 4x boost
  const coreBoost =
    stcoreBalance > 0 ? Math.min(coreValue / stcoreBalance, 1) * 2 : 0; // Max 4x boost

  // Calculate expected lstBTC based on inputs using oracle prices
  const calculateLstBtc = () => {
    const wbtc = parseFloat(btcAmount) || 0;
    const stcore = parseFloat(coreAmount) || 0;

    if (wbtc === 0 && stcore === 0) return "0.00000";

    // Use a simplified version for UI display - the actual calculation happens in the contract
    // This is just for preview purposes
    return (wbtc * 0.95 + stcore * 0.0001).toFixed(3);
  };

  // Calculate total USD value using dynamic prices
  const calculateTotalValue = () => {
    const wbtc = parseFloat(btcAmount) || 0;
    const stcore = parseFloat(coreAmount) || 0;
    // Use dynamic prices
    return wbtc * prices.wbtc + stcore * prices.stcore;
  };

  // Effects for price management
  useEffect(() => {
    // Initial price fetch
    fetchPrices();

    // Cleanup on unmount
    return () => {
      stopPriceInterval();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchPrices, stopPriceInterval]);

  // Effect to handle price fetching when user starts inputting
  useEffect(() => {
    const hasInput =
      (mode === "deposit" && (btcAmount || coreAmount)) ||
      (mode === "redeem" && lstbtcAmount);

    if (hasInput) {
      // Start price interval and fetch prices
      debouncedFetchPrices();
      startPriceInterval();
    } else {
      // Stop price interval when no input
      stopPriceInterval();
    }
  }, [
    btcAmount,
    coreAmount,
    lstbtcAmount,
    mode,
    debouncedFetchPrices,
    startPriceInterval,
    stopPriceInterval,
  ]);

  // Effect to fetch redeem preview when lstBTC amount changes
  useEffect(() => {
    if (mode === "redeem" && lstbtcValue > 0) {
      fetchRedeemPreview(lstbtcValue);
    } else {
      setRedeemPreview(null);
    }
  }, [mode, lstbtcValue, fetchRedeemPreview]);

  // Effect to update timestamp display every second
  useEffect(() => {
    if (lastPriceUpdate > 0) {
      timestampUpdateRef.current = setInterval(() => {
        forceUpdate({}); // Trigger re-render to update timestamp
      }, 1000);
    }

    return () => {
      if (timestampUpdateRef.current) {
        clearInterval(timestampUpdateRef.current);
      }
    };
  }, [lastPriceUpdate]);

  const handleProceed = async () => {
    if (mode === "deposit") {
      // Validate amounts are not empty for deposit
      if (!btcAmount.trim() && !coreAmount.trim()) {
        toast({
          title: "Amount Required",
          description: "Please enter an amount to deposit",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validate lstBTC amount for redeem
      if (!lstbtcAmount.trim()) {
        toast({
          title: "Amount Required",
          description: "Please enter an amount of lstBTC to redeem",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate amounts are numbers and positive
    if (mode === "deposit") {
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
    } else {
      if (lstbtcAmount && (isNaN(lstbtcValue) || lstbtcValue < 0)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid positive number for lstBTC",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate sufficient balance
    if (mode === "deposit") {
      if (btcValue > wbtcBalance) {
        toast({
          title: "Insufficient wBTC Balance",
          description: "You don't have enough wBTC to deposit this amount",
          variant: "destructive",
        });
        return;
      }
      if (coreValue > stcoreBalance) {
        toast({
          title: "Insufficient stCORE Balance",
          description: "You don't have enough stCORE to deposit this amount",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For redeem, validate against actual lstBTC balance (not local positions)
      const totalLstbtc = positions.reduce(
        (sum, p) => sum + p.lstbtcGenerated,
        0
      );
      if (lstbtcValue > totalLstbtc) {
        toast({
          title: "Insufficient lstBTC",
          description: "You don't have enough lstBTC to redeem this amount",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (!address) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to proceed",
          variant: "destructive",
        });
        return;
      }

      if (mode === "deposit") {
        // ========== DEPOSIT FLOW ==========
        toast({
          title: "Checking Requirements",
          description: "Validating deposit requirements...",
        });

        // Check which tokens need approval
        const wbtcAmt = btcAmount || "0";
        const stcoreAmt = coreAmount || "0";

        if (parseFloat(wbtcAmt) > 0 || parseFloat(stcoreAmt) > 0) {
          toast({
            title: "Checking Approvals",
            description: "Checking current token allowances...",
          });

          const allowances = await checkAllowances(address, wbtcAmt, stcoreAmt);
          // console.log("Current allowances:", allowances);

          const approvalResults: Array<{
            token: string;
            txHash: `0x${string}`;
          }> = [];

          // Approve wBTC if needed
          if (allowances.wbtcNeedsApproval) {
            try {
              toast({
                title: "Approve wBTC",
                description: `Please approve ${wbtcAmt} wBTC spending in your wallet...`,
              });

              const wbtcTx = await approveWBTC(wbtcAmt);
              approvalResults.push({ token: "wBTC", txHash: wbtcTx });

              toast({
                title: "wBTC Approved",
                description: `wBTC approval transaction: ${wbtcTx}`,
              });
            } catch (wbtcError) {
              console.error("wBTC approval failed:", wbtcError);
              toast({
                title: "wBTC Approval Failed",
                description:
                  (wbtcError as Error)?.message || "Failed to approve wBTC",
                variant: "destructive",
              });
              return;
            }
          }

          // Approve stCORE if needed
          if (allowances.stcoreNeedsApproval) {
            try {
              toast({
                title: "Approve stCORE",
                description: `Please approve ${stcoreAmt} stCORE spending in your wallet...`,
              });

              const stcoreTx = await approveStCORE(stcoreAmt);
              approvalResults.push({ token: "stCORE", txHash: stcoreTx });

              toast({
                title: "stCORE Approved",
                description: `stCORE approval transaction: ${stcoreTx}`,
              });
            } catch (stcoreError) {
              console.error("stCORE approval failed:", stcoreError);
              toast({
                title: "stCORE Approval Failed",
                description:
                  (stcoreError as Error)?.message || "Failed to approve stCORE",
                variant: "destructive",
              });
              return;
            }
          }

          if (approvalResults.length > 0) {
            toast({
              title: "All Approvals Complete",
              description: `Approved ${approvalResults.length} token(s). Now executing deposit...`,
            });
          } else {
            toast({
              title: "No Approvals Needed",
              description:
                "Tokens already approved. Proceeding with deposit...",
            });
          }
        }

        // Execute the actual deposit
        toast({
          title: "Executing Deposit",
          description: "Sending deposit transaction...",
        });

        const txHash = await executeDeposit(
          btcAmount || "0",
          coreAmount || "0"
        );

        // console.log("Deposit transaction hash:", txHash);

        // Calculate the actual lstBTC generated using oracle prices
        const lstBTCResult = await calculateLstBTCFromDeposit(
          btcAmount || "0",
          coreAmount || "0"
        );

        // Add position with actual calculated values
        addPosition({
          vaultName: "Famz Vault",
          wbtcDeposited: btcValue,
          stcoreDeposited: coreValue,
          lstbtcGenerated: parseFloat(lstBTCResult.lstBTCAmount),
          currentValue: calculateTotalValue(),
          apy: "12.5%",
        });

        // Clear input fields
        setBtcAmount("");
        setCoreAmount("");

        // Show success modal
        setSuccessTxHash(txHash);
        setShowSuccessModal(true);
      } else {
        // ========== REDEEM FLOW ==========
        toast({
          title: "Checking Redeem Requirements",
          description: "Validating redeem requirements...",
        });

        // Simulate redeem to check for errors
        const redeemSimulation = await simulateRedeemWithChecks(
          address,
          lstbtcAmount
        );

        if (!redeemSimulation.success) {
          toast({
            title: "Redeem Requirements Not Met",
            description:
              (redeemSimulation.error as Error)?.message ||
              "Unknown error occurred",
            variant: "destructive",
          });
          return;
        }

        // console.log("Redeem simulation successful:", redeemSimulation.result);

        // Calculate what user will receive
        const redeemOutput = await calculateRedeemOutput(address, lstbtcAmount);
        // console.log("User will receive:", redeemOutput);

        // Show confirmation modal with calculated output
        setShowRedeemModal(true);
      }
    } catch (error: unknown) {
      console.error(`${mode} error:`, error);
      toast({
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Failed`,
        description:
          (error as Error)?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Function to calculate what wBTC and stCORE user gets from redeeming lstBTC
  const calculateRedeemBreakdown = async (lstbtcToRedeem: number) => {
    try {
      if (address) {
        // Use blockchain data for accurate calculation
        const redeemOutput = await calculateRedeemOutput(
          address,
          lstbtcToRedeem.toString()
        );
        const totalValue =
          parseFloat(redeemOutput.wbtcAmount) * prices.wbtc +
          parseFloat(redeemOutput.stcoreAmount) * prices.stcore;

        return {
          wbtcToReceive: parseFloat(redeemOutput.wbtcAmount),
          stcoreToReceive: parseFloat(redeemOutput.stcoreAmount),
          totalValue,
        };
      }
    } catch (error) {
      console.error(
        "Error calculating redeem breakdown from blockchain:",
        error
      );
    }

    // Fallback to local calculation
    let remainingLstbtc = lstbtcToRedeem;
    let totalWbtcToReceive = 0;
    let totalStcoreToReceive = 0;

    for (const position of positions) {
      if (remainingLstbtc <= 0 || position.lstbtcGenerated <= 0) continue;

      const redeemFromThisPosition = Math.min(
        remainingLstbtc,
        position.lstbtcGenerated
      );
      const redeemRatio = redeemFromThisPosition / position.lstbtcGenerated;

      totalWbtcToReceive += position.wbtcDeposited * redeemRatio;
      totalStcoreToReceive += position.stcoreDeposited * redeemRatio;

      remainingLstbtc -= redeemFromThisPosition;
    }

    return {
      wbtcToReceive: totalWbtcToReceive,
      stcoreToReceive: totalStcoreToReceive,
      totalValue:
        totalWbtcToReceive * prices.wbtc + totalStcoreToReceive * prices.stcore,
    };
  };

  // Function to execute the redeem operation
  const executeRedeem = async () => {
    try {
      if (!address) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Executing Redeem",
        description: "Sending redeem transaction...",
      });

      // Execute the blockchain redeem
      const txHash = await executeVaultRedeem(lstbtcAmount);
      // console.log("Redeem transaction hash:", txHash);

      // Get the actual amounts received
      const redeemOutput = await calculateRedeemOutput(address, lstbtcAmount);

      // Update local positions (remove redeemed amount)
      // const breakdown = calculateRedeemBreakdown(lstbtcValue);
      let remainingLstbtc = lstbtcValue;
      const positionsToUpdate = [...positions];
      const positionsToRemove: string[] = [];

      for (
        let i = 0;
        i < positionsToUpdate.length && remainingLstbtc > 0;
        i++
      ) {
        const position = positionsToUpdate[i];
        if (position.lstbtcGenerated <= 0) continue;

        const redeemFromThisPosition = Math.min(
          remainingLstbtc,
          position.lstbtcGenerated
        );
        const redeemRatio = redeemFromThisPosition / position.lstbtcGenerated;

        // Reduce position amounts proportionally
        position.wbtcDeposited *= 1 - redeemRatio;
        position.stcoreDeposited *= 1 - redeemRatio;
        position.lstbtcGenerated *= 1 - redeemRatio;
        position.currentValue =
          position.wbtcDeposited * prices.wbtc +
          position.stcoreDeposited * prices.stcore;

        remainingLstbtc -= redeemFromThisPosition;

        // Mark for removal if fully redeemed
        if (position.wbtcDeposited < 0.000001 && position.stcoreDeposited < 1) {
          positionsToRemove.push(position.id);
        }
      }

      // Update or remove positions
      const updatedPositions = positionsToUpdate.filter(
        (p) => !positionsToRemove.includes(p.id)
      );

      updatedPositions.forEach((position) => {
        updatePosition(position.id, {
          wbtcDeposited: position.wbtcDeposited,
          stcoreDeposited: position.stcoreDeposited,
          lstbtcGenerated: position.lstbtcGenerated,
          currentValue: position.currentValue,
        });
      });

      positionsToRemove.forEach((positionId) => {
        removePosition(positionId);
      });

      // Clear input and close modal
      setLstbtcAmount("");
      setShowRedeemModal(false);

      // Show success message with actual amounts from blockchain
      toast({
        title: "Redeemed Successfully!",
        description: `Transaction: ${txHash}. Received ${parseFloat(
          redeemOutput.wbtcAmount
        ).toFixed(5)} wBTC and ${parseFloat(
          redeemOutput.stcoreAmount
        ).toLocaleString()} stCORE`,
        variant: "default",
      });

      // Show success modal
      setSuccessTxHash(txHash);
      setShowSuccessModal(true);

      // console.log("Redeem completed successfully");
    } catch (error) {
      console.error("Redeem execution failed:", error);
      toast({
        title: "Redeem Failed",
        description: (error as Error)?.message || "Failed to execute redeem",
        variant: "destructive",
      });
    }
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
        // console.log(
        //   `Marking position ${position.id} for removal - fully withdrawn`
        // );
        positionsToRemove.push(position.id);
      } else {
        // Recalculate lstBTC and current value for remaining position (using dynamic prices)
        const remainingWbtc = position.wbtcDeposited;
        const remainingStcore = position.stcoreDeposited;
        position.lstbtcGenerated =
          remainingWbtc * 0.95 + remainingStcore * 0.0001;
        position.currentValue =
          remainingWbtc * prices.wbtc + remainingStcore * prices.stcore;
      }
    }

    // Note: In real implementation, this would trigger blockchain transactions
    // to return unstaked wBTC and stCORE to user's wallet

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
      // console.log(`Removing position: ${positionId}`);
      removePosition(positionId);
    });

    // console.log("Position updates applied successfully:", {
    //   updated: updatedPositions.length,
    //   removed: positionsToRemove.length,
    //   positionsToRemove: positionsToRemove,
    // });

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

  const handleLstbtcAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setLstbtcAmount(value);
    }
  };

  // Filter valid positions (with non-zero deposits)
  const validPositions = positions.filter(
    (p) => p.wbtcDeposited > 0 || p.stcoreDeposited > 0
  );

  // Max values based on mode
  const maxBtc = mode === "deposit" ? wbtcBalance : 0;
  const maxCore = mode === "deposit" ? stcoreBalance : 0;
  const maxLstbtc =
    mode === "redeem"
      ? positions.reduce((sum, p) => sum + p.lstbtcGenerated, 0)
      : 0;

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
                  onClick={() => setMode("deposit")}
                  className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-300 ${
                    mode === "deposit"
                      ? "bg-primary text-white shadow-lg transform scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  Deposit
                </button>
                <button
                  onClick={() => setMode("redeem")}
                  className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-300 ${
                    mode === "redeem"
                      ? "bg-primary text-white shadow-lg transform scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  Redeem
                </button>
              </div>
            </div>

            {mode === "deposit" ? (
              <>
                {/* wBTC Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      wBTC Deposit Amount:
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Available:{" "}
                      {parseFloat(getFormattedBalance("wBTC")).toFixed(5)} wBTC
                    </span>
                    <div className="flex items-center space-x-1">
                      {priceLoading && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                      <span className={priceLoading ? "opacity-50" : ""}>
                        ${prices.wbtc.toLocaleString()}
                      </span>
                    </div>
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

                {/* stCORE Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      stCORE Deposit Amount:
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Available:{" "}
                      {parseFloat(getFormattedBalance("stCORE")).toFixed(5)}{" "}
                      stCORE
                    </span>
                    <div className="flex items-center space-x-1">
                      {priceLoading && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                      <span className={priceLoading ? "opacity-50" : ""}>
                        ${prices.stcore.toFixed(6)}
                      </span>
                    </div>
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
              </>
            ) : (
              // Redeem Mode - lstBTC Input
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    lstBTC Redeem Amount:
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
                    <span className="text-gold font-bold text-sm">₿</span>
                  </div>
                  <Input
                    id="lstbtc-amount"
                    type="text"
                    value={lstbtcAmount}
                    onChange={handleLstbtcAmountChange}
                    placeholder="0.95"
                    className="bg-muted border-vault-border pr-16 py-6 pl-12"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setLstbtcAmount(maxLstbtc.toString())}
                  >
                    MAX
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Available: {maxLstbtc.toFixed(8)} lstBTC</span>
                  <div className="flex items-center space-x-1">
                    {priceLoading && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                    <span className={priceLoading ? "opacity-50" : ""}>
                      wBTC: ${prices.wbtc.toLocaleString()} | stCORE: $
                      {prices.stcore.toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Redeem Preview */}
                {lstbtcAmount && lstbtcValue > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      You will receive:
                    </p>
                    {redeemPreviewLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Calculating...
                        </span>
                      </div>
                    ) : redeemPreview ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {redeemPreview.wbtcToReceive.toFixed(8)} wBTC
                        </p>
                        <p className="text-sm font-medium">
                          {redeemPreview.stcoreToReceive.toLocaleString()}{" "}
                          stCORE
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ≈ ${redeemPreview.totalValue.toLocaleString()} USD
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Enter amount to see preview
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Proceed Button */}
            <Button
              className="w-full"
              disabled={
                mode === "deposit" ? !btcAmount && !coreAmount : !lstbtcAmount
              }
              size="lg"
              onClick={handleProceed}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              Proceed to {mode === "deposit" ? "Deposit" : "Redeem"}
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
                  {/* {lastPriceUpdate > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        Prices updated{" "}
                        {Math.floor((Date.now() - lastPriceUpdate) / 1000)}s ago
                        {priceLoading && " • Updating..."}
                      </span>
                  </div>
                  )} */}
                </div>
              </div>

              {/* Conversion Preview */}
              {mode === "deposit" && btcAmount && coreAmount && (
                <Card className="p-4 mx-4 bg-gradient-primary/10 border-primary/20">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">wBTC</p>
                        <p className="font-bold">
                          {parseFloat(btcAmount).toFixed(8)}
                        </p>
                      </div>
                      <span className="text-muted-foreground">+</span>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">stCORE</p>
                        <p className="font-bold">
                          {parseFloat(coreAmount).toFixed(5)}
                        </p>
                      </div>
                    </div>
                    <ArrowDown className="w-6 h-6 text-primary mx-auto" />
                    <div className="space-y-1">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Will Generate
                        </p>
                        <p className="text-xl font-bold text-gold">
                          {parseFloat(calculateLstBtc().toString()).toFixed(8)}{" "}
                          lstBTC
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

              {/* Redeem Preview */}
              {mode === "redeem" && lstbtcAmount && lstbtcValue > 0 && (
                <div className="p-3 bg-muted/50 flex flex-col items-center justify-center rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    You will receive:
                  </p>
                  {redeemPreviewLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Calculating...
                      </span>
                    </div>
                  ) : redeemPreview ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {redeemPreview.wbtcToReceive.toFixed(8)} wBTC
                      </p>
                      <p className="text-sm font-medium">
                        {redeemPreview.stcoreToReceive.toLocaleString()} stCORE
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ≈ ${redeemPreview.totalValue.toLocaleString()} USD
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enter amount to see preview
                    </p>
                  )}
                </div>
              )}

              <div className="p-6 space-y-6">
                {mode === "deposit" && (
                  <>
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
                        <Label className="text-sm">
                          Projected Annual Rewards
                        </Label>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-4xl font-bold text-gold">
                          {Number(calculateLstBtc())}K
                        </p>
                        <span className="text-sm text-muted-foreground">
                          LstBTC
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ${calculateTotalValue().toLocaleString()} USD
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {mode === "redeem" && (
                  <div className="space-y-2">
                    <div className="text-center space-y-2">
                      <p className="text-lg text-muted-foreground">
                        Enter lstBTC amount to see what you'll receive
                      </p>
                      {lstbtcValue >= 0 && (
                        <div className="text-2xl font-bold text-gold">
                          Total Available: {maxLstbtc.toFixed(8)} lstBTC
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dual Staking Tiers - Only show for deposit mode */}
                {mode === "deposit" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Dual Staking Tiers:</Label>
                    </div>

                    {/* BTC Staked */}
                    <div className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">wBTC Staked</Label>
                        <Badge variant="outline">
                          {wbtcBalance > 0
                            ? `${((btcValue / wbtcBalance) * 100).toFixed(
                                0
                              )}% (${btcBoost.toFixed(1)}x boost)`
                            : "0% (0x boost)"}
                        </Badge>
                      </div>
                      <div className="relative">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>
                            {wbtcBalance > 0
                              ? (wbtcBalance * 0.25).toFixed(3)
                              : "0"}
                          </span>
                          <span>
                            {wbtcBalance > 0
                              ? (wbtcBalance * 0.5).toFixed(3)
                              : "0"}
                          </span>
                          <span>
                            {wbtcBalance > 0
                              ? (wbtcBalance * 0.75).toFixed(3)
                              : "0"}
                          </span>
                          <span>
                            {wbtcBalance > 0 ? wbtcBalance.toFixed(3) : "0"}
                          </span>
                        </div>
                        <Slider
                          value={[
                            wbtcBalance > 0
                              ? Math.min((btcValue / wbtcBalance) * 100, 100)
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
                          {stcoreBalance > 0
                            ? `${((coreValue / stcoreBalance) * 100).toFixed(
                                0
                              )}% (${coreBoost.toFixed(1)}x boost)`
                            : "0% (0x boost)"}
                        </Badge>
                      </div>
                      <div className="relative">
                        <div className="flex justify-between text-xs text-muted-foreground  mb-1">
                          <span>
                            {stcoreBalance > 0
                              ? Math.round(stcoreBalance * 0.25)
                              : "0"}
                          </span>
                          <span>
                            {stcoreBalance > 0
                              ? Math.round(stcoreBalance * 0.5)
                              : "0"}
                          </span>
                          <span>
                            {stcoreBalance > 0
                              ? Math.round(stcoreBalance * 0.75)
                              : "0"}
                          </span>
                          <span>
                            {stcoreBalance > 0
                              ? Math.round(stcoreBalance)
                              : "0"}
                          </span>
                        </div>
                        <Slider
                          value={[
                            stcoreBalance > 0
                              ? Math.min((coreValue / stcoreBalance) * 100, 100)
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
                            {coreValue > 0 ? coreValue.toFixed(5) : 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  No vault positions found. Use the deposit feature above to get
                  started.
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

      {/* Redeem Confirmation Modal */}
      <Dialog open={showRedeemModal} onOpenChange={setShowRedeemModal}>
        <DialogContent className="sm:max-w-lg bg-vault-card border-vault-border">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-gold">₿</span>
              <span>Confirm Redeem</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Redeem Summary */}
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                You are redeeming
              </div>
              <div className="text-2xl font-bold text-gold">
                {lstbtcValue.toFixed(8)} lstBTC
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="w-6 h-6 text-primary" />
            </div>

            {/* Redeem Preview in Modal */}
            {redeemPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BitcoinIcon size="sm" />
                    <span className="font-medium">wBTC</span>
                  </div>
                  <span className="font-bold">
                    {redeemPreview.wbtcToReceive.toFixed(8)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CoreIcon size="sm" />
                    <span className="font-medium">stCORE</span>
                  </div>
                  <span className="font-bold">
                    {redeemPreview.stcoreToReceive.toLocaleString()}
                  </span>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground">
                    Total Value
                  </div>
                  <div className="text-lg font-bold text-gold">
                    ≈ ${redeemPreview.totalValue.toLocaleString()} USD
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRedeemModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={executeRedeem} className="flex-1">
                Confirm Redeem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        txHash={successTxHash}
        title={mode === "deposit" ? "Deposit Completed" : "Redeem Completed"}
        description={
          mode === "deposit"
            ? "Your deposit has been successfully processed and lstBTC has been generated!"
            : "Your redeem has been successfully processed and wBTC and stCORE have been generated!"
        }
      />
    </div>
  );
};

export default Vaults;
