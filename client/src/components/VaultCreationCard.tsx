import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Vault, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const VaultCreationCard = () => {
  return (
    <Card className="bg-gradient-vault border-vault-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -translate-y-16 translate-x-16"></div>

      <CardHeader className="pb-4 mt-6">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Vault className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>Create Your Own Vault</span>
          <Sparkles className="w-4 h-4 text-gold ml-auto" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-10 pt-4 md:pt-7">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Launch your own yield optimization vault on Core Testnet
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
              Core Testnet
            </span>
            <span className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full border border-gold/20">
              High APY
            </span>
            <span className="px-2 py-1 bg-vault-border/50 text-muted-foreground text-xs rounded-full border border-vault-border">
              Custom Strategy
            </span>
          </div>
        </div>

        <div className="space-y-3 ">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Min. Deposit</span>
            <span className="font-medium">0.1 stCORE</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expected APY</span>
            <span className="font-medium text-gold">7-12%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Management Fee</span>
            <span className="font-medium">1-2%</span>
          </div>
        </div>

        <Link to="/vaults">
          <Button variant="default" className="w-full mt-3 md:mt-6 group">
            <Plus className="w-4 h-4 mr-2" />
            <span>Create Vault</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default VaultCreationCard;
