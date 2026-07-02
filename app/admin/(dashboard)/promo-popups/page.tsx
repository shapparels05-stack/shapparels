import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getAllPromoPopups } from "@/lib/db/queries/promo-popups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeletePopupButton } from "@/components/admin/delete-popup-button";

export const dynamic = "force-dynamic";

const FREQ_LABEL: Record<string, string> = {
  daily: "Once per day",
  session: "Once per session",
  always: "Every visit",
};

export default async function AdminPromoPopupsPage() {
  const popups = await getAllPromoPopups();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Promo Popups</h1>
          <p className="text-muted-foreground">
            Scroll-triggered poster popups on the homepage. Only one shows at a time — the
            highest-priority active one the visitor hasn&apos;t dismissed.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/promo-popups/new">
            <Plus className="mr-2 h-4 w-4" />
            New Popup
          </Link>
        </Button>
      </div>

      {popups.length === 0 ? (
        <p className="text-muted-foreground">No popups yet.</p>
      ) : (
        <div className="divide-y divide-border/50 rounded-lg border border-border/50">
          {popups.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/50 bg-card">
                <Image src={p.imageUrl} alt={p.title || "Popup"} fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  <span className="truncate">{p.title || "(untitled)"}</span>
                  {!p.isActive && <Badge variant="secondary">Hidden</Badge>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Priority {p.sortOrder} · {FREQ_LABEL[p.frequency] ?? p.frequency}
                  {p.linkUrl ? ` · → ${p.linkUrl}` : " · no link"}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/promo-popups/${p.id}/edit`}>Edit</Link>
              </Button>
              <DeletePopupButton id={p.id} label={p.title || "this popup"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
