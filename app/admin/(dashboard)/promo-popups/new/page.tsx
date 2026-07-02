import { PromoPopupForm } from "@/components/admin/promo-popup-form";

export const dynamic = "force-dynamic";

export default function NewPromoPopupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">New Promo Popup</h1>
        <p className="text-muted-foreground">A poster popup for the homepage.</p>
      </div>
      <PromoPopupForm />
    </div>
  );
}
