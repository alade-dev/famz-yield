import { readContract, writeContract, simulateContract } from "@wagmi/core";
import { parseUnits, formatUnits, Address } from "viem";
import { config } from "@/config/wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { VAULT_ABI } from "./Vault";
import { btcPriceCache } from "./priceApi";

// ERC20 ABI for approvals and balances
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

/**
 * Check if user has sufficient balance and allowance for deposit
 */
export const checkDepositRequirements = async (
  userAddress: Address,
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    const wbtcAmountBN = parseUnits(wbtcAmount, 8);
    const stcoreAmountBN = parseUnits(stcoreAmount, 18);

    // Check balances
    const [wbtcBalance, stcoreBalance] = await Promise.all([
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].WBTC as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }),
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].ST_CORE as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }),
    ]);

    // Check allowances
    const [wbtcAllowance, stcoreAllowance] = await Promise.all([
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].WBTC as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [userAddress, CONTRACT_ADDRESSES[1114].VAULT as Address],
      }),
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].ST_CORE as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [userAddress, CONTRACT_ADDRESSES[1114].VAULT as Address],
      }),
    ]);

    // Check if LST token is whitelisted
    const isWhitelisted = await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "isLSTWhitelisted",
      args: [CONTRACT_ADDRESSES[1114].ST_CORE as Address],
    });

    // Check minimum deposit amount
    const depositMinAmount = await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "depositMinAmount",
    });

    return {
      wbtcBalance: wbtcBalance as bigint,
      stcoreBalance: stcoreBalance as bigint,
      wbtcAllowance: wbtcAllowance as bigint,
      stcoreAllowance: stcoreAllowance as bigint,
      isWhitelisted: isWhitelisted as boolean,
      depositMinAmount: depositMinAmount as bigint,
      checks: {
        sufficientWBTC: (wbtcBalance as bigint) >= wbtcAmountBN,
        sufficientStCORE: (stcoreBalance as bigint) >= stcoreAmountBN,
        wbtcApproved: (wbtcAllowance as bigint) >= wbtcAmountBN,
        stcoreApproved: (stcoreAllowance as bigint) >= stcoreAmountBN,
        lstWhitelisted: isWhitelisted as boolean,
      },
    };
  } catch (error) {
    console.error("Error checking deposit requirements:", error);
    throw error;
  }
};

/**
 * Approve wBTC for vault spending
 */
export const approveWBTC = async (wbtcAmount: string) => {
  try {
    const wbtcAmountBN = parseUnits(wbtcAmount, 8);

    const result = await writeContract(config, {
      address: CONTRACT_ADDRESSES[1114].WBTC as Address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES[1114].VAULT as Address, wbtcAmountBN],
    });

    return result;
  } catch (error) {
    console.error("Error approving wBTC:", error);
    throw error;
  }
};

/**
 * Approve stCORE for vault spending
 */
export const approveStCORE = async (stcoreAmount: string) => {
  try {
    const stcoreAmountBN = parseUnits(stcoreAmount, 18);

    const result = await writeContract(config, {
      address: CONTRACT_ADDRESSES[1114].ST_CORE as Address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES[1114].VAULT as Address, stcoreAmountBN],
    });

    return result;
  } catch (error) {
    console.error("Error approving stCORE:", error);
    throw error;
  }
};

/**
 * Approve tokens for vault spending (sequential, not parallel)
 */
export const approveTokens = async (
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    const results: Array<{ token: string; txHash: `0x${string}` }> = [];

    // Approve wBTC if amount > 0
    if (parseFloat(wbtcAmount) > 0) {
      console.log(`Approving ${wbtcAmount} wBTC...`);
      const wbtcResult = await approveWBTC(wbtcAmount);
      results.push({ token: "wBTC", txHash: wbtcResult });
      console.log(`wBTC approved: ${wbtcResult}`);
    }

    // Approve stCORE if amount > 0
    if (parseFloat(stcoreAmount) > 0) {
      console.log(`Approving ${stcoreAmount} stCORE...`);
      const stcoreResult = await approveStCORE(stcoreAmount);
      results.push({ token: "stCORE", txHash: stcoreResult });
      console.log(`stCORE approved: ${stcoreResult}`);
    }

    return results;
  } catch (error) {
    console.error("Error approving tokens:", error);
    throw error;
  }
};

/**
 * Check current allowances for both tokens
 */
