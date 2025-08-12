import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { parseUnits } from "viem";
import { useToast } from "@/hooks/use-toast";
import {
  CONTRACT_ADDRESSES,
  MOCK_WBTC_ABI,
  DEFAULT_WBTC_MINT_AMOUNT,
} from "@/config/contracts";

// Rate limiting storage key
const RATE_LIMIT_STORAGE_KEY = "wbtc_mint_timestamps";

interface MintTimestamp {
  address: string;
  timestamp: number;
  chainId: number;
}

export const useWBTCMint = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | undefined>();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();

  const {
    writeContract,
    data: hash,
    error,
    isPending,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTransactionError,
    error: transactionError,
  } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}` | undefined,
  });

  // Track transaction hash changes
  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
    }
  }, [hash]);

  // Handle transaction errors and cancellations
  useEffect(() => {
    if (error || isTransactionError) {
      setIsLoading(false);
      setTransactionHash(undefined);

      // Check if it's a user rejection/cancellation
      const errorMessage = error?.message || transactionError?.message || "";
      const isUserRejection =
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("user denied") ||
        errorMessage.includes("Transaction was cancelled") ||
        errorMessage.includes("cancelled");

      if (isUserRejection) {
        toast({
          title: "Transaction Cancelled",
          description: "Transaction was cancelled by user.",
          variant: "default",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: errorMessage || "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }

      // Reset the contract write state
      reset();
    }
  }, [error, isTransactionError, transactionError, toast, reset]);

  // Rate limiting functions
  const getMintTimestamps = useCallback((): MintTimestamp[] => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveMintTimestamp = useCallback(
    (address: string, chainId: number) => {
      const timestamps = getMintTimestamps();
      const newTimestamp: MintTimestamp = {
        address: address.toLowerCase(),
        timestamp: Date.now(),
        chainId,
      };

      // Keep only last 1000 records to prevent localStorage bloat
      const updatedTimestamps = [...timestamps, newTimestamp].slice(-1000);
      localStorage.setItem(
        RATE_LIMIT_STORAGE_KEY,
        JSON.stringify(updatedTimestamps)
      );
    },
    [getMintTimestamps]
  );

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && address) {
      setIsLoading(false);

      // Save timestamp for rate limiting only after successful transaction
      saveMintTimestamp(address, chainId);

      toast({
        title: "Mint Successful",
        description: "Successfully minted 0.05 wBTC to your wallet!",
        variant: "default",
      });
    }
  }, [isConfirmed, toast, address, chainId, saveMintTimestamp]);

  const canMint = useCallback(
    (
      userAddress: string,
      currentChainId: number
    ): { canMint: boolean; timeRemaining?: number } => {
      const timestamps = getMintTimestamps();
      const userTimestamp = timestamps.find(
        (ts) =>
          ts.address === userAddress.toLowerCase() &&
          ts.chainId === currentChainId
      );

      if (!userTimestamp) {
        return { canMint: true };
      }

      const timeSinceLastMint = Date.now() - userTimestamp.timestamp;
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (timeSinceLastMint >= twentyFourHours) {
        return { canMint: true };
      }

      const timeRemaining = twentyFourHours - timeSinceLastMint;
      return { canMint: false, timeRemaining };
    },
    [getMintTimestamps]
  );

  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  const mintWBTC = useCallback(async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint wBTC.",
        variant: "destructive",
      });
      return;
    }

    // Additional debug info
    // console.log("Wallet connected:", { isConnected, address, chainId });

    // Check if contract address exists for current chain
    const contractAddress =
      CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.WBTC;

    // Debug logging
    // console.log("Debug Info:", {
    //   chainId,
    //   contractAddress,
    //   availableChains: Object.keys(CONTRACT_ADDRESSES),
    //   fullContractConfig:
    //     CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES],
    // });

    if (!contractAddress) {
      toast({
        title: "Contract Not Available",
        description: `wBTC minting is not available on chain ${chainId}. Please switch to Core Testnet (Chain ID: 1114).`,
        variant: "destructive",
      });
      return;
    }

    // Check rate limiting
    const { canMint: userCanMint, timeRemaining } = canMint(address, chainId);
    if (!userCanMint && timeRemaining) {
      toast({
        title: "Rate Limit Exceeded",
        description: `You can mint wBTC again in ${formatTimeRemaining(
          timeRemaining
        )}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: MOCK_WBTC_ABI,
        functionName: "mint",
        args: [address as `0x${string}`, DEFAULT_WBTC_MINT_AMOUNT],
      });

      toast({
        title: "Mint Transaction Submitted",
        description:
          "Your wBTC mint transaction has been submitted. Please wait for confirmation.",
      });

      // Note: Rate limiting timestamp will be saved only after successful confirmation
    } catch (err) {
      console.error("Mint error:", err);
      setIsLoading(false);
      setTransactionHash(undefined);

      // Check if it's a user rejection/cancellation
      const errorMessage = err instanceof Error ? err.message : "";
      const isUserRejection =
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("user denied") ||
        errorMessage.includes("Transaction was cancelled") ||
        errorMessage.includes("cancelled");

      if (isUserRejection) {
        toast({
          title: "Transaction Cancelled",
          description: "Transaction was cancelled by user.",
          variant: "default",
        });
      } else {
        toast({
          title: "Mint Failed",
          description: errorMessage || "Failed to mint wBTC. Please try again.",
          variant: "destructive",
        });
      }
    }
    // Note: We don't set isLoading to false in finally anymore since it's handled by useEffect
  }, [
    address,
    isConnected,
    chainId,
    writeContract,
    toast,
    canMint,
    formatTimeRemaining,
  ]);

  // Check current user's mint eligibility
  const mintEligibility = address
    ? canMint(address, chainId)
    : { canMint: false };

  return {
    mintWBTC,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
    hash,
    canMint: mintEligibility.canMint,
    timeRemaining: mintEligibility.timeRemaining,
    formatTimeRemaining,
  };
};
