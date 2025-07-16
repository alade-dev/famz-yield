import {
  ArrowRight,
  Shield,
  TrendingUp,
  Zap,
  CheckCircle,
  BarChart3,
  Lock,
  Users,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleStartEarning = (e: React.MouseEvent) => {
    navigate("/dashboard");
  };

  const handleExploreVaults = (e: React.MouseEvent) => {
    navigate("/vaults");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-vault border-b border-vault-border">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              🚀 Built on Core Testnet
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              Maximize Your{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Bitcoin Yields
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Convert your wBTC and stCORE to lstBTC through trusted custodians.
              Earn competitive yields while maintaining full transparency and
              security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group" onClick={handleStartEarning}>
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg">
                View Documentation
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">15.5%</div>
                <div className="text-sm text-muted-foreground">Current APY</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">$2.4M</div>
                <div className="text-sm text-muted-foreground">
                  Total Value Locked
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1,200+</div>
                <div className="text-sm text-muted-foreground">
                  Active Users
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Why Choose <span className="text-primary">Famz</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for Bitcoin holders who want to maximize their yields
              without compromising on security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-vault border-vault-border group hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Competitive Yields</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn up to 15.5% APY on your Bitcoin holdings through
                  optimized lstBTC strategies
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-vault border-vault-border group hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Battle-Tested Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Trusted custodians and transparent on-chain transactions
                  ensure your assets are secure
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-vault border-vault-border group hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Seamlessly convert wBTC and stCORE to yield-bearing lstBTC
                  through our custodian API
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-vault border-y border-vault-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start earning yields on your Bitcoin in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect & Deposit</h3>
              <p className="text-muted-foreground">
                Connect your wallet and deposit wBTC or stCORE to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Auto-Convert</h3>
              <p className="text-muted-foreground">
                Your assets are automatically converted to lstBTC through
                trusted custodians
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Earn Yields</h3>
              <p className="text-muted-foreground">
                Watch your lstBTC balance grow with competitive staking rewards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Supported Assets
            </h2>
            <p className="text-xl text-muted-foreground">
              Currently supporting the most popular Bitcoin and Core ecosystem
              assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-vault border-vault-border">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">₿</div>
                <CardTitle>Wrapped Bitcoin (wBTC)</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  The most liquid Bitcoin representation on EVM chains
                </p>
                <Badge variant="secondary">ERC-20</Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-vault border-vault-border">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <CardTitle>Staked CORE (stCORE)</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Liquid staking token for the Core blockchain ecosystem
                </p>
                <Badge variant="secondary">Native Token</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Transparency */}
      <section className="py-20 bg-gradient-vault border-y border-vault-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Security & Transparency First
              </h2>
              <p className="text-xl text-muted-foreground">
                Built with institutional-grade security and complete
                transparency
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Trusted Custodians</h3>
                    <p className="text-muted-foreground">
                      Partner with established custodians like Babylon for
                      secure lstBTC minting
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">
                      On-Chain Transparency
                    </h3>
                    <p className="text-muted-foreground">
                      All transactions are verifiable on-chain with full audit
                      trails
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">ERC-4626 Compatible</h3>
                    <p className="text-muted-foreground">
                      Built on proven standards for maximum security and
                      composability
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Real-Time Tracking</h3>
                    <p className="text-muted-foreground">
                      Monitor your deposits, yields, and lstBTC balance in
                      real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Non-Custodial</h3>
                    <p className="text-muted-foreground">
                      You maintain control of your assets through smart
                      contracts
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Battle-Tested</h3>
                    <p className="text-muted-foreground">
                      Leveraging proven DeFi protocols and security practices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of Bitcoin holders maximizing their yields with
              Famz
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group" onClick={handleStartEarning}>
                Launch App
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={handleExploreVaults}>
                Explore Vaults
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