export const checkAllowances = async (
  userAddress: Address,
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    const wbtcAmountBN = parseUnits(wbtcAmount, 8);
    const stcoreAmountBN = parseUnits(stcoreAmount, 18);

    const [wbtcAllowance, stcoreAllowance] = await Promise.all([
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].WBTC as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [userAddress, CONTRACT_ADDRESSES[1114].VAULT as Address],
      }),
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].ST_CORE as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [userAddress, CONTRACT_ADDRESSES[1114].VAULT as Address],
      }),
    ]);

    return {
      wbtcAllowance: wbtcAllowance as bigint,
      stcoreAllowance: stcoreAllowance as bigint,
      wbtcNeedsApproval:
        parseFloat(wbtcAmount) > 0 && (wbtcAllowance as bigint) < wbtcAmountBN,
      stcoreNeedsApproval:
        parseFloat(stcoreAmount) > 0 &&
        (stcoreAllowance as bigint) < stcoreAmountBN,
    };
  } catch (error) {
    console.error("Error checking allowances:", error);
    throw error;
  }
};

/**
 * Simulate deposit with comprehensive error checking
 */
export const simulateDepositWithChecks = async (
  userAddress: Address,
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    // First check all requirements
    const requirements = await checkDepositRequirements(
      userAddress,
      wbtcAmount,
      stcoreAmount
    );

    console.log("Deposit requirements:", requirements);

    // Check for issues (but do NOT block on approvals here)
    const issues: string[] = [];
    if (!requirements.checks.sufficientWBTC) {
      issues.push(
        `Insufficient wBTC balance. Need: ${wbtcAmount}, Have: ${formatUnits(
          requirements.wbtcBalance,
          8
        )}`
      );
    }
    if (!requirements.checks.sufficientStCORE) {
      issues.push(
        `Insufficient stCORE balance. Need: ${stcoreAmount}, Have: ${formatUnits(
          requirements.stcoreBalance,
          18
        )}`
      );
    }
    // Do not block on approvals here – approvals will be handled by caller
    if (!requirements.checks.lstWhitelisted) {
      issues.push("stCORE token is not whitelisted as LST");
    }

    if (issues.length > 0) {
      throw new Error(`Deposit requirements not met:\n${issues.join("\n")}`);
    }

    // Now simulate the actual deposit (this may still revert if approvals are missing,
    // so callers should optionally approve first based on checkAllowances())
    const result = await simulateContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [
        parseUnits(wbtcAmount, 8),
        parseUnits(stcoreAmount, 18),
        CONTRACT_ADDRESSES[1114].ST_CORE as Address,
      ],
    });

    return {
      success: true,
      result,
      requirements,
    };
  } catch (error) {
    console.error("Error simulating deposit:", error);
    return {
      success: false,
      error,
      requirements: null,
    };
  }
};

/**
 * Execute deposit after all checks pass
 */
export const executeDeposit = async (
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    const result = await writeContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [
        parseUnits(wbtcAmount, 8),
        parseUnits(stcoreAmount, 18),
        CONTRACT_ADDRESSES[1114].ST_CORE as Address,
      ],
    });

    return result;
  } catch (error) {
    console.error("Error executing deposit:", error);
    throw error;
  }
};

/**
 * Get current oracle prices
 */
export const getOraclePrices = async () => {
  try {
    const result = (await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "getCurrentPrices",
    })) as [bigint, bigint];

    return {
      stCOREPrice: formatUnits(result[0], 18),
      coreBTCPrice: formatUnits(result[1], 18),
      stCOREPriceRaw: result[0],
      coreBTCPriceRaw: result[1],
    };
  } catch (error) {
    console.error("Error getting oracle prices:", error);
    throw error;
  }
};

/**
 * Calculate lstBTC to be generated from deposit amounts using current oracle prices
 */
export const calculateLstBTCFromDeposit = async (
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    const prices = await getOraclePrices();

    // Convert amounts to BigInt for calculation
    const wbtcAmountBN = parseUnits(wbtcAmount, 8);
    const stcoreAmountBN = parseUnits(stcoreAmount, 18);

    // Convert wBTC from 8 decimals to 18 decimals for consistent calculation
    const wBTCIn18Decimals = wbtcAmountBN * BigInt(1e10);

    // Calculate BTC value of stCORE: (stCORE * stCOREPrice * coreBTCPrice) / (1e18 * 1e18)
    const stCOREinBTC =
      (stcoreAmountBN * prices.stCOREPriceRaw * prices.coreBTCPriceRaw) /
      (BigInt(1e18) * BigInt(1e18));

    // Total lstBTC = wBTC (in 18 decimals) + stCORE (converted to BTC in 18 decimals)
    const totalLstBTC = wBTCIn18Decimals + stCOREinBTC;

    return {
      lstBTCAmount: formatUnits(totalLstBTC, 18),
      lstBTCAmountRaw: totalLstBTC,
      breakdown: {
        wbtcContribution: formatUnits(wBTCIn18Decimals, 18),
        stcoreContribution: formatUnits(stCOREinBTC, 18),
        stCOREPrice: prices.stCOREPrice,
        coreBTCPrice: prices.coreBTCPrice,
      },
    };
  } catch (error) {
    console.error("Error calculating lstBTC from deposit:", error);
    throw error;
  }
};

