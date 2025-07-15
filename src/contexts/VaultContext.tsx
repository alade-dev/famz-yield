import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface VaultContextType {
  positions: VaultPosition[];
  addPosition: (position: Omit<VaultPosition, 'id' | 'depositDate' | 'earnings'>) => void;
  updateEarnings: () => void;
  getTotalDeposited: () => number;
  getTotalEarnings: () => number;
  getTotalValue: () => number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [positions, setPositions] = useState<VaultPosition[]>([]);

  // Load positions from localStorage on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('vaultPositions');
    if (savedPositions) {
      setPositions(JSON.parse(savedPositions));
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vaultPositions', JSON.stringify(positions));
  }, [positions]);

  // Update earnings based on time elapsed and APY
  const updateEarnings = () => {
    setPositions(currentPositions => 
      currentPositions.map(position => {
        const depositDate = new Date(position.depositDate);
        const now = new Date();
        const daysSinceDeposit = (now.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Calculate earnings based on APY
        const apyNumber = parseFloat(position.apy.replace('%', ''));
        const dailyRate = apyNumber / 365 / 100;
        const earnings = position.currentValue * dailyRate * daysSinceDeposit;
        
        return {
          ...position,
          earnings: Math.max(0, earnings),
          currentValue: position.currentValue + earnings
        };
      })
    );
  };

  const addPosition = (positionData: Omit<VaultPosition, 'id' | 'depositDate' | 'earnings'>) => {
    const newPosition: VaultPosition = {
      ...positionData,
      id: Date.now().toString(),
      depositDate: new Date().toISOString(),
      earnings: 0
    };
    
    setPositions(prev => [...prev, newPosition]);
  };

  const getTotalDeposited = () => {
    return positions.reduce((total, position) => total + position.currentValue - position.earnings, 0);
  };

  const getTotalEarnings = () => {
    return positions.reduce((total, position) => total + position.earnings, 0);
  };

  const getTotalValue = () => {
    return positions.reduce((total, position) => total + position.currentValue, 0);
  };

  // Update earnings every minute
  useEffect(() => {
    const interval = setInterval(updateEarnings, 60000);
    updateEarnings(); // Initial update
    return () => clearInterval(interval);
  }, []);

  return (
    <VaultContext.Provider value={{
      positions,
      addPosition,
      updateEarnings,
      getTotalDeposited,
      getTotalEarnings,
      getTotalValue
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};