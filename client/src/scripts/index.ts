import { writeContract, readContract, simulateContract } from "@wagmi/core";
import { parseUnits, formatUnits, Address } from "viem";
import { PRICE_ORACLE_ABI } from "./PriceOracle";
import { VAULT_ABI } from "./Vault";
import { LSTBTC_ABI } from "./LstBTC";
import { config } from "@/config/wagmi";

const CONTRACTS = {
  WBTC: "0x546a07F7E5Ec6EAf22201486b4116cF87aE170aa",
  STCORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650", // Real testnet stCORE
  LSTBTC: "0xf47c98abA1a4c4eB778991AeE7Ea889a977fEA3E",
  CUSTODIAN: "0x507b00ad0e362C9C6Bc6Fe044F3c062f15C2FC5A",
  VAULT: "0x6924a3828952867F713D25a949D34B81c9836653",
  PRICE_ORACLE: "0x0e3EB58b29CB991F9DFf00318b6449021A7cd943",
};

// ===========================================
// VAULT CONTRACT FUNCTIONS (Main User Interface)
// ===========================================

// DEPOSIT FLOW

// Simulate deposit to check for errors
export const simulateDeposit = async (
  wbtcAmount,
  stcoreAmount,
  stToken = CONTRACTS.STCORE
) => {
  try {
    const result = await simulateContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [
        parseUnits(wbtcAmount.toString(), 8),
        parseUnits(stcoreAmount.toString(), 18),
        stToken,
      ],
    });
    return result;
  } catch (error) {
    console.error("Error simulating deposit:", error);
    throw error;
  }
};

// Execute deposit transaction
export const deposit = async (
  wbtcAmount,
  stcoreAmount,
  stToken = CONTRACTS.STCORE
) => {
  try {
    const result = await writeContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [
        parseUnits(wbtcAmount.toString(), 8),
        parseUnits(stcoreAmount.toString(), 18),
        stToken,
      ],
    });
    return result;
  } catch (error) {
    console.error("Error executing deposit:", error);
    throw error;
  }
};

// REDEEM FLOW

// Simulate redeem to check for errors
export const simulateRedeem = async (lstbtcAmount, lstToken) => {
  try {
    const result = await simulateContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "redeem",
      args: [parseUnits(lstbtcAmount.toString(), 18), lstToken],
    });
    return result;
  } catch (error) {
    console.error("Error simulating redeem:", error);
    throw error;
  }
};

// Execute redeem transaction
export const redeem = async (lstbtcAmount, lstToken) => {
  try {
    const result = await writeContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "redeem",
      args: [parseUnits(lstbtcAmount.toString(), 18), lstToken],
    });
    return result;
  } catch (error) {
    console.error("Error executing redeem:", error);
    throw error;
  }
};

// ===========================================
// VAULT VIEW FUNCTIONS (Read-only)
// ===========================================

// Get total BTC value in the vault
export const getTotalBTCValue = async () => {
  try {
    const result = await readContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "getTotalBTCValue",
    });
    return formatUnits(result as bigint, 18);
  } catch (error) {
    console.error("Error getting total BTC value:", error);
    throw error;
  }
};

// Get current oracle prices
export const getCurrentPrices = async () => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "getCurrentPrices",
    })) as [bigint, bigint];
    return {
      stCOREPrice: formatUnits(result[0], 18),
      coreBTCPrice: formatUnits(result[1], 18),
    };
  } catch (error) {
    console.error("Error getting current prices:", error);
    throw error;
  }
};

// Get user's deposit ratios
export const getUserRatios = async (userAddress) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "getUserRatios",
      args: [userAddress],
    })) as [bigint, bigint];
    return {
      r_wBTC: formatUnits(result[0], 18),
      r_stCORE: formatUnits(result[1], 18),
    };
  } catch (error) {
    console.error("Error getting user ratios:", error);
    throw error;
  }
};

// Get user's lstBTC info
export const getUserInfo = async (config, userAddress) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "getUserInfo",
      args: [userAddress],
    })) as [bigint, bigint];
    return {
      balance: formatUnits(result[0], 18),
      btcValue: formatUnits(result[1], 18),
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    throw error;
  }
};

// Get minimum amounts
export const getMinimumAmounts = async (config) => {
  try {
    const [depositMin, redeemMin] = (await Promise.all([
      readContract(config, {
        address: CONTRACTS.VAULT as Address,
        abi: VAULT_ABI,
        functionName: "depositMinAmount",
      }),
      readContract(config, {
        address: CONTRACTS.VAULT as Address,
        abi: VAULT_ABI,
        functionName: "redeemMinAmount",
      }),
    ])) as [bigint, bigint];
    return {
      depositMinAmount: formatUnits(depositMin, 18),
      redeemMinAmount: formatUnits(redeemMin, 18),
    };
  } catch (error) {
    console.error("Error getting minimum amounts:", error);
    throw error;
  }
};

// Check if LST token is whitelisted
export const checkLSTWhitelisted = async (config, tokenAddress) => {
  try {
    const result = await readContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "isLSTWhitelisted",
      args: [tokenAddress],
    });
    return result;
  } catch (error) {
    console.error("Error checking LST whitelist:", error);
    throw error;
  }
};

// ===========================================
// LSTBTC TOKEN FUNCTIONS
// ===========================================

// Get user's lstBTC balance
export const getLstBTCBalance = async (config, userAddress) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.LSTBTC as Address,
      abi: LSTBTC_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    })) as bigint;
    return formatUnits(result, 18);
  } catch (error) {
    console.error("Error getting lstBTC balance:", error);
    throw error;
  }
};

