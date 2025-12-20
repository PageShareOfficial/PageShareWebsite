import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function CategoryTabs() {
  const categories = await prisma.category.findMany({
    take: 8,
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-8">Explore by Category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300 font-medium"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

