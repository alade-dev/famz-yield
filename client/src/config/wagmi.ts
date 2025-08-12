import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask, walletConnect, injected } from "wagmi/connectors";
import { defineChain } from "viem";

const projectId = "your-project-id"; // This would be from WalletConnect Cloud

// Core Testnet configuration
// const coreTestnet = defineChain({
//   id: 1115,
//   name: "Core Testnet",
//   nativeCurrency: {
//     decimals: 18,
//     name: "Core",
//     symbol: "tCORE",
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://rpc.test.btcs.network"],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: "Core Testnet Explorer",
//       url: "https://scan.test.btcs.network",
//     },
//   },
//   testnet: true,
// });

const coreTestnet2 = defineChain({
  id: 1114,
  name: "Core Testnet2",
  nativeCurrency: {
    decimals: 18,
    name: "Core",
    symbol: "tCORE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.test2.btcs.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Core Testnet Explorer 2",
      url: "https://scan.test2.btcs.network",
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [mainnet, sepolia, coreTestnet2], // Using only coreTestnet2
  connectors: [
    metaMask(),
    walletConnect({
      projectId: projectId || "demo-project-id",
      metadata: {
        name: "Famz Yield",
        description: "DeFi Famz for wBTC and stCore",
        url: "https://famz-defi.vercel.app",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [coreTestnet2.id]: http("https://rpc.test2.btcs.network"),
  },
});

// Export the chain for reference
export { coreTestnet2 as coreTestnet };
