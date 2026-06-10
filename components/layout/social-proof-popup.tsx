"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Check } from "lucide-react";
import type { SocialProofItem } from "@/lib/social-proof";

const INITIAL_DELAY = 4000; // before the first popup
const SHOW_MS = 6000; // how long each stays visible
const GAP_MS = 9000; // hidden gap between popups

export function SocialProofPopup() {
  const [items, setItems] = useState<SocialProofItem[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load activity once; respect a per-session dismissal.
  useEffect(() => {
    if (sessionStorage.getItem("sp-dismissed")) {
      setDismissed(true);
      return;
    }
    fetch("/api/social-proof")
      .then((r) => r.json())
      .then((data: SocialProofItem[]) => Array.isArray(data) && setItems(data))
      .catch(() => {});
  }, []);

  // Cycle: show an item, hide, advance, repeat.
  useEffect(() => {
    if (dismissed || items.length === 0) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const loop = () => {
      if (!active) return;
      setVisible(true);
      timer = setTimeout(() => {
        if (!active) return;
        setVisible(false);
        timer = setTimeout(() => {
          if (!active) return;
          setIndex((i) => (i + 1) % items.length);
          loop();
        }, GAP_MS);
      }, SHOW_MS);
    };

    const initial = setTimeout(loop, INITIAL_DELAY);
    return () => {
      active = false;
      clearTimeout(initial);
      clearTimeout(timer);
    };
  }, [items, dismissed]);

  if (dismissed || items.length === 0) return null;
  const item = items[index];

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("sp-dismissed", "1");
  };

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 hidden w-[300px] transition-all duration-500 sm:block ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xl">
        <Link
          href={`/products/${item.slug}`}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted"
        >
          {item.productImage ? (
            <Image
              src={item.productImage}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <ShoppingBag className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-tight">
            <span className="font-semibold">{item.name}</span>
            <span className="text-muted-foreground"> from {item.city}</span>
          </p>
          <Link
            href={`/products/${item.slug}`}
            className="block truncate text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            ordered {item.productName}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary/80">
            <Check className="h-3 w-3" />
            {item.timeAgo}
          </p>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 self-start text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
