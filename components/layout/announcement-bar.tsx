import { getActiveAnnouncements } from "@/lib/db/queries/announcements";
import { AnnouncementBarClient } from "./announcement-bar-client";

export async function AnnouncementBar() {
  // Never let a DB hiccup (e.g. a transient blip during build prerender)
  // break the whole layout — just skip the bar.
  let items: Awaited<ReturnType<typeof getActiveAnnouncements>> = [];
  try {
    items = await getActiveAnnouncements();
  } catch {
    return null;
  }
  if (items.length === 0) return null;

  return (
    <AnnouncementBarClient
      items={items.map((a) => ({
        id: a.id,
        text: a.text,
        icon: a.icon,
        href: a.href,
      }))}
    />
  );
}
