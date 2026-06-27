"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { currentDeadline } from "@/lib/pricing";

interface OfferCountdownProps {
  endsAt: string | Date;
  /** When set, the countdown rolls forward this many hours and restarts. */
  repeatHours?: number | null;
  /** "badge" = compact pill for cards; "full" = labelled blocks for detail. */
  variant?: "badge" | "full";
  className?: string;
}

function getRemaining(target: number) {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function OfferCountdown({ endsAt, repeatHours, variant = "badge", className = "" }: OfferCountdownProps) {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Recompute the live deadline each tick: for a repeating offer this rolls
    // forward to the next window, so the countdown restarts instead of ending.
    const tick = () =>
      setRemaining(getRemaining(currentDeadline(endsAt, repeatHours)?.getTime() ?? 0));
    tick();
    // The compact card badge updates per-minute (seconds aren't readable at that
    // size and per-second repaints cause overlay ghost-trails while scrolling on
    // weak in-app browsers). The detail-page block keeps a live per-second tick.
    const intervalMs = variant === "badge" ? 60000 : 1000;
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [endsAt, repeatHours, variant]);

  // Render nothing until mounted (avoids hydration mismatch) or once expired.
  if (!mounted || !remaining) return null;

  if (variant === "badge") {
    const label =
      remaining.days > 0
        ? `${remaining.days}d ${pad(remaining.hours)}h left`
        : `${remaining.hours}h ${pad(remaining.minutes)}m left`;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-semibold text-white ${className}`}
      >
        <Clock className="h-3 w-3" />
        {label}
      </span>
    );
  }

  const blocks: { value: number; label: string }[] = [
    { value: remaining.days, label: "Days" },
    { value: remaining.hours, label: "Hrs" },
    { value: remaining.minutes, label: "Min" },
    { value: remaining.seconds, label: "Sec" },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {blocks.map((b) => (
        <div
          key={b.label}
          className="flex min-w-[3rem] flex-col items-center rounded-md bg-secondary px-2 py-1"
        >
          <span className="font-mono text-lg font-bold tabular-nums text-foreground">
            {pad(b.value)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}
