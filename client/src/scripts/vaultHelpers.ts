import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { parseUnits, formatUnits, Address } from "viem";
import { config } from "@/config/wagmi";
import {
  CONTRACT_ADDRESSES,
  TESTNET_CONFIG,
  SPECIAL_ADDRESSES,
} from "@/config/contracts";
import { VAULT_ABI } from "./Vault";
import { PRICE_ORACLE_ABI } from "./PriceOracle";
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
 * Get current oracle prices from the actual PriceOracle contract
 */
export const getOraclePrices = async () => {
  try {
    // console.log(
    //   "Fetching prices from oracle contract:",
    //   CONTRACT_ADDRESSES[1114].PRICE_ORACLE
    // );
    // console.log("CORE_NATIVE address:", SPECIAL_ADDRESSES.CORE_NATIVE);
    // console.log("stCORE address:", CONTRACT_ADDRESSES[1114].ST_CORE);

    // Get prices from the oracle contract
    const [corePrice, stCOREPrice] = await Promise.all([
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].PRICE_ORACLE as Address,
        abi: PRICE_ORACLE_ABI,
        functionName: "getPrice",
        args: [SPECIAL_ADDRESSES.CORE_NATIVE],
      }) as Promise<bigint>,
      readContract(config, {
        address: CONTRACT_ADDRESSES[1114].PRICE_ORACLE as Address,
        abi: PRICE_ORACLE_ABI,
        functionName: "getPrice",
        args: [CONTRACT_ADDRESSES[1114].ST_CORE],
      }) as Promise<bigint>,
    ]);

    // Format the prices
    const coreBTCPrice = formatUnits(corePrice, 18); // CORE price in BTC
    const stCOREPriceFormatted = formatUnits(stCOREPrice, 18); // stCORE price

    // console.log("Oracle prices fetched successfully:", {
    //   corePrice: corePrice.toString(),
    //   stCOREPrice: stCOREPrice.toString(),
    //   coreBTCPrice,
    //   stCOREPriceFormatted,
    // });

    return {
      stCOREPrice: stCOREPriceFormatted,
      coreBTCPrice: coreBTCPrice,
      stCOREPriceRaw: stCOREPrice,
      coreBTCPriceRaw: corePrice,
    };
  } catch (error) {
    console.error("Error getting oracle prices from contract:", error);

    // Fallback to testnet configuration values if oracle fails
    // console.log("Falling back to testnet configuration values");
    return {
      stCOREPrice: TESTNET_CONFIG.prices.stCORE_CORE,
      coreBTCPrice: TESTNET_CONFIG.prices.CORE_BTC,
      stCOREPriceRaw: parseUnits(TESTNET_CONFIG.prices.stCORE_CORE, 18),
      coreBTCPriceRaw: parseUnits(TESTNET_CONFIG.prices.CORE_BTC, 18),
    };
  }
};

/**
 * Get prices from the actual PriceOracle contract (when available)
 * This function can be used when the PriceOracle contract is properly deployed
 */
