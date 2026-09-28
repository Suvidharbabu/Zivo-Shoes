import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductCard";
import { SetupNotice } from "@/components/SetupNotice";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { isSupabaseConfigured } from "@/lib/env";
import { getProducts } from "@/lib/queries";
import type { Product } from "@/types";

const CATEGORY_TILES = [
  { name: "Sneakers", slug: "sneakers", image: "/products/sneakers/classic-high-top.jpg", blurb: "Street-ready classics" },
  { name: "Running Shoes", slug: "running-shoes", image: "/products/running-shoes/aerostride.jpg", blurb: "Light, fast, cushioned" },
  { name: "Boots", slug: "boots", image: "/products/boots/timber-classic.jpg", blurb: "Built to last" },
];

async function loadHomeData() {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  try {
    const [featured, ...sections] = await Promise.all([
      getProducts({ featured: true, limit: 8 }),
      ...CATEGORY_TILES.map((c) => getProducts({ categorySlug: c.slug, limit: 4 })),
    ]);
    return { featured, sections };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function SectionHeading({ title, href, subtitle }: { title: string; href: string; subtitle?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-neutral-500">{subtitle}</p>}
      </div>
      <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        View all <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const data = await loadHomeData();

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-600 shadow-sm ring-1 ring-brand-100">
              New season collection
            </p>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl">
              Shoes for <span className="text-brand-600">every step</span> you take.
            </h1>
            <p className="mt-5 text-lg text-neutral-600">
              Sneakers, running shoes and boots designed for comfort and made to last. Free shipping on orders over
              ₹999.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/search" size="lg">
                Shop now
              </ButtonLink>
              <ButtonLink href="/category/running-shoes" size="lg" variant="secondary">
                Running collection
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto aspect-[5/4] w-full max-w-xl">
            <div className="absolute inset-6 rounded-full bg-brand-100/70 blur-3xl" />
            <Image
              src="/products/running-shoes/aerostride.jpg"
              alt="AeroStride running shoes"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="rounded-3xl object-contain mix-blend-multiply"
            />
          </div>
        </Container>
      </section>

      {/* Perks */}
      <Container className="grid gap-4 py-10 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Free shipping", text: "On orders over ₹999" },
          { icon: ShieldCheck, title: "Secure payments", text: "Cards, UPI & netbanking via Razorpay" },
          { icon: RotateCcw, title: "Easy sizing", text: "UK sizes 6–11 on every style" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-4 rounded-2xl border border-neutral-100 p-5">
            <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-neutral-500">{text}</p>
            </div>
          </div>
        ))}
      </Container>

      {/* Categories */}
      <Container className="py-10">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORY_TILES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group relative overflow-hidden rounded-3xl bg-neutral-50 p-6 transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{c.name}</p>
                  <p className="text-sm text-neutral-500">{c.blurb}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-full bg-white text-brand-600 shadow-sm group-hover:bg-brand-600 group-hover:text-white">
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      {"error" in data ? (
        <Container className="py-10">
          <SetupNotice error={data.error} />
        </Container>
      ) : (
        <>
          {data.featured.length > 0 && (
            <Container className="py-12">
              <SectionHeading title="Featured" subtitle="Our favourite picks this season" href="/search" />
              <ProductGrid products={data.featured} />
            </Container>
          )}
          {CATEGORY_TILES.map((c, i) => {
            const products: Product[] = data.sections[i] ?? [];
            if (!products.length) return null;
            return (
              <Container key={c.slug} className="py-12">
                <SectionHeading title={c.name} subtitle={c.blurb} href={`/category/${c.slug}`} />
                <ProductGrid products={products} />
              </Container>
            );
          })}
        </>
      )}
    </>
  );
}
