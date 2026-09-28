import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { Filters, parseFilters } from "@/components/product/Filters";
import { ProductGrid } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { Container, PageHeader } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/Feedback";
import { getCategories, getProducts } from "@/lib/queries";

export const metadata: Metadata = { title: "Shop all shoes" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = parseFilters(await searchParams);
  const q = filters.values.q?.trim() ?? "";

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      q,
      categorySlug: filters.values.category || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
    }),
  ]);

  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title={q ? `Results for “${q}”` : "All shoes"}
        description={`${products.length} product${products.length === 1 ? "" : "s"} found`}
      />
      <Filters action="/search" values={{ ...filters.values, q: q || undefined }} categories={categories} />
      {products.length ? (
        <ProductGrid products={products} priorityCount={4} />
      ) : (
        <EmptyState
          icon={<SearchX className="size-12" />}
          title="No shoes found"
          description="Check the spelling or try a broader search."
          action={<ButtonLink href="/search" variant="secondary">See all shoes</ButtonLink>}
        />
      )}
    </Container>
  );
}
