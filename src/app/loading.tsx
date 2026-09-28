import { ProductGridSkeleton } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Feedback";

export default function Loading() {
  return (
    <Container className="space-y-8 py-10">
      <div className="space-y-3 border-b border-neutral-100 pb-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <ProductGridSkeleton />
    </Container>
  );
}
