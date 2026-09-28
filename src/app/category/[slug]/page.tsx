import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { Filters, parseFilters } from "@/components/product/Filters";
import { ProductGrid } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { Container, PageHeader } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/Feedback";
import { getCategoryBySlug, getProducts } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  return { title: category?.name ?? "Category", description: category?.description };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const filters = parseFilters(await searchParams);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProducts({
    categorySlug: slug,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
  });

  return (
    <Container className="space-y-8 py-10">
      <PageHeader title={category.name} description={category.description}>
        <p className="text-sm text-neutral-500">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>
      </PageHeader>
      <Filters action={`/category/${slug}`} values={filters.values} />
      {products.length ? (
        <ProductGrid products={products} priorityCount={4} />
      ) : (
        <EmptyState
          icon={<PackageSearch className="size-12" />}
          title="No shoes match these filters"
          description="Try a different price range."
          action={<ButtonLink href={`/category/${slug}`} variant="secondary">Clear filters</ButtonLink>}
        />
      )}
    </Container>
  );
}
