import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSecureStorage } from "@/lib/secureStorage";

interface VaultPosition {
  id: string;
  vaultName: string;
  wbtcDeposited: number;
  stcoreDeposited: number;
  lstbtcGenerated: number;
  depositDate: string;
  initialValue: number; // Store the initial deposit value separately
  currentValue: number;
  earnings: number;
  apy: string;
  wbtcEarnings: number; // Earnings in wBTC from lstBTC
  stcoreEarnings: number; // Earnings in stCORE from lstBTC
  lastEarningsUpdate: string; // Track when earnings were last calculated
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
    position: Omit<
      VaultPosition,
      | "id"
      | "depositDate"
      | "earnings"
      | "wbtcEarnings"
      | "stcoreEarnings"
      | "initialValue"
      | "lastEarningsUpdate"
    >
  ) => void;
  updateEarnings: () => void;
  getTotalDeposited: () => number;
  getTotalEarnings: () => number;
  getTotalValue: () => number;
  userBalances: { wbtc: number; stcore: number };
  setUserBalances: React.Dispatch<
    React.SetStateAction<{ wbtc: number; stcore: number }>
  >;
  closeVault: (id: string) => void;
  earningsHistory: EarningsHistory[];
  getTotalWbtcEarnings: () => number;
  getTotalStcoreEarnings: () => number;
  isWalletConnected: boolean;
  isDataLoaded: boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isConnected, address } = useAccount();
  const { getSecureItem, setSecureItem, isWalletConnected } =
    useSecureStorage();

  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [userBalances, setUserBalances] = useState<{
    wbtc: number;
    stcore: number;
  }>({ wbtc: 0, stcore: 0 });
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Define expected data structures for validation
  const expectedVaultPosition: VaultPosition = {
    id: "",
    vaultName: "",
    wbtcDeposited: 0,
    stcoreDeposited: 0,
    lstbtcGenerated: 0,
    depositDate: "",
    initialValue: 0,
    currentValue: 0,
    earnings: 0,
    apy: "",
    wbtcEarnings: 0,
    stcoreEarnings: 0,
    lastEarningsUpdate: "",
  };

  const expectedEarningsHistory: EarningsHistory = {
    id: "",
    vaultId: "",
    date: "",
    wbtcEarned: 0,
    stcoreEarned: 0,
    lstbtcValue: 0,
  };

  const expectedUserBalances = { wbtc: 0, stcore: 0 };

  // Load data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      // First, attempt to migrate any existing unsecured data
      const migrateOldData = () => {
        const oldKeys = ["vaultPositions", "userBalances", "earningsHistory"];
        let migrated = false;

        oldKeys.forEach((key) => {
          const oldData = localStorage.getItem(key);
          if (oldData) {
            try {
              const parsedData = JSON.parse(oldData);
              setSecureItem(key, parsedData);
              localStorage.removeItem(key); // Remove old unsecured data
              migrated = true;
            } catch (error) {
              console.error(`Failed to migrate ${key}:`, error);
            }
          }
        });

        return migrated;
      };

      // Migrate old data if it exists
      const wasMigrated = migrateOldData();

      // Load positions with validation
      const loadedPositions = getSecureItem<VaultPosition[]>(
        "vaultPositions",
        [],
        [expectedVaultPosition]
      );

      // Load balances with validation
      const loadedBalances = getSecureItem(
        "userBalances",
        { wbtc: 1.0, stcore: 10000 }, // Default balances for new users
        expectedUserBalances
      );

      // Load earnings history with validation
      const loadedEarningsHistory = getSecureItem<EarningsHistory[]>(
        "earningsHistory",
        [],
        [expectedEarningsHistory]
      );

      setPositions(loadedPositions);
      setUserBalances(loadedBalances);
      setEarningsHistory(loadedEarningsHistory);
      setIsDataLoaded(true);

      // Show migration success message if data was migrated
      if (wasMigrated) {
        console.log("Successfully migrated data to secure storage");
      }
    } else {
      // Clear data when wallet disconnects
      setPositions([]);
      setUserBalances({ wbtc: 0, stcore: 0 });
      setEarningsHistory([]);
      setIsDataLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, getSecureItem, setSecureItem]);

  // Save positions to secure storage whenever they change (only if wallet connected)
  useEffect(() => {
    if (isConnected && address && isDataLoaded) {
      setSecureItem("vaultPositions", positions);
    }
  }, [positions, isConnected, address, isDataLoaded, setSecureItem]);

  // Save balances to secure storage whenever they change (only if wallet connected)
  useEffect(() => {
    if (isConnected && address && isDataLoaded) {
      setSecureItem("userBalances", userBalances);
    }
  }, [userBalances, isConnected, address, isDataLoaded, setSecureItem]);

  // Save earnings history to secure storage whenever it changes (only if wallet connected)
  useEffect(() => {
    if (isConnected && address && isDataLoaded) {
      setSecureItem("earningsHistory", earningsHistory);
    }
  }, [earningsHistory, isConnected, address, isDataLoaded, setSecureItem]);

  // Update earnings based on time elapsed and APY
  const updateEarnings = () => {
    if (!isConnected || !isDataLoaded) return;

    setPositions((currentPositions) =>
      currentPositions.map((position) => {
        const depositDate = new Date(position.depositDate);
        const now = new Date();

        // Round to nearest hour to prevent micro-fluctuations
        const hoursElapsed = Math.floor(
          (now.getTime() - depositDate.getTime()) / (1000 * 60 * 60)
        );
        const daysSinceDeposit = hoursElapsed / 24;

        // Calculate earnings based on APY using initial value (not current value)
        const apyNumber = parseFloat(position.apy.replace("%", ""));
        const dailyRate = apyNumber / 365 / 100;
        const initialValue =
          position.initialValue ||
          position.wbtcDeposited * 43000 + position.stcoreDeposited;

        // Round earnings to prevent micro-fluctuations
        const totalEarnings =
          Math.round(initialValue * dailyRate * daysSinceDeposit * 100) / 100;

        // Calculate proportional earnings for wBTC and stCORE based on lstBTC
        const originalDeposit =
          position.wbtcDeposited * 43000 + position.stcoreDeposited;
        const wbtcProportion =
          (position.wbtcDeposited * 43000) / originalDeposit;
        const stcoreProportion = position.stcoreDeposited / originalDeposit;

        // Convert lstBTC earnings to wBTC and stCORE equivalents with rounding
        const lstbtcEarnings =
          position.lstbtcGenerated * dailyRate * daysSinceDeposit;
        const wbtcEarnings =
          Math.round(lstbtcEarnings * wbtcProportion * 1000000) / 1000000; // Round to 6 decimals
        const stcoreEarnings =
          Math.round(lstbtcEarnings * stcoreProportion * 43000 * 100) / 100; // Round to 2 decimals

        return {
          ...position,
          initialValue, // Ensure we have the initial value stored
          earnings: Math.max(0, totalEarnings),
          wbtcEarnings: Math.max(0, wbtcEarnings),
          stcoreEarnings: Math.max(0, stcoreEarnings),
          currentValue: Math.round((initialValue + totalEarnings) * 100) / 100, // Round current value
          lastEarningsUpdate: now.toISOString(),
        };
      })
    );
  };

  const addPosition = (
    positionData: Omit<
      VaultPosition,
      | "id"
      | "depositDate"
      | "earnings"
      | "wbtcEarnings"
      | "stcoreEarnings"
      | "initialValue"
      | "lastEarningsUpdate"
    >
  ) => {
    if (!isConnected || !isDataLoaded) {
      console.warn(
        "Cannot add position: wallet not connected or data not loaded"
      );
      return;
    }

    const initialValue =
      positionData.wbtcDeposited * 43000 + positionData.stcoreDeposited;
    const newPosition: VaultPosition = {
      ...positionData,
      id: Date.now().toString(),
      depositDate: new Date().toISOString(),
      initialValue,
      earnings: 0,
      wbtcEarnings: 0,
      stcoreEarnings: 0,
      lastEarningsUpdate: new Date().toISOString(),
    };

    setPositions((prev) => [...prev, newPosition]);
  };

  const getTotalWbtcEarnings = () => {
    if (!isConnected || !isDataLoaded) return 0;
    return positions.reduce(
      (total, position) => total + position.wbtcEarnings,
      0
    );
  };

  const getTotalStcoreEarnings = () => {
    if (!isConnected || !isDataLoaded) return 0;
    return positions.reduce(
      (total, position) => total + position.stcoreEarnings,
      0
    );
  };

  const getTotalDeposited = () => {
    if (!isConnected || !isDataLoaded) return 0;
    return positions.reduce(
      (total, position) => total + position.currentValue - position.earnings,
      0
    );
  };

  const getTotalEarnings = () => {
    if (!isConnected || !isDataLoaded) return 0;
    return positions.reduce((total, position) => total + position.earnings, 0);
  };

  const getTotalValue = () => {
    if (!isConnected || !isDataLoaded) return 0;
    return positions.reduce(
      (total, position) => total + position.currentValue,
      0
    );
  };

  // Update earnings every 10 minutes (only if wallet connected) - reduced frequency for stability
  useEffect(() => {
    if (isConnected && isDataLoaded) {
      const interval = setInterval(updateEarnings, 10 * 60 * 1000); // 10 minutes
      updateEarnings(); // Initial update
      return () => clearInterval(interval);
    }
  }, [isConnected, isDataLoaded]);

  const closeVault = (id: string) => {
    if (!isConnected || !isDataLoaded) {
      console.warn(
        "Cannot close vault: wallet not connected or data not loaded"
      );
      return;
    }

    setPositions((prev) => {
      const pos = prev.find((p) => p.id === id);
      if (!pos) return prev;

      // Add earnings to history
      const earningRecord: EarningsHistory = {
        id: Date.now().toString(),
        vaultId: pos.id,
        date: new Date().toISOString(),
        wbtcEarned: pos.wbtcEarnings,
        stcoreEarned: pos.stcoreEarnings,
        lstbtcValue: pos.lstbtcGenerated,
      };
      setEarningsHistory((prev) => [...prev, earningRecord]);

      // Credit user with original deposits plus earnings from lstBTC
      setUserBalances((bal) => ({
        wbtc: bal.wbtc + pos.wbtcDeposited + pos.wbtcEarnings,
        stcore: bal.stcore + pos.stcoreDeposited + pos.stcoreEarnings,
      }));

      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <VaultContext.Provider
      value={{
        positions,
        addPosition,
        updateEarnings,
        getTotalDeposited,
        getTotalEarnings,
        getTotalValue,
        userBalances,
        setUserBalances,
        closeVault,
        earningsHistory,
        getTotalWbtcEarnings,
        getTotalStcoreEarnings,
        isWalletConnected,
        isDataLoaded,
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
