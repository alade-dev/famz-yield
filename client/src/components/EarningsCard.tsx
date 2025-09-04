import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Coins, Calendar, ArrowUpRight } from "lucide-react";
import { useVault } from "@/contexts/VaultContextWithAPI";

interface EarningsCardProps {
  title: string;
  amount: string;
  token: string;
  percentage: string;
  period: string;
  isPositive?: boolean;
}

const EarningsCard = ({
  title,
  amount,
  token,
  percentage,
  period,
  isPositive = true,
}: EarningsCardProps) => {
  return (
    <Card className="bg-gradient-vault border-vault-border hover:border-primary/50 transition-all duration-300 hover:shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="text-muted-foreground">{title}</span>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{period}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Main Amount */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {amount}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {token}
                </span>
              </div>
              <div
                className={`flex items-center space-x-1 mt-1 ${
                  isPositive ? "text-gold" : "text-destructive"
                }`}
              >
                <TrendingUp
                  className={`w-3 h-3 ${isPositive ? "" : "rotate-180"}`}
                />
                <span className="text-xs font-medium">{percentage}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Action Button */}
          {/* <Button variant="outline" size="sm" className="w-full group">
            <span>View Details</span>
            <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
};

const EarningsOverview = () => {
  const { getTotalEarnings, getTotalDeposited, getTotalValue, positions } =
    useVault();

  const totalEarnings = getTotalEarnings();
  const totalDeposited = getTotalDeposited();
  const totalValue = getTotalValue();

  // Calculate total deposited value in USD (simplified calculation)
  const totalDepositedValue =
    totalDeposited.wbtc * 43000 + totalDeposited.stcore * 1.42;

  const earningsPercentage =
    totalDepositedValue > 0
      ? ((totalEarnings / totalDepositedValue) * 100).toFixed(1)
      : "0";

  // Calculate week earnings (simplified as 1/52 of annual)
  const weeklyEarnings = totalEarnings / 52;

  // Calculate average APY across positions
  const avgApy =
    positions.length > 0
      ? (
          positions.reduce(
            (sum, pos) => sum + parseFloat(pos.apy.replace("%", "")),
            0
          ) / positions.length
        ).toFixed(1)
      : "0";

  const earningsData = [
    {
      title: "Total Earnings",
      amount: totalEarnings.toFixed(2),
      token: "USD",
      percentage: `+${earningsPercentage}%`,
      period: "All Time",
      isPositive: totalEarnings > 0,
    },
    {
      title: "Portfolio Value",
      amount: totalValue.toFixed(2),
      token: "USD",
      percentage:
        totalValue > totalDepositedValue
          ? `+${(
              ((totalValue - totalDepositedValue) / totalDepositedValue) *
              100
            ).toFixed(1)}%`
          : "0%",
      period: "Current",
      isPositive: totalValue > totalDepositedValue,
    },
    {
      title: "Active Positions",
      amount: positions.length.toString(),
      token: "Vaults",
      percentage: `${avgApy}%`,
      period: "Avg APY",
      isPositive: true,
    },
    {
      title: "Weekly Earnings",
      amount: weeklyEarnings.toFixed(2),
      token: "USD",
      percentage: weeklyEarnings > 0 ? `+${weeklyEarnings.toFixed(2)}` : "0",
      period: "7d Est.",
      isPositive: weeklyEarnings > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {earningsData.map((earning, index) => (
        <EarningsCard
          key={index}
          title={earning.title}
          amount={earning.amount}
          token={earning.token}
          percentage={earning.percentage}
          period={earning.period}
          isPositive={earning.isPositive}
        />
      ))}
    </div>
  );
};

export default EarningsOverview;
