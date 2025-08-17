import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  Copy,
  Clock,
  History,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
import { useVault } from "@/contexts/VaultContextWithAPI";

export interface DepositTransaction {
  id: string;
  type: "DEPOSIT";
  txHash: string;
  timestamp: number;
  wbtcAmount: number;
  stcoreAmount: number;
  lstbtcGenerated: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
}

export interface RedeemTransaction {
  id: string;
  type: "REDEEM";
  txHash: string;
  timestamp: number;
  lstbtcAmount: number;
  wbtcReceived: number;
  stcoreReceived: number;
  epochRound: number;
  epochEndTime: number | string | Date; // UTC timestamp when tokens will be available
  status: "COMPLETED" | "PENDING" | "FAILED";
  tokensAvailable: boolean;
}

export type Transaction = DepositTransaction | RedeemTransaction;

const TransactionHistoryPage = () => {
  const { toast } = useToast();
  const { transactions, refreshTransactions } = useVault();
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update current time every second for epoch countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Refresh transactions every 30 seconds to update epoch status
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshTransactions();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [refreshTransactions]);

  const depositTransactions = transactions.filter(
    (tx): tx is DepositTransaction => tx.type === "DEPOSIT"
  );
  const redeemTransactions = transactions.filter(
    (tx): tx is RedeemTransaction => tx.type === "REDEEM"
  );

  const formatDateTime = (timestamp: number | string | Date) => {
    // Convert timestamp to Date object if it's a number or string
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  const formatTimeRemaining = (epochEndTime: number | string | Date) => {
    // Convert epochEndTime to timestamp if it's a Date object or string
    let timestamp: number;
    if (epochEndTime instanceof Date) {
      timestamp = epochEndTime.getTime();
    } else if (typeof epochEndTime === "string") {
      timestamp = new Date(epochEndTime).getTime();
    } else {
      timestamp = epochEndTime;
    }

    const remaining = timestamp - currentTime;
    if (remaining <= 0) return "Available now";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getBlockExplorerUrl = (txHash: string) => {
    // Core testnet block explorer
    return `https://scan.test2.btcs.network/tx/${txHash}`;
  };

  const getStatusBadge = (status: string, transaction?: RedeemTransaction) => {
    // For redeem transactions, check if epoch is reached
    if (transaction && transaction.type === "REDEEM") {
      if (transaction.tokensAvailable) {
        return (
          <Badge className="bg-green-500/20 text-green-500">Completed</Badge>
        );
      } else {
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>
        );
      }
    }

    // For other transactions, use the original status
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500/20 text-green-500">Completed</Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>
        );
      case "FAILED":
        return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTransactions();
      toast({
        title: "Refreshed",
        description: "Transaction history updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh transaction history",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}

      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <History className="w-8 h-8" />
              <span>Transaction History</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your vault deposits and withdrawals
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <ArrowDownCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold text-green-500">
                  {depositTransactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ArrowUpCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Withdrawals
                </p>
                <p className="text-2xl font-bold text-blue-500">
                  {redeemTransactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gold/20 rounded-lg">
                <History className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-gold">
                  {transactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-gradient-vault border-vault-border">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex bg-muted/20 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab("in")}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === "in"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 mr-2 inline" />
              Deposits ({depositTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab("out")}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === "out"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2 inline" />
              Withdrawals ({redeemTransactions.length})
            </button>
          </div>

          {/* Transaction Content */}
          <div className="overflow-auto">
            {activeTab === "in" ? (
              <DepositTransactionsTable
                transactions={depositTransactions}
                formatDateTime={formatDateTime}
                copyToClipboard={copyToClipboard}
                getBlockExplorerUrl={getBlockExplorerUrl}
                getStatusBadge={getStatusBadge}
              />
            ) : (
              <RedeemTransactionsTable
                transactions={redeemTransactions}
                formatDateTime={formatDateTime}
                formatTimeRemaining={formatTimeRemaining}
                copyToClipboard={copyToClipboard}
                getBlockExplorerUrl={getBlockExplorerUrl}
                getStatusBadge={getStatusBadge}
                currentTime={currentTime}
              />
            )}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">
                No transactions found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Your transaction history will appear here after you make
                deposits or withdrawals
              </p>
              <Button asChild>
                <Link to="/vaults">Start Trading</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface DepositTransactionsTableProps {
  transactions: DepositTransaction[];
  formatDateTime: (timestamp: number) => string;
  copyToClipboard: (text: string, label: string) => void;
  getBlockExplorerUrl: (txHash: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const DepositTransactionsTable: React.FC<DepositTransactionsTableProps> = ({
  transactions,
  formatDateTime,
  copyToClipboard,
  getBlockExplorerUrl,
  getStatusBadge,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date & Time (UTC)</TableHead>
        <TableHead>Deposited</TableHead>
        <TableHead>lstBTC Generated</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Transaction</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {transactions.map((tx) => (
        <TableRow key={tx.id}>
          <TableCell className="font-mono text-sm">
            {formatDateTime(tx.timestamp)}
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              {tx.wbtcAmount > 0 && (
                <div className="flex items-center space-x-2">
                  <BitcoinIcon size="sm" />
                  <span className="text-sm font-medium">
                    {tx.wbtcAmount.toFixed(8)} wBTC
                  </span>
                </div>
              )}
              {tx.stcoreAmount > 0 && (
                <div className="flex items-center space-x-2">
                  <CoreIcon size="sm" />
                  <span className="text-sm font-medium">
                    {tx.stcoreAmount.toLocaleString()} stCORE
                  </span>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <span className="text-gold font-bold">₿</span>
              <span className="font-medium">
                {tx.lstbtcGenerated.toFixed(8)}
              </span>
            </div>
          </TableCell>
          <TableCell>{getStatusBadge(tx.status)}</TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(tx.txHash, "Transaction hash")}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(getBlockExplorerUrl(tx.txHash), "_blank")
                }
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

interface RedeemTransactionsTableProps {
  transactions: RedeemTransaction[];
  formatDateTime: (timestamp: number | string | Date) => string;
  formatTimeRemaining: (epochEndTime: number | string | Date) => string;
  copyToClipboard: (text: string, label: string) => void;
  getBlockExplorerUrl: (txHash: string) => string;
  getStatusBadge: (
    status: string,
    transaction?: RedeemTransaction
  ) => React.ReactNode;
  currentTime: number;
}

const RedeemTransactionsTable: React.FC<RedeemTransactionsTableProps> = ({
  transactions,
  formatDateTime,
  formatTimeRemaining,
  copyToClipboard,
  getBlockExplorerUrl,
  getStatusBadge,
  currentTime,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date & Time (UTC)</TableHead>
        <TableHead>Redeemed</TableHead>
        <TableHead>Received</TableHead>
        <TableHead>Epoch Status</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Transaction</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {transactions.map((tx) => (
        <TableRow key={tx.id}>
          <TableCell className="font-mono text-sm">
            {formatDateTime(tx.timestamp)}
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <span className="text-gold font-bold">₿</span>
              <span className="font-medium">{tx.lstbtcAmount.toFixed(6)}</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <BitcoinIcon size="sm" />
                <span className="text-sm font-medium">
                  {tx.wbtcReceived.toFixed(8)} wBTC
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CoreIcon size="sm" />
                <span className="text-sm font-medium">
                  {tx.stcoreReceived.toLocaleString()} stCORE
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span className="text-xs">Round #{tx.epochRound}</span>
              </div>
              {tx.tokensAvailable ? (
                <Badge className="bg-green-500/20 text-green-500 text-xs">
                  Available
                </Badge>
              ) : (
                <div className="space-y-1">
                  <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">
                    {formatTimeRemaining(tx.epochEndTime)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Available: {formatDateTime(tx.epochEndTime)}
                  </p>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>{getStatusBadge(tx.status, tx)}</TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(tx.txHash, "Transaction hash")}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(getBlockExplorerUrl(tx.txHash), "_blank")
                }
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default TransactionHistoryPage;
