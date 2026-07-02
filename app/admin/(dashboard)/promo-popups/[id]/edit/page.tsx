import { notFound } from "next/navigation";
import { getPromoPopupById } from "@/lib/db/queries/promo-popups";
import { PromoPopupForm } from "@/components/admin/promo-popup-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPromoPopupPage({ params }: PageProps) {
  const { id } = await params;
  const popup = await getPromoPopupById(id);
  if (!popup) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Edit Promo Popup</h1>
        <p className="text-muted-foreground">{popup.title || "(untitled)"}</p>
      </div>
      <PromoPopupForm initialData={popup} />
    </div>
  );
}
