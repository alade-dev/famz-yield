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
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";
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

  const handleDocumentation = (e: React.MouseEvent) => {
    window.open(
      "https://famz-yield.vercel.app/overview/vision",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-vault border-b border-vault-border">
        {/* Blurred background gradients */}
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side text content */}
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 animate-fade-in-up">
                🚀 Built on Core Testnet
              </Badge>
              <h1
                className="text-5xl lg:text-7xl font-bold mb-6 animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                Maximize Your{" "}
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Bitcoin Yields
                </span>
              </h1>
              <p
                className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                Convert your wBTC and stCORE to lstBTC through trusted
                custodians. Earn competitive yields while maintaining full
                transparency and security.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up"
                style={{ animationDelay: "0.6s" }}
              >
                <Button
                  size="lg"
                  className="group"
                  onClick={handleStartEarning}
                >
                  Start Earning Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDocumentation}
                >
                  View Documentation
                </Button>
              </div>
            </div>

            {/* Right side abstract visual */}
            <div
              className="relative hidden lg:block animate-fade-in"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-gold/5 rounded-3xl transform -rotate-6"></div>

              {/* Floating feature card 1 */}
              <Card className="absolute top-0 left-0 w-64 transform -rotate-12 -translate-x-12 translate-y-8 shadow-lg hover:scale-105 transition-transform duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    High APY
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">15.5%</div>
                  <p className="text-xs text-muted-foreground">Current Rate</p>
                </CardContent>
              </Card>

              {/* Floating feature card 2 */}
              <Card className="absolute bottom-0 right-0 w-64 transform rotate-12 translate-x-12 -translate-y-8 shadow-lg hover:scale-105 transition-transform duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Secured by
                  </CardTitle>
                  <Shield className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    Custodians
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trusted Partners
                  </p>
                </CardContent>
              </Card>

              {/* Central floating icons */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                  <BitcoinIcon size="lg" />
                </div>
                <PlusIcon className="w-6 h-6 text-muted-foreground" />
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                  <CoreIcon size="lg" />
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                  <span className="text-gold font-bold text-3xl">₿</span>
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
              Why Choose <span className="text-primary">Famz Yield</span>?
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
              Start earning yields on your Bitcoin and Core ecosystem assets in
              just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect & Deposit</h3>
              <p className="text-muted-foreground">
                Connect your wallet and deposit wBTC and stCORE to get started
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
                <div className="mb-4 flex justify-center">
                  <BitcoinIcon size="4xl" />
                </div>
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
                <div className="mb-4 flex justify-center items-center space-x-2">
                  <CoreIcon size="4xl" />
                </div>
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
                      Partner with established custodians like Famz for secure
                      lstBTC minting
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
              Famz Yield
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
