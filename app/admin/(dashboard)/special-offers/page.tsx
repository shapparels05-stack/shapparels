import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllSpecialOffers } from "@/lib/db/queries/special-offers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { DeleteOfferButton } from "@/components/admin/delete-offer-button";

export const dynamic = "force-dynamic";

export default async function AdminSpecialOffersPage() {
  const offers = await getAllSpecialOffers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Special Offers</h1>
          <p className="text-muted-foreground">Product bundles / combo deals.</p>
        </div>
        <Button asChild>
          <Link href="/admin/special-offers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Offer
          </Link>
        </Button>
      </div>

      {offers.length === 0 ? (
        <p className="text-muted-foreground">No special offers yet. Create your first bundle.</p>
      ) : (
        <div className="divide-y divide-border/50 rounded-lg border border-border/50">
          {offers.map((o) => (
            <div key={o.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  <span className="truncate">
                    {o.code} — {o.name}
                  </span>
                  {!o.isActive && <Badge variant="secondary">Hidden</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.productCount} products · {CURRENCY_SYMBOL} {parseFloat(o.price).toLocaleString()}{" "}
                  <span className="line-through">{CURRENCY_SYMBOL} {o.originalPrice.toLocaleString()}</span> · Save{" "}
                  {CURRENCY_SYMBOL} {o.savings.toLocaleString()}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/special-offers/${o.id}/edit`}>Edit</Link>
              </Button>
              <DeleteOfferButton id={o.id} name={o.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
