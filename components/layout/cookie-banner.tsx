"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  // Show only until the visitor acknowledges (persisted across visits).
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  // Continuing to browse (scrolling) counts as acceptance — hide on scroll.
  useEffect(() => {
    if (!visible) return;
    const onScroll = () => {
      if (window.scrollY > 120) {
        localStorage.setItem(STORAGE_KEY, "accepted");
        setVisible(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          We use cookies to improve your experience and to understand how our
          store is used (analytics &amp; advertising). By continuing to browse,
          you agree to our use of cookies.
        </p>
        <Button onClick={accept} className="w-full shrink-0 sm:w-auto">
          Got it
        </Button>
      </div>
    </div>
  );
}
