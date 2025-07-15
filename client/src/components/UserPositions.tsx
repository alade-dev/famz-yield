import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Vault, Calendar, ArrowUpRight, Trash } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "react-router-dom";

interface UserPositionsProps {
  limit?: number;
}

const UserPositions = ({ limit }: UserPositionsProps) => {
  const { positions, closeVault } = useVault();
  const { toast } = useToast();
  const location = useLocation();

  const closeVaultHandler = (vaultId: string) => {
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

  if (positions.length === 0) {
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

  const visiblePositions = positions.slice(0, 2);
  const remaining = positions.length - 2;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {location.pathname === "/vaults"
          ? positions.map((position) => (
              <Card
                key={position.id}
                className="bg-gradient-vault border-vault-border hover:border-primary/50 transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">
                      {position.vaultName}
                    </CardTitle>
                    <span className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full border border-gold/20">
                      {position.apy} APY
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Asset Breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">wBTC</p>
                      <p className="font-medium">
                        {position.wbtcDeposited.toFixed(6)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">stCORE</p>
                      <p className="font-medium">
                        {position.stcoreDeposited.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* lstBTC Generated */}
                  <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      lstBTC Generated
                    </p>
                    <p className="text-lg font-bold text-gold">
                      {position.lstbtcGenerated.toFixed(6)}
                    </p>
                  </div>

                  {/* Performance */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current Value
                      </p>
                      <p className="font-medium">
                        ${position.currentValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Earnings</p>
                      <div className="space-y-1">
                        <p className="font-medium text-gold">
                          +${position.earnings.toFixed(2)}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <p>wBTC: +{position.wbtcEarnings.toFixed(6)}</p>
                          <p>stCORE: +{position.stcoreEarnings.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Date and Actions */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Deposited{" "}
                        {new Date(position.depositDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {/* <Button variant="ghost" size="sm" className="h-auto p-0">
                    <span className="text-xs">Manage</span>
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button> */}
                      <Button
                        variant="destructive"
                        size="lg"
                        className="group"
                        onClick={() => closeVaultHandler(position.id)}
                      >
                        <Trash className="w-3 h-3 mr-1" />
                        <span className="text-xs">Close Vault</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : visiblePositions.map((position) => (
              <Card
                key={position.id}
                className="bg-gradient-vault border-vault-border hover:border-primary/50 transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">
                      {position.vaultName}
                    </CardTitle>
                    <span className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full border border-gold/20">
                      {position.apy} APY
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Asset Breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">wBTC</p>
                      <p className="font-medium">
                        {position.wbtcDeposited.toFixed(6)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">stCORE</p>
                      <p className="font-medium">
                        {position.stcoreDeposited.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* lstBTC Generated */}
                  <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      lstBTC Generated
                    </p>
                    <p className="text-lg font-bold text-gold">
                      {position.lstbtcGenerated.toFixed(6)}
                    </p>
                  </div>

                  {/* Close Vault Button for Dashboard */}
                  <div className="flex justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="group"
                      onClick={() => closeVaultHandler(position.id)}
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      <span className="text-xs">Close Vault</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
      {limit && positions.length > limit && location.pathname !== "/vaults" && (
        <div className="flex justify-center mt-4">
          <Link to="/vaults">
            <Button variant="ghost" size="sm">
              View {remaining} more vault{remaining > 1 ? "s" : ""} &rarr;
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserPositions;
