import { useWBTCMint } from "./useWBTCMint";
// import { useStCOREMint } from "./useStCOREMint"; // Commented out for development

export interface FaucetService {
  name: string;
  symbol: string;
  amount: string;
  description: string;
  mint: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  canMint: boolean;
  timeRemaining?: number;
  formatTimeRemaining: (ms: number) => string;
  color: {
    bg: string;
    border: string;
    text: string;
    hover: string;
  };
}

export const useFaucet = () => {
  const wbtcMint = useWBTCMint();
  // const stcoreMint = useStCOREMint(); // Commented out for development

  const services: FaucetService[] = [
    {
      name: "Wrapped Bitcoin",
      symbol: "wBTC",
      amount: "0.05",
      description: "Test wBTC tokens for vault deposits",
      mint: wbtcMint.mintWBTC,
      isLoading: wbtcMint.isLoading,
      isSuccess: wbtcMint.isSuccess,
      canMint: wbtcMint.canMint,
      timeRemaining: wbtcMint.timeRemaining,
      formatTimeRemaining: wbtcMint.formatTimeRemaining,
      color: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-600",
        hover: "hover:bg-orange-500/20",
      },
    },
    // stCORE service commented out for development
    // {
    //   name: "Staked Core",
    //   symbol: "stCORE",
    //   amount: "1.0",
    //   description: "Test stCORE tokens for vault deposits",
    //   mint: stcoreMint.mintStCORE,
    //   isLoading: stcoreMint.isLoading,
    //   isSuccess: stcoreMint.isSuccess,
    //   canMint: stcoreMint.canMint,
    //   timeRemaining: stcoreMint.timeRemaining,
    //   formatTimeRemaining: stcoreMint.formatTimeRemaining,
    //   color: {
    //     bg: "bg-blue-500/10",
    //     border: "border-blue-500/20",
    //     text: "text-blue-600",
    //     hover: "hover:bg-blue-500/20",
    //   },
    // },
  ];

  return {
    services,
    hasAnyLoading: services.some((service) => service.isLoading),
    hasAnySuccess: services.some((service) => service.isSuccess),
  };
};
