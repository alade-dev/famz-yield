import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

export const useWalletConnection = () => {
  const { isConnected } = useAccount();
  const { toast } = useToast();

  const requireWalletConnection = (action: string = "perform this action") => {
    if (!isConnected) {
      toast({
        title: "Wallet Connection Required",
        description: `Please connect your wallet to ${action}.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return {
    isConnected,
    requireWalletConnection,
  };
};