export const getOraclePricesFromContract = async () => {
  try {
    const result = (await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].PRICE_ORACLE as Address,
      abi: PRICE_ORACLE_ABI,
      functionName: "getCurrentPrices",
    })) as [bigint, bigint];

    return {
      stCOREPrice: formatUnits(result[0], 18),
      coreBTCPrice: formatUnits(result[1], 18),
      stCOREPriceRaw: result[0],
      coreBTCPriceRaw: result[1],
    };
  } catch (error) {
    console.error("Error getting oracle prices from contract:", error);
    // Fallback to testnet config if oracle contract call fails
    return getOraclePrices();
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

/**
 * Simulate redeem with comprehensive error checking
 */
export const simulateRedeemWithChecks = async (
  userAddress: Address,
  lstbtcAmount: string
) => {
  try {
    // Check user's lstBTC balance
    const lstbtcBalance = await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ type: "address" }],
          outputs: [{ type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [userAddress],
    });

    // Check minimum redeem amount
    const redeemMinAmount = await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "redeemMinAmount",
    });

    const lstbtcAmountBN = parseUnits(lstbtcAmount, 18);

    // Validation checks
    const issues: string[] = [];
    if ((lstbtcBalance as bigint) < lstbtcAmountBN) {
      issues.push(
        `Insufficient lstBTC balance. Need: ${lstbtcAmount}, Have: ${formatUnits(
          lstbtcBalance as bigint,
          18
        )}`
      );
    }
    if (lstbtcAmountBN < (redeemMinAmount as bigint)) {
      issues.push(
        `Amount below minimum redeem. Minimum: ${formatUnits(
          redeemMinAmount as bigint,
          18
        )}`
      );
    }

    if (issues.length > 0) {
      throw new Error(`Redeem requirements not met:\n${issues.join("\n")}`);
    }

    // Checks if the vault has allowance for it
    //if not approve the vault to spend lstBTC
    const lstbtcAllowance = await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [userAddress, CONTRACT_ADDRESSES[1114].VAULT as Address],
    });
    if ((lstbtcAllowance as bigint) < lstbtcAmountBN) {
      //approve the vault to spend lstBTC
      const approvalResult = await writeContract(config, {
        address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES[1114].VAULT as Address, lstbtcAmountBN],
      });
      console.log("lstBTC approved for vault:", approvalResult);
    }

    // Simulate the actual redeem
    const result = await simulateContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "redeem",
      args: [lstbtcAmountBN, CONTRACT_ADDRESSES[1114].ST_CORE as Address],
    });

    return {
      success: true,
      result,
      lstbtcBalance: lstbtcBalance as bigint,
      redeemMinAmount: redeemMinAmount as bigint,
    };
  } catch (error) {
    console.error("Error simulating redeem:", error);
    return {
      success: false,
      error,
      lstbtcBalance: null,
      redeemMinAmount: null,
    };
  }
};

/**
 * Check all approvals needed for redeem
 */
export const checkRedeemApprovals = async (lstbtcAmount: string) => {
  try {
    const { address } = await getAccount(config);
    if (!address) {
      throw new Error("No wallet connected");
    }

    const lstbtcAmountBN = parseUnits(lstbtcAmount, 18);

    // Check lstBTC allowance
    const lstbtcAllowance = (await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
      abi: [
        {
          name: "allowance",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "allowance",
      args: [address, CONTRACT_ADDRESSES[1114].VAULT as Address],
    })) as bigint;

    const needsLstBTCApproval = lstbtcAllowance < lstbtcAmountBN;

    // console.log("Redeem Approval Check:", {
    //   userAddress: address,
    //   vaultAddress: CONTRACT_ADDRESSES[1114].VAULT,
    //   lstbtcAllowance: lstbtcAllowance.toString(),
    //   requiredAmount: lstbtcAmountBN.toString(),
    //   needsLstBTCApproval,
    // });

    return {
      needsLstBTCApproval,
      lstbtcAllowance,
      requiredAmount: lstbtcAmountBN,
    };
  } catch (error) {
    console.error("Error checking redeem approvals:", error);
    throw error;
  }
};

/**
 * Check if lstBTC approval is needed for redeem
 */
export const checkLstBTCApproval = async (lstbtcAmount: string) => {
  try {
    const { address } = await getAccount(config);
    if (!address) {
      throw new Error("No wallet connected");
    }

    const lstbtcAmountBN = parseUnits(lstbtcAmount, 18);

    // Check current allowance
    const allowance = (await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
      abi: [
        {
          name: "allowance",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "allowance",
      args: [address, CONTRACT_ADDRESSES[1114].VAULT as Address],
    })) as bigint;

    const needsApproval = allowance < lstbtcAmountBN;

    // console.log("lstBTC Approval Check:", {
    //   userAddress: address,
    //   vaultAddress: CONTRACT_ADDRESSES[1114].VAULT,
    //   currentAllowance: allowance.toString(),
    //   requiredAmount: lstbtcAmountBN.toString(),
    //   needsApproval,
    // });

    return {
      needsApproval,
      currentAllowance: allowance,
      requiredAmount: lstbtcAmountBN,
    };
  } catch (error) {
    console.error("Error checking lstBTC approval:", error);
    throw error;
  }
};

