import Link from "next/link";
import { CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_NUMBER, SITE_NAME } from "@/lib/constants";
import { getOrderByNumber } from "@/lib/db/queries/orders";
import { PurchaseTracker } from "@/components/analytics/purchase-tracker";

interface SuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order: orderNumber } = await searchParams;

  // Pull the real order so the Purchase event reports the actual paid amount.
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null;

  const whatsappMessage = encodeURIComponent(
    `Hi! I just placed order ${orderNumber || ""} on ${SITE_NAME}. Can you confirm?`
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
      {order && (
        <PurchaseTracker
          orderNumber={order.orderNumber}
          value={parseFloat(order.total)}
          contents={order.items.map((item) => ({
            id: item.productId ?? "",
            quantity: item.quantity,
            price: parseFloat(item.price),
          }))}
        />
      )}

      <CheckCircle className="mx-auto h-16 w-16 text-primary" />

      <h1 className="mt-6 font-serif text-3xl font-bold">
        Order Placed Successfully!
      </h1>

      {orderNumber && (
        <p className="mt-3 text-lg">
          Order Number: <span className="font-semibold text-primary">{orderNumber}</span>
        </p>
      )}

      <p className="mt-4 text-muted-foreground">
        Thank you for your order. We&apos;ll process it shortly.
        Payment will be collected on delivery.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>

        {WHATSAPP_NUMBER && (
          <Button variant="outline" className="border-[#25D366] text-[#25D366]" asChild>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact on WhatsApp
            </a>
          </Button>
        )}
      </div>

      <div className="mt-12 rounded-lg border border-border/50 bg-card p-6 text-left">
        <h3 className="font-serif text-lg font-semibold">What&apos;s Next?</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Our team will confirm your order shortly</li>
          <li>2. You&apos;ll receive updates on your order status</li>
          <li>3. Pay with cash when your order arrives</li>
        </ul>
      </div>
    </div>
  );
}
