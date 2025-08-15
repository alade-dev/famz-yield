import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  title?: string;
  description?: string;
  explorerUrl?: string;
}

const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  isOpen,
  onClose,
  txHash,
  title = "Transaction Completed",
  description = "Your transaction has been successfully executed!",
  explorerUrl = `https://scan.test2.btcs.network/tx/${txHash}`,
}) => {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Transaction hash copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openExplorer = () => {
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success Icon - Large */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-gray-600">{description}</p>

          {/* Transaction Hash */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Transaction Hash:
            </label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-xs font-mono text-gray-800 break-all">
                {txHash}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(txHash)}
                className="shrink-0"
              >
                <Copy className="h-4 w-4 text-black" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={openExplorer} className="w-full" variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Block Explorer
            </Button>

            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionSuccessModal;
