// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Core Testnet (Chain ID: 1114)
  1114: {
    WBTC: "0x546a07F7E5Ec6EAf22201486b4116cF87aE170aa",
    VAULT: "0x6924a3828952867F713D25a949D34B81c9836653",
    LST_BTC: "0xf47c98abA1a4c4eB778991AeE7Ea889a977fEA3E",
    ST_CORE: "0x6401f24EF7C54032f4F54E67492928973Ab87650",
    CUSTODIAN: "0x507b00ad0e362C9C6Bc6Fe044F3c062f15C2FC5A",
    PRICE_ORACLE: "0x0e3EB58b29CB991F9DFf00318b6449021A7cd943",
  },
  // Add other networks as needed
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
