import { Facebook, Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/db/queries/settings";

// Facebook / Instagram icon links, driven by admin-editable settings.
// Renders nothing if neither link is set.
export async function SocialLinks({ className = "" }: { className?: string }) {
  let settings: Record<string, string> = {};
  try {
    settings = await getSiteSettings();
  } catch {
    return null;
  }

  const links = [
    { href: settings.facebook_url, label: "Facebook", Icon: Facebook },
    { href: settings.instagram_url, label: "Instagram", Icon: Instagram },
  ].filter((l) => l.href);

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
