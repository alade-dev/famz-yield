// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Core Testnet (Chain ID: 1114)
  1114: {
    WBTC: "0x93Bcf7AAC147Ff2827911c81C4A2d50c5048D8D8",
    VAULT: "0xc57A7a43cFCF981bFc9448c18F69c7DEa6eD6ae7",
    LST_BTC: "0xC8A4844b86d211D555025c77475F608f26ADEd7d",
    ST_CORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650",
    CUSTODIAN: "0xc4530f6eBBf748DE7c2F5fD6C64387cC76bc6814",
    PRICE_ORACLE: "0xF2EA8F4100540BFe66eef135f7c43B6938eD4D65",
  },
  // Add other networks as needed
} as const;

// Special addresses
export const SPECIAL_ADDRESSES = {
  CORE_NATIVE: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native CORE token address
} as const;

// Testnet configuration
export const TESTNET_CONFIG = {
  prices: {
    CORE_BTC: "0.00000864", // CORE/BTC = 0.00000864
    stCORE_CORE: "1.420689", // stCORE/CORE = 1.420689
  },
} as const;

// MockWBTC ABI - only the functions we need
export const MOCK_WBTC_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Default mint amount: 0.05 wBTC (5,000,000 satoshis since wBTC has 8 decimals)
export const DEFAULT_WBTC_MINT_AMOUNT = 5000000n; // 0.05 wBTC
