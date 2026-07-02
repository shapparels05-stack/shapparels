import { notFound } from "next/navigation";
import { getSpecialOfferByIdForEdit, getProductsForPicker } from "@/lib/db/queries/special-offers";
import { SpecialOfferForm } from "@/components/admin/special-offer-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSpecialOfferPage({ params }: PageProps) {
  const { id } = await params;

  const [offer, products] = await Promise.all([
    getSpecialOfferByIdForEdit(id),
    getProductsForPicker(),
  ]);

  if (!offer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Edit Special Offer</h1>
        <p className="text-muted-foreground">{offer.name}</p>
      </div>
      <SpecialOfferForm products={products} initialData={offer} />
    </div>
  );
}
