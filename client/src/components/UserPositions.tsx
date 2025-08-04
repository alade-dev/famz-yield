import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Vault,
  Calendar,
  ArrowUpRight,
  Trash,
  Shield,
  Lock,
} from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "react-router-dom";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface UserPositionsProps {
  limit?: number;
}

const UserPositions = ({ limit }: UserPositionsProps) => {
  const { positions, closeVault, isWalletConnected, isDataLoaded } = useVault();
  const { toast } = useToast();
  const location = useLocation();
  const { requireWalletConnection } = useWalletConnection();

  const closeVaultHandler = (vaultId: string) => {
    // Check wallet connection first
    if (!requireWalletConnection("close this vault")) {
      return;
    }

    const position = positions.find((p) => p.id === vaultId);
    if (!position) return;

    closeVault(vaultId);
    toast({
      title: "Vault Closed Successfully",
      description: `You received your original deposits plus ${position.lstbtcGenerated.toFixed(
        6
      )} lstBTC worth of earnings distributed as wBTC and stCORE.`,
      variant: "default",
    });
  };

  // Show wallet connection required message if not connected
  if (!isWalletConnected || !isDataLoaded) {
    return (
      <Card className="bg-gradient-vault border-vault-border">
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Secure Data Access Required
          </h3>
          <p className="text-muted-foreground mb-4">
            Connect your wallet to view your encrypted vault positions
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Wallet-protected data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out positions with zero deposits first
  const validPositions = positions.filter(
    (position) => position.wbtcDeposited > 0 || position.stcoreDeposited > 0
  );

  if (validPositions.length === 0) {
    return (
      <Card className="bg-gradient-vault border-vault-border">
        <CardContent className="p-8 text-center">
          <Vault className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Vault Positions</h3>
          <p className="text-muted-foreground mb-4">
            Start earning yield by depositing to one of our lstBTC vaults
          </p>
        </CardContent>
      </Card>
    );
  }

  // Apply limit if specified
  const displayedPositions = limit
    ? validPositions.slice(0, limit)
    : validPositions;

  return (
    <div className="space-y-4">
      {displayedPositions.map((position) => (
        <Card
          key={position.id}
          className="bg-gradient-vault border-vault-border hover:border-primary/30 transition-all duration-300"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{position.vaultName}</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gold font-medium">
                  {position.apy}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => closeVaultHandler(position.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">wBTC Deposited</p>
                <p className="font-medium">
                  {position.wbtcDeposited.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  stCORE Deposited
                </p>
                <p className="font-medium">
                  {position.stcoreDeposited.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  lstBTC Generated
                </p>
                <p className="font-medium text-gold">
                  {position.lstbtcGenerated.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="font-medium">
                  ${position.currentValue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="font-medium text-gold">
                  ${position.earnings.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">wBTC Earnings</p>
                <p className="font-medium text-gold">
                  +{position.wbtcEarnings.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">stCORE Earnings</p>
                <p className="font-medium text-gold">
                  +{position.stcoreEarnings.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-vault-border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Deposited{" "}
                  {new Date(position.depositDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">
                  {(
                    (position.earnings /
                      (position.currentValue - position.earnings)) *
                    100
                  ).toFixed(2)}
                  % gain
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Show "View more" link if there are more positions and we're on dashboard */}
      {limit &&
        positions.length > limit &&
        location.pathname === "/dashboard" && (
          <Card className="bg-gradient-vault border-vault-border">
            <CardContent className="p-4 text-center">
              <Link to="/vaults">
                <Button variant="outline" className="w-full">
                  View {positions.length - limit} more vault
                  {positions.length - limit > 1 ? "s" : ""}
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default UserPositions;
