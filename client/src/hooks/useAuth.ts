/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already authenticated and handle wallet connection changes
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (isConnected && address) {
      // Wallet is connected
      if (token) {
        // User has a token, check if it's still valid
        setIsAuthenticated(true);
      } else {
        // No token, auto-authenticate
        authenticate();
      }
    } else {
      // Wallet is disconnected, logout
      if (isAuthenticated) {
        authAPI.logout();
        setIsAuthenticated(false);
      }
    }
  }, [isConnected, address, isAuthenticated]);

  // Authenticate user
  const authenticate = useCallback(async () => {
    if (!address || !isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Get nonce from server
      const { message } = await authAPI.getNonce(address);

      // Sign message with wallet
      const signature = await signMessageAsync({ message });

      // Verify signature on server
      const { token, user } = await authAPI.verify(address, message, signature);

      setIsAuthenticated(true);
      toast({
        title: "Authentication successful",
        description: `Welcome back, ${user.walletAddress.slice(
          0,
          6
        )}...${user.walletAddress.slice(-4)}`,
      });

      return true;
    } catch (error) {
      console.error("Authentication failed:", error);
      toast({
        title: "Authentication failed",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, signMessageAsync, toast]);

  // Logout
  const logout = useCallback(() => {
    authAPI.logout();
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  }, [toast]);

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    address,
  };
};
