import React, { createContext, useContext, useState, useEffect } from "react";

interface VaultPosition {
  id: string;
  vaultName: string;
  wbtcDeposited: number;
  stcoreDeposited: number;
  lstbtcGenerated: number;
  depositDate: string;
  currentValue: number;
  earnings: number;
  apy: string;
  wbtcEarnings: number; // Earnings in wBTC from lstBTC
  stcoreEarnings: number; // Earnings in stCORE from lstBTC
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
      "id" | "depositDate" | "earnings" | "wbtcEarnings" | "stcoreEarnings"
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
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [userBalances, setUserBalances] = useState<{
    wbtc: number;
    stcore: number;
  }>(() => {
    const saved = localStorage.getItem("userBalances");
    return saved ? JSON.parse(saved) : { wbtc: 1.0, stcore: 10000 };
  });
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>(
    () => {
      const saved = localStorage.getItem("earningsHistory");
      return saved ? JSON.parse(saved) : [];
    }
  );

  // Load positions from localStorage on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem("vaultPositions");
    if (savedPositions) {
      setPositions(JSON.parse(savedPositions));
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("vaultPositions", JSON.stringify(positions));
  }, [positions]);

  // Save balances to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userBalances", JSON.stringify(userBalances));
  }, [userBalances]);

  // Save earnings history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("earningsHistory", JSON.stringify(earningsHistory));
  }, [earningsHistory]);

  // Update earnings based on time elapsed and APY
  const updateEarnings = () => {
    setPositions((currentPositions) =>
      currentPositions.map((position) => {
        const depositDate = new Date(position.depositDate);
        const now = new Date();
        const daysSinceDeposit =
          (now.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24);

        // Calculate earnings based on APY
        const apyNumber = parseFloat(position.apy.replace("%", ""));
        const dailyRate = apyNumber / 365 / 100;
        const totalEarnings =
          position.currentValue * dailyRate * daysSinceDeposit;

        // Calculate proportional earnings for wBTC and stCORE based on lstBTC
        const originalDeposit =
          position.wbtcDeposited * 43000 + position.stcoreDeposited;
        const wbtcProportion =
          (position.wbtcDeposited * 43000) / originalDeposit;
        const stcoreProportion = position.stcoreDeposited / originalDeposit;

        // Convert lstBTC earnings to wBTC and stCORE equivalents
        const lstbtcEarnings =
          position.lstbtcGenerated * dailyRate * daysSinceDeposit;
        const wbtcEarnings = lstbtcEarnings * wbtcProportion;
        const stcoreEarnings = lstbtcEarnings * stcoreProportion * 43000; // Convert to stCORE value

        return {
          ...position,
          earnings: Math.max(0, totalEarnings),
          wbtcEarnings: Math.max(0, wbtcEarnings),
          stcoreEarnings: Math.max(0, stcoreEarnings),
          currentValue: position.currentValue + totalEarnings,
        };
      })
    );
  };

  const addPosition = (
    positionData: Omit<
      VaultPosition,
      "id" | "depositDate" | "earnings" | "wbtcEarnings" | "stcoreEarnings"
    >
  ) => {
    const newPosition: VaultPosition = {
      ...positionData,
      id: Date.now().toString(),
      depositDate: new Date().toISOString(),
      earnings: 0,
      wbtcEarnings: 0,
      stcoreEarnings: 0,
    };

    setPositions((prev) => [...prev, newPosition]);
  };

  const getTotalWbtcEarnings = () => {
    return positions.reduce(
      (total, position) => total + position.wbtcEarnings,
      0
    );
  };

  const getTotalStcoreEarnings = () => {
    return positions.reduce(
      (total, position) => total + position.stcoreEarnings,
      0
    );
  };

  const getTotalDeposited = () => {
    return positions.reduce(
      (total, position) => total + position.currentValue - position.earnings,
      0
    );
  };

  const getTotalEarnings = () => {
    return positions.reduce((total, position) => total + position.earnings, 0);
  };

  const getTotalValue = () => {
    return positions.reduce(
      (total, position) => total + position.currentValue,
      0
    );
  };

  // Update earnings every minute
  useEffect(() => {
    const interval = setInterval(updateEarnings, 60000);
    updateEarnings(); // Initial update
    return () => clearInterval(interval);
  }, []);

  const closeVault = (id: string) => {
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
