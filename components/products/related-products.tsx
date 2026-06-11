"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";

type RelatedProduct = React.ComponentProps<typeof ProductCard>["product"];

const STEP = 8; // how many to reveal initially and per "Load more" click

export function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  const [visible, setVisible] = useState(STEP);
  const shown = products.slice(0, visible);
  const remaining = products.length - visible;

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisible((v) => v + STEP)}
          >
            Load more ({remaining} more)
          </Button>
        </div>
      )}
    </div>
  );
}
