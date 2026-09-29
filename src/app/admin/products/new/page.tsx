import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/ui/Container";
import { getCategories } from "@/lib/queries";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <PageHeader title="Add product" description="You'll add images on the next step." />
      <ProductForm categories={categories} />
    </div>
  );
}
