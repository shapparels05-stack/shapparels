"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ANNOUNCEMENT_ICONS } from "./announcement-icons";

export interface AnnouncementItem {
  id: string;
  text: string;
  icon: string | null;
  href: string | null;
}

const ROTATE_MS = 4000;

export function AnnouncementBarClient({ items }: { items: AnnouncementItem[] }) {
  const [index, setIndex] = useState(0);

  // Rotate one announcement at a time (like the hero carousel).
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="relative h-9 overflow-hidden bg-primary text-primary-foreground">
      {items.map((item, i) => {
        const Icon = item.icon ? ANNOUNCEMENT_ICONS[item.icon] : null;
        const inner = (
          <span className="flex items-center justify-center gap-2 text-sm font-medium">
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="truncate">{item.text}</span>
          </span>
        );
        return (
          <div
            key={item.id}
            className={`absolute inset-0 flex items-center justify-center px-4 text-center transition-opacity duration-500 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </div>
        );
      })}
    </div>
  );
}
