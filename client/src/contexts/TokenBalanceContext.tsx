/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, ReactNode } from "react";
import { useTokenBalances, TokenBalance } from "@/hooks/useTokenBalances";

interface TokenBalanceContextType {
  tokens: TokenBalance[];
  isLoading: boolean;
  isConnected: boolean;
  refetch: () => void;
  nativeBalance: {
    balance: string;
    isLoading: boolean;
  };
  // Helper functions to get specific token data
  getTokenBySymbol: (symbol: string) => TokenBalance | undefined;
  getTokenBalance: (symbol: string) => string;
  getFormattedBalance: (symbol: string) => string;
  hasTokens: boolean;
}

const TokenBalanceContext = createContext<TokenBalanceContextType | undefined>(
  undefined
);

interface TokenBalanceProviderProps {
  children: ReactNode;
}

export const TokenBalanceProvider: React.FC<TokenBalanceProviderProps> = ({
  children,
}) => {
  const tokenData = useTokenBalances();

  // Helper function to get token by symbol
  const getTokenBySymbol = (symbol: string): TokenBalance | undefined => {
    return tokenData.tokens.find(
      (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  };

  // Helper function to get raw balance
  const getTokenBalance = (symbol: string): string => {
    const token = getTokenBySymbol(symbol);
    return token?.balance || "0";
  };

  // Helper function to get formatted balance
  const getFormattedBalance = (symbol: string): string => {
    const token = getTokenBySymbol(symbol);
    return token?.formattedBalance || "0";
  };

  // Check if user has any tokens
  const hasTokens = tokenData.tokens.some(
    (token) => parseFloat(token.formattedBalance) > 0
  );

  const contextValue: TokenBalanceContextType = {
    ...tokenData,
    getTokenBySymbol,
    getTokenBalance,
    getFormattedBalance,
    hasTokens,
  };

  return (
    <TokenBalanceContext.Provider value={contextValue}>
      {children}
    </TokenBalanceContext.Provider>
  );
};

export const useTokenBalanceContext = (): TokenBalanceContextType => {
  const context = useContext(TokenBalanceContext);
  if (context === undefined) {
    throw new Error(
      "useTokenBalanceContext must be used within a TokenBalanceProvider"
    );
  }
  return context;
};

// Custom hooks for specific tokens
export const useWBTCBalance = () => {
  const { getTokenBySymbol, getFormattedBalance } = useTokenBalanceContext();
  const token = getTokenBySymbol("wBTC");
  return {
    balance: getFormattedBalance("wBTC"),
    rawBalance: token?.balance || "0",
    isLoading: token?.isLoading || false,
    token,
  };
};

export const useStCOREBalance = () => {
  const { getTokenBySymbol, getFormattedBalance } = useTokenBalanceContext();
  const token = getTokenBySymbol("stCORE");
  return {
    balance: getFormattedBalance("stCORE"),
    rawBalance: token?.balance || "0",
    isLoading: token?.isLoading || false,
    token,
  };
};

export const useLstBTCBalance = () => {
  const { getTokenBySymbol, getFormattedBalance } = useTokenBalanceContext();
  const token = getTokenBySymbol("lstBTC");
  return {
    balance: getFormattedBalance("lstBTC"),
    rawBalance: token?.balance || "0",
    isLoading: token?.isLoading || false,
    token,
  };
};

export const useCOREBalance = () => {
  const { nativeBalance } = useTokenBalanceContext();
  return {
    balance: nativeBalance.balance,
    isLoading: nativeBalance.isLoading,
  };
};
