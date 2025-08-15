/**
 * Price Oracle ABI - for future use when the actual oracle contract is deployed
 * This is a placeholder ABI with common oracle functions
 */
export const PRICE_ORACLE_ABI = [
  {
    name: "getCurrentPrices",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "stCOREPrice", type: "uint256" },
      { name: "coreBTCPrice", type: "uint256" },
    ],
  },
  {
    name: "getPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "price", type: "uint256" }],
  },
  {
    name: "updatePrice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "latestRoundData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;
