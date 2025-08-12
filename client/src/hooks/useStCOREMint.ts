// import { useState, useCallback } from "react";
// import {
//   useAccount,
//   useWriteContract,
//   useWaitForTransactionReceipt,
//   useChainId,
// } from "wagmi";
// import { parseEther } from "viem";
// import { useToast } from "@/hooks/use-toast";
// import { CONTRACT_ADDRESSES } from "@/config/contracts";

// // stCORE token ABI - minimal required functions
// const ST_CORE_ABI = [
//   {
//     inputs: [
//       {
//         internalType: "address",
//         name: "to",
//         type: "address",
//       },
//       {
//         internalType: "uint256",
//         name: "amount",
//         type: "uint256",
//       },
//     ],
//     name: "mint",
//     outputs: [],
//     stateMutability: "nonpayable",
//     type: "function",
//   },
// ] as const;

// // Rate limiting storage key
// const RATE_LIMIT_STORAGE_KEY = "stcore_mint_timestamps";

// interface MintTimestamp {
//   address: string;
//   timestamp: number;
//   chainId: number;
// }

// // Default mint amount: 1 stCORE
// const DEFAULT_STCORE_MINT_AMOUNT = parseEther("1");

// export const useStCOREMint = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const { address, isConnected } = useAccount();
//   const chainId = useChainId();
//   const { toast } = useToast();

//   const { writeContract, data: hash, error, isPending } = useWriteContract();

//   const { isLoading: isConfirming, isSuccess: isConfirmed } =
//     useWaitForTransactionReceipt({
//       hash,
//     });

//   // Rate limiting functions
//   const getMintTimestamps = useCallback((): MintTimestamp[] => {
//     try {
//       const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
//       return stored ? JSON.parse(stored) : [];
//     } catch {
//       return [];
//     }
//   }, []);

//   const saveMintTimestamp = useCallback(
//     (address: string, chainId: number) => {
//       const timestamps = getMintTimestamps();
//       const newTimestamp: MintTimestamp = {
//         address: address.toLowerCase(),
//         timestamp: Date.now(),
//         chainId,
//       };

//       // Keep only last 1000 records to prevent localStorage bloat
//       const updatedTimestamps = [...timestamps, newTimestamp].slice(-1000);
//       localStorage.setItem(
//         RATE_LIMIT_STORAGE_KEY,
//         JSON.stringify(updatedTimestamps)
//       );
//     },
//     [getMintTimestamps]
//   );

//   const canMint = useCallback(
//     (
//       userAddress: string,
//       currentChainId: number
//     ): { canMint: boolean; timeRemaining?: number } => {
//       const timestamps = getMintTimestamps();
//       const userTimestamp = timestamps.find(
//         (ts) =>
//           ts.address === userAddress.toLowerCase() &&
//           ts.chainId === currentChainId
//       );

//       if (!userTimestamp) {
//         return { canMint: true };
//       }

//       const timeSinceLastMint = Date.now() - userTimestamp.timestamp;
//       const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

//       if (timeSinceLastMint >= twentyFourHours) {
//         return { canMint: true };
//       }

//       const timeRemaining = twentyFourHours - timeSinceLastMint;
//       return { canMint: false, timeRemaining };
//     },
//     [getMintTimestamps]
//   );

//   const formatTimeRemaining = useCallback((milliseconds: number): string => {
//     const hours = Math.floor(milliseconds / (1000 * 60 * 60));
//     const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

//     if (hours > 0) {
//       return `${hours}h ${minutes}m`;
//     }
//     return `${minutes}m`;
//   }, []);

//   const mintStCORE = useCallback(async () => {
//     if (!isConnected || !address) {
//       toast({
//         title: "Wallet Not Connected",
//         description: "Please connect your wallet to mint stCORE.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Check if contract address exists for current chain
//     const contractAddress =
//       CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ST_CORE;
//     if (!contractAddress) {
//       toast({
//         title: "Contract Not Available",
//         description:
//           "stCORE minting is not available on this network. Please switch to Core Testnet.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Check rate limiting
//     const { canMint: userCanMint, timeRemaining } = canMint(address, chainId);
//     if (!userCanMint && timeRemaining) {
//       toast({
//         title: "Rate Limit Exceeded",
//         description: `You can mint stCORE again in ${formatTimeRemaining(
//           timeRemaining
//         )}.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);

//     try {
//       await writeContract({
//         address: contractAddress as `0x${string}`,
//         abi: ST_CORE_ABI,
//         functionName: "mint",
//         args: [address as `0x${string}`, DEFAULT_STCORE_MINT_AMOUNT],
//       });

//       // Save timestamp for rate limiting
//       saveMintTimestamp(address, chainId);

//       toast({
//         title: "Mint Transaction Submitted",
//         description:
//           "Your stCORE mint transaction has been submitted. Please wait for confirmation.",
//       });
//     } catch (err) {
//       console.error("Mint error:", err);
//       toast({
//         title: "Mint Failed",
//         description:
//           err instanceof Error
//             ? err.message
//             : "Failed to mint stCORE. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [
//     address,
//     isConnected,
//     chainId,
//     writeContract,
//     toast,
//     canMint,
//     saveMintTimestamp,
//     formatTimeRemaining,
//   ]);

//   // Check current user's mint eligibility
//   const mintEligibility = address
//     ? canMint(address, chainId)
//     : { canMint: false };

//   return {
//     mintStCORE,
//     isLoading: isLoading || isPending || isConfirming,
//     isSuccess: isConfirmed,
//     error,
//     hash,
//     canMint: mintEligibility.canMint,
//     timeRemaining: mintEligibility.timeRemaining,
//     formatTimeRemaining,
//   };
// };
