import Link from "next/link";
import { SITE_NAME, WHATSAPP_NUMBER } from "@/lib/constants";
import { SocialLinks } from "@/components/shared/social-links";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-primary">
              {SITE_NAME}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Your destination for premium ladies beauty products. Discover
              elegant bags, jewelry, cosmetics, accessories &amp; clothing.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground">
              Quick Links
            </h4>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Shop All", href: "/products" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "FAQ", href: "/faq" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground">
              Categories
            </h4>
            <ul className="mt-3 space-y-2">
              {["Bags", "Jewelry", "Cosmetics", "Accessories", "Clothing"].map(
                (cat) => (
                  <li key={cat}>
                    <Link
                      href={`/category/${cat.toLowerCase()}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {cat}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground">
              Contact Us
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Pakistan</li>
              {WHATSAPP_NUMBER && (
                <li>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-primary"
                  >
                    WhatsApp: +{WHATSAPP_NUMBER}
                  </a>
                </li>
              )}
              <li>Cash on Delivery Available</li>
            </ul>
            <SocialLinks className="mt-4" />
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
