import { getProductsForPicker } from "@/lib/db/queries/special-offers";
import { SpecialOfferForm } from "@/components/admin/special-offer-form";

export const dynamic = "force-dynamic";

export default async function NewSpecialOfferPage() {
  const products = await getProductsForPicker();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">New Special Offer</h1>
        <p className="text-muted-foreground">Bundle several products into one combo deal.</p>
      </div>
      <SpecialOfferForm products={products} />
    </div>
  );
}
