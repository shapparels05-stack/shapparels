import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  total: string;
  status: string;
  createdAt: Date;
}

interface OrderTableProps {
  orders: Order[];
}

function getStatusVariant(status: string) {
  switch (status) {
    case "delivered":
      return "default" as const;
    case "cancelled":
      return "destructive" as const;
    case "shipped":
    case "processing":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">No orders found.</p>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/admin/orders/${order.id}`}
          className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-accent transition-colors"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {order.customerName} · {order.customerPhone}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.shippingCity} ·{" "}
              {new Date(order.createdAt).toLocaleString("en-PK", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Karachi",
              })}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm font-semibold">
              {CURRENCY_SYMBOL} {parseFloat(order.total).toLocaleString()}
            </p>
            <Badge variant={getStatusVariant(order.status)} className="text-xs">
              {order.status}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