/**
 * Approve lstBTC spending for redeem
 */
export const approveLstBTC = async (lstbtcAmount: string) => {
  try {
    const { address } = await getAccount(config);
    if (!address) {
      throw new Error("No wallet connected");
    }

    const lstbtcAmountBN = parseUnits(lstbtcAmount, 18);

    // console.log("Approving lstBTC for redeem:", {
    //   userAddress: address,
    //   vaultAddress: CONTRACT_ADDRESSES[1114].VAULT,
    //   amount: lstbtcAmountBN.toString(),
    // });

    const result = await writeContract(config, {
      address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
      abi: [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ],
      functionName: "approve",
      args: [CONTRACT_ADDRESSES[1114].VAULT as Address, lstbtcAmountBN],
    });

    // console.log("lstBTC approval transaction submitted:", result);
    return result;
  } catch (error) {
    console.error("Error approving lstBTC:", error);
    throw error;
  }
};

/**
 * Execute redeem after all checks pass
 */
export const executeRedeem = async (lstbtcAmount: string) => {
  try {
    const { address } = await getAccount(config);
    if (!address) {
      throw new Error("No wallet connected");
    }

    const lstbtcAmountBN = parseUnits(lstbtcAmount, 18);

    // Check lstBTC balance
    const lstbtcBalance = (await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].LST_BTC as Address,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [address],
    })) as bigint;

    if (lstbtcBalance < lstbtcAmountBN) {
      throw new Error(
        `Insufficient lstBTC balance. Have: ${formatUnits(
          lstbtcBalance,
          18
        )}, Need: ${lstbtcAmount}`
      );
    }

    // Check if approval is needed
    const approvalCheck = await checkLstBTCApproval(lstbtcAmount);

    if (approvalCheck.needsApproval) {
      throw new Error(
        "lstBTC approval required. Please approve lstBTC spending first."
      );
    }

    // console.log("Executing redeem with parameters:", {
    //   userAddress: address,
    //   lstbtcAmount,
    //   lstbtcAmountBN: lstbtcAmountBN.toString(),
    //   lstbtcBalance: lstbtcBalance.toString(),
    //   vaultAddress: CONTRACT_ADDRESSES[1114].VAULT,
    //   stcoreAddress: CONTRACT_ADDRESSES[1114].ST_CORE,
    // });

    const result = await writeContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "redeem",
      args: [lstbtcAmountBN, CONTRACT_ADDRESSES[1114].ST_CORE as Address],
    });

    // console.log("Redeem transaction submitted:", result);
    return result;
  } catch (error) {
    console.error("Error executing redeem:", error);
    throw error;
  }
};

/**
 * Calculate what user will receive from redeeming lstBTC
 */
export const calculateRedeemOutput = async (
  userAddress: Address,
  lstbtcAmount: string
) => {
  try {
    // Get user's ratios from the vault
    const ratios = (await readContract(config, {
      address: CONTRACT_ADDRESSES[1114].VAULT as Address,
      abi: VAULT_ABI,
      functionName: "getUserRatios",
      args: [userAddress],
    })) as [bigint, bigint];

    const [r_wBTC, r_stCORE] = ratios;
    const lstbtcAmountBN = parseUnits(lstbtcAmount, 18);

    // Calculate what user gets back based on their deposit ratios
    const wbtcToReceive = (lstbtcAmountBN * r_wBTC) / BigInt(1e28);
    const stcoreToReceive = (lstbtcAmountBN * r_stCORE) / BigInt(1e13);

    return {
      wbtcAmount: formatUnits(wbtcToReceive, 8), // wBTC has 8 decimals
      stcoreAmount: formatUnits(stcoreToReceive, 18), // stCORE has 18 decimals
      wbtcAmountRaw: wbtcToReceive,
      stcoreAmountRaw: stcoreToReceive,
    };
  } catch (error) {
    console.error("Error calculating redeem output:", error);
    throw error;
  }
};
