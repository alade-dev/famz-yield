import { createConfig, http } from "wagmi";
import { mainnet, sepolia, coreTestnet2 } from "wagmi/chains";
import { metaMask, walletConnect, injected } from "wagmi/connectors";

const projectId = "your-project-id"; // This would be from WalletConnect Cloud

export const config = createConfig({
  chains: [mainnet, sepolia, coreTestnet2],
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
    [coreTestnet2.id]: http(),
  },
});
