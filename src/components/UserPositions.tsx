import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Vault, Calendar, ArrowUpRight } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";

const UserPositions = () => {
  const { positions } = useVault();

  if (positions.length === 0) {
    return (
      <Card className="bg-gradient-vault border-vault-border">
        <CardContent className="p-8 text-center">
          <Vault className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Vault Positions</h3>
          <p className="text-muted-foreground mb-4">
            Start earning yield by depositing to one of our lstBTC vaults
          </p>
          <Button variant="outline">
            Browse Vaults
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Your Vault Positions</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {positions.map((position) => (
          <Card key={position.id} className="bg-gradient-vault border-vault-border hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium">{position.vaultName}</CardTitle>
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
                  <p className="font-medium">{position.wbtcDeposited.toFixed(6)}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">stCORE</p>
                  <p className="font-medium">{position.stcoreDeposited.toLocaleString()}</p>
                </div>
              </div>

              {/* lstBTC Generated */}
              <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">lstBTC Generated</p>
                <p className="text-lg font-bold text-gold">{position.lstbtcGenerated.toFixed(6)}</p>
              </div>

              {/* Performance */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="font-medium">${position.currentValue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Earnings</p>
                  <p className="font-medium text-gold">+${position.earnings.toFixed(2)}</p>
                </div>
              </div>

              {/* Deposit Date */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Deposited {new Date(position.depositDate).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-auto p-0">
                  <span className="text-xs">Manage</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserPositions;