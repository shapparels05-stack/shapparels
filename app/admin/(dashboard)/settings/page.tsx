"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Instagram, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setFacebookUrl(s.facebook_url || "");
        setInstagramUrl(s.instagram_url || "");
        setLowStockThreshold(s.low_stock_threshold || "10");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          low_stock_threshold: lowStockThreshold,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Social links shown in the footer, contact and about pages.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="font-serif">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" /> Facebook URL
                </Label>
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Instagram URL
                </Label>
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave a field empty to hide that icon. Changes appear across the site immediately.
              </p>
              <div className="space-y-2 border-t border-border/50 pt-4">
                <Label>Low-stock banner threshold</Label>
                <Input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  The &quot;Hurry, only X left&quot; banner shows when a product&apos;s stock is at or below this
                  number (global). Per-product, you can also turn the banner off entirely.
                </p>
              </div>

              <Button onClick={save} disabled={saving} size="sm">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
