"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { useCartStore } from "@/stores/cart-store";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "@/components/products/search-bar";
import { useState, useEffect, useRef } from "react";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  children: CategoryNode[];
}

export function Header() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories/tree")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-serif text-xl font-bold text-primary tracking-wide">
          {SITE_NAME}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            link.label === "Shop" ? (
              <div key={link.href} className="relative" ref={dropdownRef}>
                <button
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith("/products") || pathname.startsWith("/category")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setShowCategories(!showCategories)}
                >
                  {link.label}
                  {categories.length > 0 && <ChevronDown className="h-3 w-3" />}
                </button>
                {showCategories && categories.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-64 rounded-lg border border-border/50 bg-background/95 backdrop-blur-xl shadow-lg p-2">
                    <Link
                      href="/products"
                      onClick={() => setShowCategories(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                    >
                      All Products
                    </Link>
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={() => setShowCategories(false)}
                          className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                        >
                          {cat.name}
                        </Link>
                        {cat.children.length > 0 && (
                          <div className="ml-3 border-l border-border/50 pl-2">
                            {cat.children.map((child) => (
                              <div key={child.id}>
                                <Link
                                  href={`/category/${child.slug}`}
                                  onClick={() => setShowCategories(false)}
                                  className="block rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                                >
                                  {child.name}
                                </Link>
                                {child.children.length > 0 && (
                                  <div className="ml-3 border-l border-border/30 pl-2">
                                    {child.children.map((grandchild) => (
                                      <Link
                                        key={grandchild.id}
                                        href={`/category/${grandchild.slug}`}
                                        onClick={() => setShowCategories(false)}
                                        className="block rounded-md px-3 py-1 text-xs text-muted-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                                      >
                                        {grandchild.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <SearchBar />

          <ThemeToggle />

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} />
    </header>
  );
}
