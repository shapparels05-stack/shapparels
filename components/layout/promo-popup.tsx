"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

interface Popup {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  frequency: string; // "daily" | "session" | "always"
}

const key = (p: Popup) => `promo:${p.id}:${p.imageUrl}`;

// Whether this popup should stay hidden for the current visitor.
function isSuppressed(p: Popup): boolean {
  if (p.frequency === "always") return false;
  try {
    if (p.frequency === "session") return sessionStorage.getItem(key(p)) === "1";
    const ts = localStorage.getItem(key(p)); // daily
    return !!ts && Date.now() - Number(ts) < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markSeen(p: Popup) {
  try {
    if (p.frequency === "session") sessionStorage.setItem(key(p), "1");
    else if (p.frequency === "daily") localStorage.setItem(key(p), String(Date.now()));
  } catch {
    /* ignore storage errors */
  }
}

export function PromoPopup({ popups }: { popups: Popup[] }) {
  const [active, setActive] = useState<Popup | null>(null);

  useEffect(() => {
    if (popups.length === 0) return;
    let fired = false;

    const onScroll = () => {
      if (fired) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || window.scrollY / max < 0.4) return;
      fired = true;
      window.removeEventListener("scroll", onScroll);
      // Show the highest-priority popup the visitor hasn't dismissed.
      const pick = popups.find((p) => !isSuppressed(p));
      if (pick) setActive(pick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [popups]);

  if (!active) return null;

  const close = () => {
    markSeen(active);
    setActive(null);
  };

  const poster = (
    <Image
      src={active.imageUrl}
      alt={active.title || "Special offer"}
      width={720}
      height={900}
      className="h-auto w-full object-contain"
      priority
    />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>
        {active.linkUrl ? (
          <Link href={active.linkUrl} onClick={() => markSeen(active)} className="block">
            {poster}
          </Link>
        ) : (
          poster
        )}
      </div>
    </div>
  );
}