/**
 * Get comprehensive pricing data (oracle + external BTC price)
 */
export const getComprehensivePrices = async () => {
  try {
    const [oraclePrices, btcUsdPrice] = await Promise.all([
      getOraclePrices(),
      btcPriceCache.getPrice(),
    ]);

    const stCOREPrice = parseFloat(oraclePrices.stCOREPrice);
    const coreBTCPrice = parseFloat(oraclePrices.coreBTCPrice);

    // Calculate USD values using real BTC price
    const coreUsdPrice = coreBTCPrice * btcUsdPrice;
    const stcoreUsdPrice = stCOREPrice * coreUsdPrice;

    return {
      btcUsd: btcUsdPrice,
      stCOREPrice: oraclePrices.stCOREPrice,
      coreBTCPrice: oraclePrices.coreBTCPrice,
      stCOREPriceRaw: oraclePrices.stCOREPriceRaw,
      coreBTCPriceRaw: oraclePrices.coreBTCPriceRaw,
      calculatedPrices: {
        wbtcUsd: btcUsdPrice,
        stcoreUsd: stcoreUsdPrice,
        coreUsd: coreUsdPrice,
      },
    };
  } catch (error) {
    console.error("Error getting comprehensive prices:", error);
    throw error;
  }
};

/**
 * Calculate lstBTC to be generated using real-time BTC prices
 */
export const calculateLstBTCWithRealPrices = async (
  wbtcAmount: string,
  stcoreAmount: string
) => {
  try {
    const prices = await getComprehensivePrices();

    // Convert amounts to BigInt for calculation
    const wbtcAmountBN = parseUnits(wbtcAmount, 8);
    const stcoreAmountBN = parseUnits(stcoreAmount, 18);

    // Convert wBTC from 8 decimals to 18 decimals for consistent calculation
    const wBTCIn18Decimals = wbtcAmountBN * BigInt(1e10);

    // Calculate BTC value of stCORE using oracle ratios
    const stCOREinBTC =
      (stcoreAmountBN * prices.stCOREPriceRaw * prices.coreBTCPriceRaw) /
      (BigInt(1e18) * BigInt(1e18));

    // Total lstBTC = wBTC (in 18 decimals) + stCORE (converted to BTC in 18 decimals)
    const totalLstBTC = wBTCIn18Decimals + stCOREinBTC;

    return {
      lstBTCAmount: formatUnits(totalLstBTC, 18),
      lstBTCAmountRaw: totalLstBTC,
      realBTCPrice: prices.btcUsd,
      breakdown: {
        wbtcContribution: formatUnits(wBTCIn18Decimals, 18),
        stcoreContribution: formatUnits(stCOREinBTC, 18),
        stCOREPrice: prices.stCOREPrice,
        coreBTCPrice: prices.coreBTCPrice,
      },
    };
  } catch (error) {
    console.error("Error calculating lstBTC with real prices:", error);
    throw error;
  }
};

/**
 * Update prices in oracle (for testing purposes)
 */
export const updateOraclePrices = async (
  stCOREPrice: string,
  coreBTCPrice: string
) => {
  try {
    // This would need to be called by the oracle owner
    // For testing, we might need to call the price oracle directly
    const results = await Promise.all([
      writeContract(config, {
        address: CONTRACT_ADDRESSES[1114].PRICE_ORACLE as Address,
        abi: [
          {
            name: "setPrice",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { type: "address", name: "token" },
              { type: "uint256", name: "price" },
            ],
            outputs: [],
          },
        ],
        functionName: "setPrice",
        args: [
          CONTRACT_ADDRESSES[1114].ST_CORE as Address,
          parseUnits(stCOREPrice, 18),
        ],
      }),
      writeContract(config, {
        address: CONTRACT_ADDRESSES[1114].PRICE_ORACLE as Address,
        abi: [
          {
            name: "setPrice",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { type: "address", name: "token" },
              { type: "uint256", name: "price" },
            ],
            outputs: [],
          },
        ],
        functionName: "setPrice",
        args: [
          "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // CORE_NATIVE placeholder
          parseUnits(coreBTCPrice, 18),
        ],
      }),
    ]);

    return results;
  } catch (error) {
    console.error("Error updating oracle prices:", error);
    throw error;
  }
};
