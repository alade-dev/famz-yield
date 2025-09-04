/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAccount } from "wagmi";
import { useTokenBalanceContext } from "./TokenBalanceContext";
import { calculateRedeemAvailability } from "@/scripts/epochHelpers";
import { vaultAPI, transactionAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Types remain the same
interface VaultPosition {
  id: string;
  vaultName: string;
  wbtcDeposited: number;
  stcoreDeposited: number;
  lstbtcGenerated: number;
  depositDate: string;
  initialValue: number;
  currentValue: number;
  earnings: number;
  apy: string;
  wbtcEarnings: number;
  stcoreEarnings: number;
  lastEarningsUpdate: string;
}

interface EarningsHistory {
  id: string;
  vaultId: string;
  date: string;
  wbtcEarned: number;
  stcoreEarned: number;
  lstbtcValue: number;
}

interface VaultContextType {
  positions: VaultPosition[];
  addPosition: (
    position: Omit<VaultPosition, "id" | "depositDate" | "lastEarningsUpdate">
  ) => Promise<void>;
  updatePosition: (
    id: string,
    updates: Partial<VaultPosition>
  ) => Promise<void>;
  removePosition: (id: string) => Promise<void>;
  updateEarnings: () => Promise<void>;
  getTotalDeposited: () => { wbtc: number; stcore: number };
  getTotalEarnings: () => number;
  getTotalValue: () => number;
  closeVault: (id: string) => Promise<void>;
  earningsHistory: EarningsHistory[];
  getTotalWbtcEarnings: () => number;
  getTotalStcoreEarnings: () => number;
  isWalletConnected: boolean;
  isDataLoaded: boolean;
  canDeposit: (wbtcAmount: number, stcoreAmount: number) => boolean;
  getAvailableBalance: (symbol: string) => string;
  transactions: any[];
  addDepositTransaction: (transaction: any) => Promise<void>;
  addRedeemTransaction: (transaction: any) => Promise<void>;
  updateTransactionStatus: (id: string, status: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { getFormattedBalance, isConnected: tokenContextConnected } =
    useTokenBalanceContext();

  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from API when authenticated
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      loadUserData();
    } else {
      // Clear data when not authenticated
      setPositions([]);
      setTransactions([]);
      setEarningsHistory([]);
      setIsDataLoaded(false);
    }
  }, [isAuthenticated, isConnected]);

  const loadUserData = async () => {
    try {
      const [positionsData, transactionsData, earningsData] = await Promise.all(
        [
          vaultAPI.getPositions(),
          transactionAPI.getTransactions(),
          vaultAPI.getEarningsHistory(),
        ]
      );

      setPositions(positionsData);
      setTransactions(transactionsData);
      setEarningsHistory(earningsData);
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load your vault data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addPosition = useCallback(
    async (
      position: Omit<VaultPosition, "id" | "depositDate" | "lastEarningsUpdate">
    ) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication required",
          description: "Please authenticate to save your position",
          variant: "destructive",
        });
        return;
      }

      try {
        const newPosition = await vaultAPI.savePosition({
          ...position,
          depositDate: new Date().toISOString(),
          lastEarningsUpdate: new Date().toISOString(),
        });

        setPositions((prev) => [...prev, newPosition]);
      } catch (error) {
        console.error("Error saving position:", error);
        toast({
          title: "Error saving position",
          description: "Failed to save your position. Please try again.",
          variant: "destructive",
        });
      }
    },
    [isAuthenticated, toast]
  );

  const updatePosition = useCallback(
    async (id: string, updates: Partial<VaultPosition>) => {
      if (!isAuthenticated) return;

      try {
        const updated = await vaultAPI.savePosition({
          id,
          ...updates,
        });

        setPositions((prev) =>
          prev.map((pos) => (pos.id === id ? { ...pos, ...updated } : pos))
        );
      } catch (error) {
        console.error("Error updating position:", error);
      }
    },
    [isAuthenticated]
  );

  const removePosition = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      try {
        await vaultAPI.closePosition(id);
        setPositions((prev) => prev.filter((pos) => pos.id !== id));
      } catch (error) {
        console.error("Error removing position:", error);
      }
    },
    [isAuthenticated]
  );

  const updateEarnings = useCallback(async () => {
    if (!isAuthenticated || !isDataLoaded) return;

    try {
      // Update earnings for all positions
      const updates = positions.map(async (position) => {
        // Calculate new earnings (simplified)
        const daysSinceDeposit =
          (Date.now() - new Date(position.depositDate).getTime()) /
          (1000 * 60 * 60 * 24);
        const apyNumber = parseFloat(position.apy.replace("%", ""));
        const dailyRate = apyNumber / 365 / 100;
        const totalEarnings =
          position.initialValue * dailyRate * daysSinceDeposit;

        return vaultAPI.updateEarnings(position.id, {
          earnings: totalEarnings,
          currentValue: position.initialValue + totalEarnings,
          wbtcEarnings: position.wbtcEarnings,
          stcoreEarnings: position.stcoreEarnings,
        });
      });

      await Promise.all(updates);
      await loadUserData(); // Reload data
    } catch (error) {
      console.error("Error updating earnings:", error);
    }
  }, [isAuthenticated, isDataLoaded, positions]);

  const addDepositTransaction = useCallback(
    async (transaction: any) => {
      if (!isAuthenticated) return;

      try {
        const newTransaction = await transactionAPI.createTransaction({
          ...transaction,
          type: "DEPOSIT",
        });

        setTransactions((prev) => [newTransaction, ...prev]);
      } catch (error) {
        console.error("Error saving transaction:", error);
      }
    },
    [isAuthenticated]
  );

  const addRedeemTransaction = useCallback(
    async (transaction: any) => {
      if (!isAuthenticated) return;

      try {
        const redeemInfo = calculateRedeemAvailability(transaction.timestamp);
        const newTransaction = await transactionAPI.createTransaction({
          ...transaction,
          type: "REDEEM",
          epochRound: redeemInfo.epochRound,
          epochEndTime: redeemInfo.epochEndTime,
          tokensAvailable: redeemInfo.tokensAvailable,
          status: redeemInfo.tokensAvailable ? "COMPLETED" : "PENDING",
        });

        setTransactions((prev) => [newTransaction, ...prev]);
      } catch (error) {
        console.error("Error saving transaction:", error);
      }
    },
    [isAuthenticated]
  );

  const updateTransactionStatus = useCallback(
    async (id: string, status: string) => {
      if (!isAuthenticated) return;

      try {
        await transactionAPI.updateStatus(id, status);
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
        );
      } catch (error) {
        console.error("Error updating transaction:", error);
      }
    },
    [isAuthenticated]
  );

  const refreshTransactions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Refresh epochs on server
      await transactionAPI.refreshEpochs();
      // Reload transactions
      const updatedTransactions = await transactionAPI.getTransactions();
      setTransactions(updatedTransactions);
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    }
  }, [isAuthenticated]);

  const closeVault = useCallback(
    async (id: string) => {
      await removePosition(id);
    },
    [removePosition]
  );

  // Helper functions
  const canDeposit = useCallback(
    (wbtcAmount: number, stcoreAmount: number): boolean => {
      if (!tokenContextConnected) return false;

      const wbtcBalance = parseFloat(getFormattedBalance("wBTC"));
      const stcoreBalance = parseFloat(getFormattedBalance("stCORE"));

      return wbtcBalance >= wbtcAmount && stcoreBalance >= stcoreAmount;
    },
    [tokenContextConnected, getFormattedBalance]
  );

  const getAvailableBalance = useCallback(
    (symbol: string): string => {
      if (!tokenContextConnected) return "0";
      return getFormattedBalance(symbol);
    },
    [tokenContextConnected, getFormattedBalance]
  );

  const getTotalDeposited = useCallback(() => {
    return positions.reduce(
      (acc, pos) => ({
        wbtc: acc.wbtc + pos.wbtcDeposited,
        stcore: acc.stcore + pos.stcoreDeposited,
      }),
      { wbtc: 0, stcore: 0 }
    );
  }, [positions]);

  const getTotalEarnings = useCallback(() => {
    return positions.reduce((acc, pos) => acc + pos.earnings, 0);
  }, [positions]);

  const getTotalValue = useCallback(() => {
    return positions.reduce((acc, pos) => acc + pos.currentValue, 0);
  }, [positions]);

  const getTotalWbtcEarnings = useCallback(() => {
    return positions.reduce((acc, pos) => acc + pos.wbtcEarnings, 0);
  }, [positions]);

  const getTotalStcoreEarnings = useCallback(() => {
    return positions.reduce((acc, pos) => acc + pos.stcoreEarnings, 0);
  }, [positions]);

  return (
    <VaultContext.Provider
      value={{
        positions,
        addPosition,
        updatePosition,
        removePosition,
        updateEarnings,
        getTotalDeposited,
        getTotalEarnings,
        getTotalValue,
        closeVault,
        earningsHistory,
        getTotalWbtcEarnings,
        getTotalStcoreEarnings,
        isWalletConnected: isConnected,
        isDataLoaded,
        canDeposit,
        getAvailableBalance,
        transactions,
        addDepositTransaction,
        addRedeemTransaction,
        updateTransactionStatus,
        refreshTransactions,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};
