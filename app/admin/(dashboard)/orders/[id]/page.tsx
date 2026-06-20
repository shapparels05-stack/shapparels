import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CURRENCY_SYMBOL, ORDER_STATUSES } from "@/lib/constants";
import { OrderStatusForm } from "./order-status-form";
import { WhatsAppQuickMessage } from "@/components/admin/whatsapp-quick-message";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-PK", {
              dateStyle: "long",
            })}
          </p>
        </div>
        <OrderStatusForm
          orderId={order.id}
          currentStatus={order.status}
          currentTracking={order.trackingNumber}
          currentCourier={order.courier}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
            <p><span className="text-muted-foreground">Phone:</span> {order.customerPhone}</p>
            {order.customerEmail && (
              <p><span className="text-muted-foreground">Email:</span> {order.customerEmail}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{order.shippingAddress}</p>
            <p>
              {order.shippingCity}
              {order.shippingState && `, ${order.shippingState}`}
              {order.shippingZipCode && ` ${order.shippingZipCode}`}
            </p>
            <p>{order.shippingCountry}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">WhatsApp the customer</CardTitle>
        </CardHeader>
        <CardContent>
          <WhatsAppQuickMessage
            order={{
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
              shippingAddress: order.shippingAddress,
              shippingCity: order.shippingCity,
              shippingState: order.shippingState,
              shippingZipCode: order.shippingZipCode,
              shippingCountry: order.shippingCountry,
              subtotal: order.subtotal,
              shippingCost: order.shippingCost,
              total: order.total,
              trackingNumber: order.trackingNumber,
              courier: order.courier,
              items: items.map((i) => ({
                productName: i.productName,
                variantLabel: i.variantLabel,
                quantity: i.quantity,
                price: i.price,
                total: i.total,
              })),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} × {CURRENCY_SYMBOL} {parseFloat(item.price).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {CURRENCY_SYMBOL} {parseFloat(item.total).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{CURRENCY_SYMBOL} {parseFloat(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{CURRENCY_SYMBOL} {parseFloat(order.shippingCost).toLocaleString()}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{CURRENCY_SYMBOL} {parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
