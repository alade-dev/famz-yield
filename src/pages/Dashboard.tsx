import { ArrowRight, Shield, Zap, TrendingUp, Lock, BarChart3, Coins, Bitcoin, Star, CheckCircle, ArrowUpRight, Globe, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DepositModal from "@/components/DepositModal";

const Dashboard = () => {
  return (
    <div className="space-y-20 animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <Badge className="mb-6 bg-gradient-primary text-white border-none px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Trusted by 10,000+ DeFi Users
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Earn Up To{" "}
            <span className="bg-gradient-to-r from-gold to-primary bg-clip-text text-transparent">
              15.8% APY
            </span>
            <br />
            On Your Bitcoin
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Maximize your yields with our institutional-grade lstBTC vaults. 
            Deposit wBTC or stCORE and earn sustainable returns through trusted custodian partnerships.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <DepositModal>
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90 animate-glow-pulse">
                Start Earning Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </DepositModal>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              View Documentation
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold">$12.5M+</div>
              <div className="text-muted-foreground">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15.8%</div>
              <div className="text-muted-foreground">Current APY</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Supported Assets</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deposit your favorite assets and watch them grow with our optimized yield strategies
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-gradient-vault border-vault-border hover:shadow-glow transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Wrapped Bitcoin</CardTitle>
                  <p className="text-muted-foreground">wBTC</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current APY</span>
                  <span className="text-gold font-bold">15.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min. Deposit</span>
                  <span className="font-medium">0.001 wBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Converts to</span>
                  <span className="font-medium">lstBTC</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-vault border-vault-border hover:shadow-glow transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-gold-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Staked CORE</CardTitle>
                  <p className="text-muted-foreground">stCORE</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current APY</span>
                  <span className="text-gold font-bold">12.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min. Deposit</span>
                  <span className="font-medium">10 stCORE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Converts to</span>
                  <span className="font-medium">lstBTC</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose Our Platform?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for security, optimized for yield, designed for ease of use
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-vault border-vault-border text-center p-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Institutional Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your assets are protected by enterprise-grade custody solutions and smart contract audits from leading security firms.
            </p>
          </Card>
          
          <Card className="bg-gradient-vault border-vault-border text-center p-8">
            <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8 text-gold-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Optimized Yields</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our algorithms automatically compound your returns and rebalance positions to maximize your earning potential.
            </p>
          </Card>
          
          <Card className="bg-gradient-vault border-vault-border text-center p-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Full Transparency</h3>
            <p className="text-muted-foreground leading-relaxed">
              Track every transaction with custodian hashes, real-time balances, and detailed yield breakdowns.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start earning in just 3 simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary to-gold"></div>
            </div>
            <h3 className="text-xl font-bold mb-3">Connect & Deposit</h3>
            <p className="text-muted-foreground">
              Connect your wallet and deposit wBTC or stCORE to start earning immediately
            </p>
          </div>
          
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gold-foreground">2</span>
              </div>
              <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-gold to-primary"></div>
            </div>
            <h3 className="text-xl font-bold mb-3">Auto Conversion</h3>
            <p className="text-muted-foreground">
              Your assets are automatically converted to yield-bearing lstBTC through our trusted custodians
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Earn & Withdraw</h3>
            <p className="text-muted-foreground">
              Watch your balance grow with daily compounding yields and withdraw anytime
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-vault border-y border-vault-border py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-gold mr-2" />
              </div>
              <div className="text-3xl font-bold text-gold mb-2">$12.5M+</div>
              <div className="text-muted-foreground">Total Value Locked</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary mr-2" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-gold mr-2" />
              </div>
              <div className="text-3xl font-bold text-gold mb-2">15.8%</div>
              <div className="text-muted-foreground">Average APY</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-primary mr-2" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already earning sustainable yields on their Bitcoin and CORE holdings.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <DepositModal>
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-primary hover:opacity-90">
                Deposit Assets Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </DepositModal>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-gold mr-2" />
              No lock-up periods
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-gold mr-2" />
              Withdraw anytime
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-gold mr-2" />
              Institutional security
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-gold mr-2" />
              Daily compounding
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;