// Get total lstBTC supply
export const getTotalSupply = async (config) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.LSTBTC as Address,
      abi: LSTBTC_ABI,
      functionName: "totalSupply",
    })) as bigint;
    return formatUnits(result, 18);
  } catch (error) {
    console.error("Error getting total supply:", error);
    throw error;
  }
};

// Get total BTC value represented by lstBTC
export const getTotalBTCValueFromToken = async (config) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.LSTBTC as Address,
      abi: LSTBTC_ABI,
      functionName: "totalBTCValue",
    })) as bigint;
    return formatUnits(result, 18);
  } catch (error) {
    console.error("Error getting total BTC value from token:", error);
    throw error;
  }
};

// Get user's BTC value from lstBTC balance
export const getUserBTCValue = async (config, userAddress) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.LSTBTC as Address,
      abi: LSTBTC_ABI,
      functionName: "userBTCValue",
      args: [userAddress],
    })) as bigint;
    return formatUnits(result, 18);
  } catch (error) {
    console.error("Error getting user BTC value:", error);
    throw error;
  }
};

// ===========================================
// PRICE ORACLE FUNCTIONS
// ===========================================

// Get price from oracle
export const getTokenPrice = async (config, tokenAddress) => {
  try {
    const result = (await readContract(config, {
      address: CONTRACTS.PRICE_ORACLE as Address,
      abi: PRICE_ORACLE_ABI,
      functionName: "getPrice",
      args: [tokenAddress],
    })) as bigint;
    return formatUnits(result, 18);
  } catch (error) {
    console.error("Error getting token price:", error);
    throw error;
  }
};

// Get last updated timestamp for token price
export const getLastUpdated = async (config, tokenAddress) => {
  try {
    const result = await readContract(config, {
      address: CONTRACTS.PRICE_ORACLE as Address,
      abi: PRICE_ORACLE_ABI,
      functionName: "getLastUpdated",
      args: [tokenAddress],
    });
    return Number(result);
  } catch (error) {
    console.error("Error getting last updated:", error);
    throw error;
  }
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Get user's token balances
export const getUserTokenBalances = async (config, userAddress) => {
  try {
    const [wbtcBalance, stcoreBalance, lstbtcBalance] = await Promise.all([
      readContract(config, {
        address: CONTRACTS.WBTC as Address,
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
      }),
      readContract(config, {
        address: CONTRACTS.STCORE as Address,
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
      }),
      readContract(config, {
        address: CONTRACTS.LSTBTC as Address,
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
      }),
    ]);

    return {
      wbtc: formatUnits(wbtcBalance, 8),
      stcore: formatUnits(stcoreBalance, 18),
      lstbtc: formatUnits(lstbtcBalance, 18),
    };
  } catch (error) {
    console.error("Error getting user token balances:", error);
    throw error;
  }
};

// Calculate expected lstBTC to mint (using VaultMath logic)
export const calculateExpectedLstBTC = async (wbtcAmount, stcoreAmount) => {
  try {
    const prices = await getCurrentPrices();
    const wbtcIn18Decimals = parseFloat(wbtcAmount) * 1e10;
    const stcoreInBTC =
      (parseFloat(stcoreAmount) *
        parseFloat(prices.stCOREPrice) *
        parseFloat(prices.coreBTCPrice)) /
      (1e18 * 1e18);
    return (wbtcIn18Decimals + stcoreInBTC) / 1e18;
  } catch (error) {
    console.error("Error calculating expected lstBTC:", error);
    throw error;
  }
};

// ===========================================
// ADMIN FUNCTIONS (Maybe for backend If we have any)
// ===========================================

// Whitelist LST token (owner only)
export const whitelistLST = async (config, tokenAddress, status) => {
  try {
    const result = await writeContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "whitelistLST",
      args: [tokenAddress, status],
    });
    return result;
  } catch (error) {
    console.error("Error whitelisting LST:", error);
    throw error;
  }
};

// Notify yield (operator only)
export const notifyYield = async (config, amount) => {
  try {
    const result = await writeContract(config, {
      address: CONTRACTS.VAULT as Address,
      abi: VAULT_ABI,
      functionName: "notifyYield",
      args: [parseUnits(amount.toString(), 18)],
    });
    return result;
  } catch (error) {
    console.error("Error notifying yield:", error);
    throw error;
  }
};

// Set price in oracle (owner only)
export const setTokenPrice = async (config, tokenAddress, price) => {
  try {
    const result = await writeContract(config, {
      address: CONTRACTS.PRICE_ORACLE as Address,
      abi: PRICE_ORACLE_ABI,
      functionName: "setPrice",
      args: [tokenAddress, parseUnits(price.toString(), 18)],
    });
    return result;
  } catch (error) {
    console.error("Error setting token price:", error);
    throw error;
  }
};

// ===========================================
// DASHBOARD DATA FETCHING FOR LATER
// ===========================================

/*
DASHBOARD DATA FETCHING (these are often called together):
- getUserInfo(config, userAddress)
- getUserTokenBalances(config, userAddress)
- getTotalBTCValue(config)
- getCurrentPrices(config)
*/

export default {
  // Main user functions
  deposit,
  redeem,
  simulateDeposit,
  simulateRedeem,

  // View functions
  getTotalBTCValue,
  getCurrentPrices,
  getUserRatios,
  getUserInfo,
  getMinimumAmounts,
  checkLSTWhitelisted,
  getLstBTCBalance,
  getTotalSupply,
  getUserTokenBalances,
  calculateExpectedLstBTC,

  // Oracle functions
  getTokenPrice,
  getLastUpdated,

  // Admin functions
  whitelistLST,
  notifyYield,
  setTokenPrice,
};
