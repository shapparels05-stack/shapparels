import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface StatsCardsProps {
  stats: {
    today: { count: number; revenue: string };
    week: { count: number; revenue: string };
    month: { count: number; revenue: string };
    totalProducts: number;
    archivedProducts?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Today's Orders",
      value: stats.today.count.toString(),
      description: `${CURRENCY_SYMBOL} ${parseFloat(stats.today.revenue).toLocaleString()} revenue`,
      icon: ShoppingCart,
    },
    {
      title: "This Week",
      value: stats.week.count.toString(),
      description: `${CURRENCY_SYMBOL} ${parseFloat(stats.week.revenue).toLocaleString()} revenue`,
      icon: TrendingUp,
    },
    {
      title: "This Month",
      value: stats.month.count.toString(),
      description: `${CURRENCY_SYMBOL} ${parseFloat(stats.month.revenue).toLocaleString()} revenue`,
      icon: DollarSign,
    },
    {
      title: "Active Products",
      value: stats.totalProducts.toString(),
      description: `${stats.archivedProducts ?? 0} archived`,
      icon: Package,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
