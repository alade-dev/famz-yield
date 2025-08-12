import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/contracts";

// ERC20 ABI for balance checking
const ERC20_BALANCE_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  address: string;
  isLoading: boolean;
  error?: string;
}

export const useTokenBalances = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [nativeBalance, setNativeBalance] = useState<string>("0");
  const [isLoadingNative, setIsLoadingNative] = useState(false);

  // Get contract addresses for current chain
  const contracts =
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  // Prepare contract calls for all tokens
  const contractCalls = contracts
    ? [
        // WBTC calls
        {
          address: contracts.WBTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        },
        {
          address: contracts.WBTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "decimals",
        },
        {
          address: contracts.WBTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "symbol",
        },
        {
          address: contracts.WBTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "name",
        },
        // stCORE calls
        {
          address: contracts.ST_CORE as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        },
        {
          address: contracts.ST_CORE as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "decimals",
        },
        {
          address: contracts.ST_CORE as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "symbol",
        },
        {
          address: contracts.ST_CORE as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "name",
        },
        // lstBTC calls
        {
          address: contracts.LST_BTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        },
        {
          address: contracts.LST_BTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "decimals",
        },
        {
          address: contracts.LST_BTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "symbol",
        },
        {
          address: contracts.LST_BTC as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: "name",
        },
      ]
    : [];

  const {
    data: contractResults,
    isLoading: isLoadingContracts,
    refetch,
  } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: isConnected && !!address && !!contracts,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Fetch native token (CORE) balance
  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (!isConnected || !address) {
        setNativeBalance("0");
        return;
      }

      setIsLoadingNative(true);
      try {
        const response = await fetch(`https://rpc.test2.btcs.network`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 1,
          }),
        });

        const data = await response.json();
        if (data.result) {
          const balanceWei = BigInt(data.result);
          const balanceEther = formatUnits(balanceWei, 18);
          setNativeBalance(balanceEther);
        }
      } catch (error) {
        console.error("Error fetching native balance:", error);
        setNativeBalance("0");
      } finally {
        setIsLoadingNative(false);
      }
    };

    fetchNativeBalance();
    const interval = setInterval(fetchNativeBalance, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [address, isConnected, chainId]);

  // Process contract results into token balances
  const tokenBalances: TokenBalance[] = [];

  if (contractResults && contracts) {
    // Process WBTC (indices 0-3)
    const wbtcBalance = contractResults[0]?.result as bigint | undefined;
    const wbtcDecimals = contractResults[1]?.result as number | undefined;
    const wbtcSymbol = contractResults[2]?.result as string | undefined;
    const wbtcName = contractResults[3]?.result as string | undefined;

    if (wbtcBalance !== undefined && wbtcDecimals !== undefined) {
      tokenBalances.push({
        symbol: wbtcSymbol || "wBTC",
        name: wbtcName || "Wrapped Bitcoin",
        balance: wbtcBalance.toString(),
        formattedBalance: formatUnits(wbtcBalance, wbtcDecimals),
        decimals: wbtcDecimals,
        address: contracts.WBTC,
        isLoading: isLoadingContracts,
      });
    }

    // Process stCORE (indices 4-7)
    const stCoreBalance = contractResults[4]?.result as bigint | undefined;
    const stCoreDecimals = contractResults[5]?.result as number | undefined;
    const stCoreSymbol = contractResults[6]?.result as string | undefined;
    const stCoreName = contractResults[7]?.result as string | undefined;

    if (stCoreBalance !== undefined && stCoreDecimals !== undefined) {
      tokenBalances.push({
        symbol: stCoreSymbol || "stCORE",
        name: stCoreName || "Staked Core",
        balance: stCoreBalance.toString(),
        formattedBalance: formatUnits(stCoreBalance, stCoreDecimals),
        decimals: stCoreDecimals,
        address: contracts.ST_CORE,
        isLoading: isLoadingContracts,
      });
    }

    // Process lstBTC (indices 8-11)
    const lstBtcBalance = contractResults[8]?.result as bigint | undefined;
    const lstBtcDecimals = contractResults[9]?.result as number | undefined;
    const lstBtcSymbol = contractResults[10]?.result as string | undefined;
    const lstBtcName = contractResults[11]?.result as string | undefined;

    if (lstBtcBalance !== undefined && lstBtcDecimals !== undefined) {
      tokenBalances.push({
        symbol: lstBtcSymbol || "lstBTC",
        name: lstBtcName || "Liquid Staked BTC",
        balance: lstBtcBalance.toString(),
        formattedBalance: formatUnits(lstBtcBalance, lstBtcDecimals),
        decimals: lstBtcDecimals,
        address: contracts.LST_BTC,
        isLoading: isLoadingContracts,
      });
    }
  }

  // Add native CORE token
  const nativeToken: TokenBalance = {
    symbol: "tCORE",
    name: "Test Core",
    balance: (parseFloat(nativeBalance) * 1e18).toString(),
    formattedBalance: nativeBalance,
    decimals: 18,
    address: "native",
    isLoading: isLoadingNative,
  };

  const allTokens = [nativeToken, ...tokenBalances];

  return {
    tokens: allTokens,
    isLoading: isLoadingContracts || isLoadingNative,
    isConnected,
    refetch,
    nativeBalance: {
      balance: nativeBalance,
      isLoading: isLoadingNative,
    },
  };
};
