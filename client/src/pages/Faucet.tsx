import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Wallet,
  ExternalLink,
  Coins,
  TrendingUp,
  ArrowRight,
  Droplets,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { BitcoinIcon } from "@/components/icons/BitcoinIcon";
import { CoreIcon } from "@/components/icons/CoreIcon";

const Faucet = () => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mb-6 shadow-lg">
          <Droplets className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
          Testnet Faucet & Quick Start Guide
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get test tokens and start exploring Famz Yield's powerful vault and
          staking features on the Core Testnet in just a few simple steps.
        </p>
      </div>

      {/* Main Guide Card */}
      <Card className="bg-gradient-vault border-vault-border shadow-2xl mb-8">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-semibold flex items-center justify-center space-x-2">
            <Shield className="w-6 h-6 text-primary" />
            <span>Getting Started</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Step Cards */}
          <div className="grid gap-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-4 p-6 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Connect Your Wallet</h3>
                </div>
                <p className="text-muted-foreground mb-3">
                  Click the "Connect Wallet" button in the top navigation to
                  link your wallet and start using the platform.
                </p>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-600 border-green-500/20"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Required
                </Badge>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4 p-6 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Get Test Tokens</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Claim free testnet CORE and BTC tokens from the official Core
                  Testnet faucet. You'll need these to test all platform
                  features.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="sm" className="group">
                    <a
                      href="https://scan.test.btcs.network/faucet"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Droplets className="w-4 h-4 mr-2" />
                      Core Testnet Faucet
                      <ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </Button>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <BitcoinIcon size="sm" />
                    <span>BTC</span>
                    <span>•</span>
                    <CoreIcon size="sm" />
                    <span>CORE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4 p-6 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">
                    Start Staking & Earning
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Convert your tokens and deposit them into vaults to start
                  earning rewards through our optimized DeFi strategies.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-gold/20 text-gold">
                    Vault Deposits
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    Token Conversion
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-600"
                  >
                    Reward Tracking
                  </Badge>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4 p-6 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">
                    Explore Advanced Features
                  </h3>
                </div>
                <p className="text-muted-foreground mb-3">
                  Test dual staking tiers, boost multipliers, and track your
                  portfolio performance across all your positions.
                </p>
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                >
                  Advanced Testing
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
            <Button asChild size="lg" className="flex-1 group">
              <Link to="/dashboard">
                <TrendingUp className="w-5 h-5 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1 group"
            >
              <Link to="/vaults">
                <Shield className="w-5 h-5 mr-2" />
                Explore Vaults
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold">Secure Testing</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              All testnet activities are completely safe. No real assets are at
              risk, and you can experiment freely with all platform features.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold">Need Help?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If you encounter any issues or have questions about the platform,
              check our documentation or reach out to our support team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default Faucet;
