"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { useState } from "react";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories?: CategoryNode[];
}

export function MobileNav({ open, onClose, categories = [] }: MobileNavProps) {
  const pathname = usePathname();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderCategoryTree = (nodes: CategoryNode[], depth: number = 0) => (
    <div className={depth > 0 ? "ml-4 border-l border-border/50 pl-2" : ""}>
      {nodes.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center">
            <Link
              href={`/category/${cat.slug}`}
              onClick={onClose}
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              {cat.name}
            </Link>
            {cat.children.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => toggleExpand(cat.id)}
              >
                {expandedIds.has(cat.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          {cat.children.length > 0 && expandedIds.has(cat.id) && renderCategoryTree(cat.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl text-primary">
            {SITE_NAME}
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <div key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                  pathname === link.href
                    ? "bg-accent text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
              {link.label === "Shop" && categories.length > 0 && (
                <div className="mt-1">
                  {renderCategoryTree(categories)}
                </div>
              )}
            </div>
          ))}
        </nav>
        <Separator className="my-4" />
        <div className="flex flex-col gap-2">
          <Link
            href="/faq"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            FAQ
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
