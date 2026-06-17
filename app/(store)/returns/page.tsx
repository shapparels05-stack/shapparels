import { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { SITE_URL, WHATSAPP_NUMBER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Return & Exchange Policy",
  description:
    "SH Apparels Return & Exchange Policy — eligibility, timeframes, refunds and how to request a return. Cash on Delivery across Pakistan.",
  alternates: { canonical: `${SITE_URL}/returns` },
};

const policy = [
  "At SH Apparels, customer satisfaction is our priority. Please read this Return & Exchange Policy carefully before placing an order.",
  "Return or exchange requests must be made within 7 days of delivery.",
  "Items must be unused, unworn, and returned in their original packaging with all tags attached.",
  "Used, washed, damaged, or altered products are not eligible for return or exchange.",
  "A valid order number or proof of purchase is required for all return and exchange requests.",
  "Items purchased during sales, promotions, or at discounted prices are not eligible for return or refund unless received damaged or incorrect.",
  "For hygiene reasons, pierced jewelry (such as earrings) and cosmetics cannot be returned or exchanged unless they arrive faulty.",
  "Customers must report any damaged, defective, or incorrect items within 48 hours of delivery, with clear photos shared via WhatsApp.",
  "Once a return is approved and received, refunds are processed within 5–7 business days via bank transfer, JazzCash, or Easypaisa (as orders are Cash on Delivery).",
  "Return shipping costs are the responsibility of the customer, except where an incorrect or defective item was delivered.",
  "To start a return or exchange, contact us on WhatsApp with your order number and we will guide you through the process.",
  "SH Apparels reserves the right to approve or reject any return or exchange request in accordance with this policy.",
];

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Return & Exchange Policy" }]} />

      <div className="mt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Policy</p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Return &amp; Exchange Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: June 2026</p>
      </div>

      <ol className="mt-10 space-y-4">
        {policy.map((point, i) => (
          <li key={i} className="flex gap-4 rounded-lg border border-border/50 bg-card/40 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <p className="text-muted-foreground leading-relaxed">{point}</p>
          </li>
        ))}
      </ol>

      {WHATSAPP_NUMBER && (
        <div className="mt-10 rounded-lg border border-border/60 bg-card/50 p-6 text-center">
          <h2 className="font-serif text-xl font-semibold">Need to return or exchange an item?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Message us on WhatsApp with your order number and we&apos;ll help you out.
          </p>
          <Button asChild className="mt-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I'd like to request a return/exchange. My order number is:`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact us on WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
